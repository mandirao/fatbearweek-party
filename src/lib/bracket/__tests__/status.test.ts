import { test, expect } from "vitest";
import { buildStatus, buildFinalBoard } from "../view";
import { FINAL, initialGame, parts, ROUNDS, type GameState, type Snapshot } from "../engine";

const T0 = 1_000_000;
const snap = (game: Partial<GameState>, votes: Snapshot["votes"] = []): Snapshot => ({
  game: { ...initialGame(), ...game },
  players: ["me", "you"].map((id) => ({ id, name: id, guestId: null, isPlusOne: false, isBot: false, bonus: 0, joinedAt: T0 })),
  votes,
  talk: [],
  wagers: [],
  tbGuesses: [],
});

test("tab is locked only before the host first goes live", () => {
  expect(buildStatus(snap({}), T0, null).tabLocked).toBe(true);
  expect(buildStatus(snap({ onAir: true }), T0, null).tabLocked).toBe(false);
  // Paused mid-game: tab stays open so phones can show "Paused by the host".
  expect(buildStatus(snap({ onAir: false, phase: "voting" }), T0, null).tabLocked).toBe(false);
});

test("banner knows whether my card is in", () => {
  const votes = ROUNDS[0].map((m) => ({ playerId: "me", matchId: m, bearNum: parts(m)[0], at: T0 }));
  const s = buildStatus(snap({ onAir: true, phase: "voting" }, votes), T0, "me");
  expect(s.me).toEqual({ joined: true, cardDone: true });
  expect(s.cards).toEqual({ done: 1, total: 2 });
  expect(buildStatus(snap({ onAir: true, phase: "voting" }, votes), T0, null).me.joined).toBe(false);
});

test("finished game: champion banner data and the full board", () => {
  const reveal: GameState["reveal"] = {};
  for (let m = 0; m <= FINAL; m++) reveal[m] = 2;
  const votes = [{ playerId: "me", matchId: 0, bearNum: parts(0)[0], at: T0 }];
  const s = snap({ round: 3, phase: "reveal", reveal, finishedAt: T0, lockedAt: { 0: T0, 1: T0, 2: T0, 3: T0 } }, votes);
  const st = buildStatus(s, T0, "me");
  expect(st).toMatchObject({ champion: "me", bearChampion: "Backpack", finishedAt: T0, tabLocked: false });
  const board = buildFinalBoard(s, T0)!;
  expect(board.players[0]).toMatchObject({ name: "me", score: 1, picks: { 0: parts(0)[0] } });
  expect(board.slots.find((x) => x.big)?.num).toBe(89);
  expect(buildFinalBoard(snap({}), T0)).toBeNull();
});
