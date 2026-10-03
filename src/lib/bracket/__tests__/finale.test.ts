import { test, expect } from "vitest";
import { bracketPlayers, bracketVotes } from "@/db/schema";
import { makeTestDb } from "./testDb";
import { castVote, hostAction, loadSnapshot, lockTbGuess, setWager, type Db } from "../store";
import { FINAL, parts, ROUNDS, scoreboard, seededRng } from "../engine";
import { buildPlayerView, buildPublicView } from "../view";

const rng = seededRng(9);
let now = Date.UTC(2026, 9, 3, 3);
const tick = () => (now += 1000);

/** Four players vote the same side on matches 0–13 (14 points each), then reach the Final Wager. */
async function toWager(db: Db) {
  await db.insert(bracketPlayers).values(["A", "B", "C", "D"].map((id) => ({ id, name: id, deviceToken: `t${id}` })));
  await hostAction(db, "openRound", { now: tick(), rng });
  for (let r = 0; r < 3; r++) {
    await db
      .insert(bracketVotes)
      .values(["A", "B", "C", "D"].flatMap((p) => ROUNDS[r].map((m) => ({ playerId: p, matchId: m, bearNum: parts(m)[0], at: new Date(tick()) }))));
    await hostAction(db, "lockRound", { now: tick(), rng });
    for (let i = 0; i < ROUNDS[r].length; i++) {
      await hostAction(db, "revealParty", { now: tick(), rng });
      await hostAction(db, "revealKatmai", { now: tick(), rng });
      if (i < ROUNDS[r].length - 1) await hostAction(db, "nextMatch", { now: tick(), rng });
    }
    await hostAction(db, r < 2 ? "openRound" : "openWager", { now: tick(), rng });
  }
}

async function finalWith(db: Db, picks: Record<string, "a" | "b" | null>) {
  await hostAction(db, "openFinal", { now: tick(), rng });
  for (const [p, side] of Object.entries(picks)) if (side) await castVote(db, p, FINAL, parts(FINAL)[side === "a" ? 0 : 1], tick());
  await hostAction(db, "lockRound", { now: tick(), rng });
  await hostAction(db, "revealParty", { now: tick(), rng });
}

const scores = async (db: Db) => Object.fromEntries(scoreboard((await loadSnapshot(db)).snap, now).map((l) => [l.playerId, l.score]));

test("all-in against the room drops to the right score; non-voter loses bet; bets are secret until the party reveal", async () => {
  const db = await makeTestDb();
  await toWager(db);
  await setWager(db, "A", 999, true, tick()); // clamped to 14
  await setWager(db, "B", 5, true, tick());
  await setWager(db, "C", 3, false, tick()); // never locked → doesn't count
  await setWager(db, "D", 4, true, tick());

  // While betting and during Final voting, no screen sees an amount.
  const during = JSON.stringify(buildPublicView((await loadSnapshot(db)).snap, 1, now));
  expect(during).not.toMatch(/BET/);
  const { snap } = await loadSnapshot(db);
  expect(buildPublicView(snap, 1, now).wager!.rows.every((r) => Object.keys(r).join() === "name,locked")).toBe(true);

  await finalWith(db, { A: "b", B: "a", C: "a", D: null }); // room = a (2–1)
  const s = await scores(db);
  expect(s).toEqual({ A: 14 + 0 - 14, B: 14 + 1 + 5, C: 14 + 1, D: 14 - 4 });

  const tv = buildPublicView((await loadSnapshot(db)).snap, 1, now);
  expect(tv.leaders.find((l) => l.name === "A")?.delta).toBe("−14 BET");
  const phoneA = buildPlayerView((await loadSnapshot(db)).snap, 1, now, { playerId: "A", guests: [], signedIn: null, viewingAs: false });
  expect(phoneA.me?.result).toBe("AGAINST THE ROOM · 0 PTS · BET −14");
});

test("a split Final keeps every bet", async () => {
  const db = await makeTestDb();
  await toWager(db);
  await setWager(db, "A", 14, true, tick());
  await setWager(db, "B", 7, true, tick());
  await finalWith(db, { A: "a", B: "b", C: "a", D: "b" });
  expect(await scores(db)).toEqual({ A: 15, B: 15, C: 15, D: 15 });
});

test("bets close when the Final opens", async () => {
  const db = await makeTestDb();
  await toWager(db);
  await hostAction(db, "openFinal", { now: tick(), rng });
  await expect(setWager(db, "A", 3, true, tick())).rejects.toThrow("Bets are closed.");
});

test("tiebreaker: only tied players guess, once; equal distance goes to the earlier lock", async () => {
  const db = await makeTestDb();
  await toWager(db);
  await finalWith(db, { A: "a", B: "a", C: "b", D: "b" }); // split, everyone 15 → 4-way tie
  await hostAction(db, "revealKatmai", { now: tick(), rng });
  await hostAction(db, "startTiebreaker", { now: tick(), rng });

  // Backpack (89) party votes: m5 side b got 0 (all voted a), m10 b 0, m13 a 4, m14 b 2 → 6
  await lockTbGuess(db, "B", 8, tick()); // off by 2, earlier
  await lockTbGuess(db, "A", 4, tick()); // off by 2, later
  await expect(lockTbGuess(db, "A", 6, tick())).rejects.toThrow("already locked");
  await lockTbGuess(db, "C", 20, tick());

  const before = buildPublicView((await loadSnapshot(db)).snap, 1, now);
  expect(before.tb!.rows.map((r) => r.status)).toEqual(["LOCKED", "LOCKED", "LOCKED", "THINKING..."]);
  expect(before.tb!.answer).toBeNull();

  await hostAction(db, "revealTiebreaker", { now: tick(), rng });
  const after = buildPublicView((await loadSnapshot(db)).snap, 1, now);
  expect(after.tb!.answer).toBe(6);
  expect(after.tb!.champion).toBe("B");
  expect(after.tb!.sameNote).toBe(true);
  expect(after.tb!.rows.map((r) => r.status)).toEqual(["8 · OFF BY 2", "4 · OFF BY 2", "20 · OFF BY 14", "NO GUESS"]);
  expect(after.leaders[0].name).toBe("B");
  const phoneA = buildPlayerView((await loadSnapshot(db)).snap, 1, now, { playerId: "A", guests: [], signedIn: null, viewingAs: false });
  expect(phoneA.me?.tb).toEqual({ tied: true, guess: 4, off: 2 });
});

test("jump to Final (rehearsal): earlier rounds revealed with bot votes, bot bets locked, undo goes back", async () => {
  const { addBots, jumpTo, setGameSettings } = await import("../store");
  const db = await makeTestDb();
  await setGameSettings(db, { mode: "rehearsal" });
  await addBots(db, 4, { now: tick(), rng });
  await jumpTo(db, "final", { now: tick(), rng });
  const { snap, history } = await loadSnapshot(db);
  expect(snap.game).toMatchObject({ round: 3, phase: "voting" });
  expect(Object.keys(snap.game.reveal)).toHaveLength(14);
  const board = scoreboard(snap, now);
  expect(board.every((l) => l.base > 0)).toBe(true);
  expect(snap.wagers).toHaveLength(4);
  expect(board.some((l) => l.betLocked)).toBe(true);
  expect(history.at(-1)?.phase).toBe("lobby");
  await hostAction(db, "undo", { now: tick(), rng });
  expect((await loadSnapshot(db)).snap.game.phase).toBe("lobby");
});

test("jump to is refused in live mode", async () => {
  const { jumpTo } = await import("../store");
  const db = await makeTestDb();
  await expect(jumpTo(db, "semis", { now: tick(), rng })).rejects.toThrow("rehearsal-only");
});

test("jump to keeps votes real players already cast in the open round", async () => {
  const { addBots, jumpTo, setGameSettings } = await import("../store");
  const db = await makeTestDb();
  await setGameSettings(db, { mode: "rehearsal" });
  await addBots(db, 2, { now: tick(), rng });
  await db.insert(bracketPlayers).values({ id: "me", name: "Me", deviceToken: "tme" });
  await hostAction(db, "openRound", { now: tick(), rng });
  for (const m of ROUNDS[0]) await castVote(db, "me", m, parts(m)[0], tick());
  await jumpTo(db, "semis", { now: tick(), rng });
  const { snap } = await loadSnapshot(db);
  const me = scoreboard(snap, now).find((l) => l.playerId === "me")!;
  const bots = scoreboard(snap, now).filter((l) => l.isBot);
  expect(me.base).toBeGreaterThan(0);
  expect(bots.every((b) => b.base > 0)).toBe(true);
});
