import { test, expect } from "vitest";
import { buildPublicView, buildHostView } from "../view";
import { FINAL, initialGame, OFFICIAL, parts, type GameState, type Snapshot } from "../engine";

const T0 = 1_000_000;

function snap(game: Partial<GameState>, picks: Record<string, Record<number, "a" | "b">> = {}): Snapshot {
  const ids = Object.keys(picks);
  return {
    game: { ...initialGame(), onAir: true, ...game },
    players: ids.map((id) => ({ id, name: id, guestId: null, isPlusOne: false, isBot: false, bonus: 0, joinedAt: T0 })),
    votes: ids.flatMap((id) =>
      Object.entries(picks[id]).map(([m, side]) => ({
        playerId: id,
        matchId: Number(m),
        bearNum: parts(Number(m))[side === "a" ? 0 : 1],
        at: T0,
      })),
    ),
    talk: [],
    wagers: [],
    tbGuesses: [],
  };
}

test("official counts never leave the server before Katmai's reveal", () => {
  const base = { phase: "reveal" as const, lockedAt: { 0: T0 } };
  for (const lvl of [0, 1] as const) {
    const json = JSON.stringify(buildPublicView(snap({ ...base, reveal: { 0: lvl } }, { p: { 0: "a" } }), 1, T0));
    expect(json).not.toContain(String(OFFICIAL[0].aVotes));
    expect(json).not.toContain(String(OFFICIAL[0].bVotes));
  }
  const shown = buildPublicView(snap({ ...base, reveal: { 0: 2 } }, { p: { 0: "a" } }), 1, T0);
  expect(shown.reveal?.katmai).toEqual([OFFICIAL[0].aVotes, OFFICIAL[0].bVotes]);
});

test("a match nobody voted on is not a split room", () => {
  const v = buildPublicView(snap({ phase: "reveal", reveal: { 0: 1 }, lockedAt: { 0: T0 } }, { p: {} }), 1, T0);
  expect(v.reveal?.party).toEqual([0, 0]);
  expect(v.reveal?.split).toBe(false);
});

test("tiebreaker winner tops the leaderboard", () => {
  const reveal: GameState["reveal"] = {};
  for (let m = 0; m <= FINAL; m++) reveal[m] = 2;
  const s = snap(
    { round: 3, phase: "tbDone", reveal, lockedAt: { 0: T0, 1: T0, 2: T0, 3: T0 }, tbClosedAt: T0 },
    { Ann: { 0: "a" }, Zed: { 0: "a" } },
  );
  s.tbGuesses = [{ playerId: "Zed", value: 2, lockedAt: T0 - 1 }]; // answer is 0 here; Ann never guessed
  const v = buildPublicView(s, 1, T0);
  expect(v.champion).toBe("Zed");
  expect(v.leaders[0].name).toBe("Zed");
  expect(buildHostView(s, 1, [], T0).players[0].name).toBe("Zed");
});
