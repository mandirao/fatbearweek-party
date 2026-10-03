import { describe, test, expect } from "vitest";
import {
  applyHostAction,
  BRACKET_BEARS,
  champion,
  FINAL,
  hostPrimary,
  initialGame,
  isBusted,
  matchPoints,
  countedVotes,
  OFFICIAL,
  parts,
  planBots,
  scoreboard,
  seededRng,
  tiebreakerRanking,
  tiedForFirst,
  type GameState,
  type Player,
  type Snapshot,
  type Vote,
} from "../engine";

const T0 = 1_000_000;

function player(id: string, extra: Partial<Player> = {}): Player {
  return { id, name: id, guestId: null, isPlusOne: false, isBot: false, bonus: 0, joinedAt: T0, ...extra };
}

/** picks: playerId → matchId → 'a' | 'b' (side of the match) */
function snapshot(
  ids: string[],
  picks: Record<string, Record<number, "a" | "b">>,
  game: Partial<GameState> = {},
  extra: Partial<Snapshot> = {},
): Snapshot {
  const votes: Vote[] = [];
  for (const [pid, ms] of Object.entries(picks))
    for (const [m, side] of Object.entries(ms)) {
      const [a, b] = parts(Number(m));
      votes.push({ playerId: pid, matchId: Number(m), bearNum: side === "a" ? a : b, at: T0 });
    }
  return {
    game: { ...initialGame(), ...game },
    players: ids.map((id) => player(id)),
    votes,
    talk: [],
    wagers: [],
    tbGuesses: [],
    ...extra,
  };
}

/** Every match 0..13 fully revealed, Final at `finalLevel`, round 3 reveal. */
function finalGame(finalLevel: 0 | 1 | 2): Partial<GameState> {
  const reveal: GameState["reveal"] = {};
  for (let m = 0; m < FINAL; m++) reveal[m] = 2;
  reveal[FINAL] = finalLevel;
  return { round: 3, phase: "reveal", revealIdx: 0, reveal, lockedAt: { 0: T0, 1: T0, 2: T0, 3: T0 }, wagerClosedAt: T0 };
}

describe("data", () => {
  test("bracket advances the official winner and every pairing matches the JSON", () => {
    for (const m of OFFICIAL) {
      expect(parts(m.id)).toEqual([m.a, m.b]);
      expect([m.a, m.b]).toContain(m.winner);
      expect(m.winner).toBe(m.aVotes > m.bVotes ? m.a : m.b);
    }
  });
  test("all 16 bracket bears have content and a local photo", () => {
    const nums = new Set(OFFICIAL.slice(0, 8).flatMap((m) => [m.a, m.b]));
    expect(nums.size).toBe(16);
    for (const n of nums) {
      const b = BRACKET_BEARS.find((x) => x.num === n);
      expect(b?.photo).toBe(`/bracket/${n}.jpg`);
      expect(b?.hook).toBeTruthy();
    }
  });
});

describe("match scoring", () => {
  test("4–4 tie: split room, every voter scores, nobody busted, non-voter gets 0", () => {
    const ids = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "nobody"];
    const picks: Record<string, Record<number, "a" | "b">> = {};
    ids.slice(0, 8).forEach((id, i) => (picks[id] = { 0: i < 4 ? "a" : "b" }));
    const s = snapshot(ids, picks, { phase: "reveal", reveal: { 0: 2 }, lockedAt: { 0: T0 } });
    const votes = countedVotes(s, T0);
    expect(matchPoints(parts(0)[0], votes, 0)).toEqual({ points: 1, reason: "split" });
    expect(isBusted(s.game, votes, 0)).toBe(false);
    const board = scoreboard(s, T0);
    expect(board.filter((l) => l.score === 1)).toHaveLength(8);
    expect(board.find((l) => l.playerId === "nobody")?.score).toBe(0);
  });

  test("with the room +1, against 0; points only count once party vote is revealed", () => {
    const s = snapshot(["a1", "a2", "b1"], { a1: { 0: "a" }, a2: { 0: "a" }, b1: { 0: "b" } }, { phase: "reveal", lockedAt: { 0: T0 } });
    expect(scoreboard(s, T0).every((l) => l.score === 0)).toBe(true);
    s.game.reveal = { 0: 1 };
    const sc = Object.fromEntries(scoreboard(s, T0).map((l) => [l.playerId, l.score]));
    expect(sc).toEqual({ a1: 1, a2: 1, b1: 0 });
  });

  test("bracket buster when the party majority loses Katmai's vote", () => {
    // Match 3: 131 vs 910, Katmai sent 910 (b). Party picks 131 (a).
    const s = snapshot(["x", "y"], { x: { 3: "a" }, y: { 3: "a" } }, { phase: "reveal", reveal: { 3: 1 }, lockedAt: { 0: T0 } });
    expect(isBusted(s.game, countedVotes(s, T0), 3)).toBe(false); // not until level 2
    s.game.reveal = { 3: 2 };
    expect(isBusted(s.game, countedVotes(s, T0), 3)).toBe(true);
  });

  test("bot votes stamped in the future don't count yet; votes after lock never count", () => {
    const s = snapshot(["p"], {}, { phase: "voting" });
    s.votes.push({ playerId: "p", matchId: 0, bearNum: parts(0)[0], at: T0 + 5000 });
    expect(countedVotes(s, T0)).toHaveLength(0);
    expect(countedVotes(s, T0 + 5000)).toHaveLength(1);
    s.game.lockedAt = { 0: T0 + 1000 };
    expect(countedVotes(s, T0 + 9999)).toHaveLength(0);
  });
});

describe("final wager", () => {
  // Every player scores 14 on matches 0–13 (unanimous), then the Final decides.
  function wagerGame(finalPicks: Record<string, "a" | "b" | null>, wagers: Record<string, number>) {
    const ids = Object.keys(finalPicks);
    const picks: Record<string, Record<number, "a" | "b">> = {};
    for (const id of ids) {
      picks[id] = {};
      for (let m = 0; m < FINAL; m++) picks[id][m] = "a";
      const f = finalPicks[id];
      if (f) picks[id][FINAL] = f;
    }
    return snapshot(ids, picks, finalGame(1), {
      wagers: Object.entries(wagers).map(([playerId, amount]) => ({ playerId, amount, lockedAt: T0 - 1 })),
    });
  }

  test("all-in won and lost", () => {
    const s = wagerGame({ w: "a", w2: "a", l: "b" }, { w: 99, l: 14 });
    const sc = Object.fromEntries(scoreboard(s, T0).map((l) => [l.playerId, l]));
    expect(sc.w.bet).toBe(14); // clamped to score after the Semis
    expect(sc.w.wagerResult).toBe("won");
    expect(sc.w.score).toBe(14 + 1 + 14);
    expect(sc.l.wagerResult).toBe("lost");
    expect(sc.l.score).toBe(14 + 0 - 14);
  });

  test("split Final keeps the bet", () => {
    const s = wagerGame({ x: "a", y: "b" }, { x: 10, y: 5 });
    const sc = Object.fromEntries(scoreboard(s, T0).map((l) => [l.playerId, l]));
    expect(sc.x.wagerResult).toBe("kept");
    expect(sc.x.score).toBe(14 + 1);
    expect(sc.y.score).toBe(14 + 1);
  });

  test("didn't vote in the Final → loses the bet", () => {
    const s = wagerGame({ v: "a", v2: "a", gone: null }, { gone: 7 });
    const gone = scoreboard(s, T0).find((l) => l.playerId === "gone")!;
    expect(gone.wagerResult).toBe("noVote");
    expect(gone.score).toBe(14 - 7);
  });

  test("unlocked bets and bets locked after the Final opened don't count", () => {
    const s = wagerGame({ a: "a", b: "a" }, {});
    s.wagers = [
      { playerId: "a", amount: 5, lockedAt: null },
      { playerId: "b", amount: 5, lockedAt: T0 + 1 },
    ];
    expect(scoreboard(s, T0 + 10).every((l) => l.bet === 0)).toBe(true);
  });
});

describe("tiebreaker", () => {
  test("3-way tie for first triggers the tiebreaker", () => {
    const picks: Record<string, Record<number, "a" | "b">> = {};
    for (const id of ["t1", "t2", "t3"]) picks[id] = { 0: "a" };
    picks.low = { 0: "b" };
    const s = snapshot(["t1", "t2", "t3", "low"], picks, finalGame(2));
    expect(tiedForFirst(s, T0).map((l) => l.playerId).sort()).toEqual(["t1", "t2", "t3"]);
    expect(hostPrimary(s, T0)).toEqual({ action: "startTiebreaker", label: "Start tiebreaker · 3-way tie" });
    expect(champion(s, T0)).toBeNull();
  });

  test("equal distance → earliest lock wins; no guess is last", () => {
    // Backpack (89) is side b of match 5 and side a of 10, 13; side b of 14.
    const picks: Record<string, Record<number, "a" | "b">> = {
      t1: { 5: "b", 10: "b", 13: "a", 14: "b" },
      t2: { 5: "b", 10: "b", 13: "a", 14: "b" },
      t3: { 5: "b", 10: "b", 13: "a", 14: "b" },
    };
    const s = snapshot(["t1", "t2", "t3"], picks, { ...finalGame(2), phase: "tbDone", tbClosedAt: T0 });
    // 89 is b in match 5 (610 vs 89), b in 10 (620 vs 89), a in 13 (89 vs 164), b in 14 (910 vs 89).
    // t1..t3 vote b,b,a,b → 3 votes for 89 in 5, 10, 14; in 13 they voted "a" = 89 → 3. Answer 12.
    const r0 = tiebreakerRanking(s, T0);
    expect(r0.answer).toBe(12);
    s.tbGuesses = [
      { playerId: "t1", value: 15, lockedAt: T0 - 50 }, // off by 3, later
      { playerId: "t2", value: 9, lockedAt: T0 - 90 }, // off by 3, earlier
    ];
    const r = tiebreakerRanking(s, T0);
    expect(r.rows.map((x) => x.playerId)).toEqual(["t2", "t1", "t3"]);
    expect(r.rows.map((x) => x.off)).toEqual([3, 3, null]);
    expect(r.sameDistanceDecided).toBe(true);
    expect(champion(s, T0)?.playerId).toBe("t2");
  });
});

describe("host actions", () => {
  const run = (s: Snapshot, h: GameState[], a: Parameters<typeof applyHostAction>[2]) => {
    const r = applyHostAction(s, h, a, T0);
    if (!r.ok) throw new Error(r.error);
    s.game = r.game;
    return r.history;
  };

  test("undo after revealKatmai restores level 1", () => {
    const s = snapshot(["p"], { p: { 0: "a" } });
    let h: GameState[] = [];
    for (const a of ["openRound", "lockRound", "revealParty", "revealKatmai"] as const) h = run(s, h, a);
    expect(s.game.reveal[0]).toBe(2);
    h = run(s, h, "undo");
    expect(s.game.reveal[0]).toBe(1);
    expect(s.game.phase).toBe("reveal");
  });

  test("invalid actions are rejected with a clear error, never skipped", () => {
    const s = snapshot(["p"], {});
    expect(applyHostAction(s, [], "revealKatmai", T0)).toEqual({ ok: false, error: "Not revealing right now." });
    expect(applyHostAction(s, [], "undo", T0)).toEqual({ ok: false, error: "Nothing to undo." });
    const h = run(s, [], "openRound");
    run(s, h, "lockRound");
    expect(applyHostAction(s, h, "revealKatmai", T0)).toEqual({ ok: false, error: "Reveal the party vote first." });
    expect(applyHostAction(s, h, "openRound", T0).ok).toBe(false);
  });

  test("undo keeps on-air and mode as they are now", () => {
    const s = snapshot(["p"], {});
    const h = run(s, [], "openRound");
    s.game.onAir = true;
    s.game.mode = "rehearsal";
    run(s, h, "undo");
    expect(s.game.phase).toBe("lobby");
    expect(s.game.onAir).toBe(true);
    expect(s.game.mode).toBe("rehearsal");
  });

  test("primary button labels follow the documented order", () => {
    const s = snapshot(["p", "q"], { p: { 0: "a" } });
    expect(hostPrimary(s, T0).label).toBe("Open Round 1");
    const h = run(s, [], "openRound");
    expect(hostPrimary(s, T0).label).toBe("Lock round · 0/2 in");
    run(s, h, "lockRound");
    expect(hostPrimary(s, T0).label).toBe("Reveal party vote");
  });
});

describe("bots", () => {
  test("bots vote every open match within 1–10 s and skip ones they've voted", () => {
    const s = snapshot(["b1"], {}, { phase: "voting", round: 1 });
    s.players[0].isBot = true;
    const plan = planBots(s, T0, seededRng(1));
    expect(plan.votes.map((v) => v.matchId)).toEqual([8, 9, 10, 11]);
    for (const v of plan.votes) {
      expect(v.at).toBeGreaterThanOrEqual(T0 + 1000);
      expect(v.at).toBeLessThanOrEqual(T0 + 10000);
    }
    s.votes = plan.votes;
    expect(planBots(s, T0, seededRng(2)).votes).toHaveLength(0);
  });
});
