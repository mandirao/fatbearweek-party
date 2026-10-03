import { describe, test, expect } from "vitest";
import { asc } from "drizzle-orm";
import { guests, bracketPlayers, bracketVotes } from "@/db/schema";
import { makeTestDb } from "./testDb";
import { simulateGame } from "../sim";
import { castVote, hostAction, loadSnapshot, resetBracket, setGameSettings, addBots, BracketError } from "../store";
import { champion, parts, seededRng } from "../engine";

const now = Date.UTC(2026, 9, 3, 2);
const rng = seededRng(3);

describe("full game with 10 bots", () => {
  test("plays all 15 matches through the tiebreaker to a champion", async () => {
    const db = await makeTestDb();
    const { log, steps, finalSnapshot, now: end } = await simulateGame(db, { bots: 10 });
    expect(steps[0]).toBe("Open Round 1");
    expect(steps).toContain("Open the Final Wager");
    expect(steps).toContain("Lock bets · open the Final");
    expect(steps.some((s) => s.startsWith("Start tiebreaker"))).toBe(true);
    expect(steps.at(-1)).toMatch(/^Party champion: Bot \d+$/);
    expect(Object.keys(finalSnapshot.game.reveal)).toHaveLength(15);
    expect(finalSnapshot.game.finishedAt).not.toBeNull();
    expect(champion(finalSnapshot, end)).not.toBeNull();
    expect(log).toContain("TIEBREAKER");
  });
});

describe("reset", () => {
  test("wipes Bracket Night and never touches guests, RSVPs, plus-ones, potluck or bears", async () => {
    const db = await makeTestDb();
    await db.insert(guests).values([
      { id: "g1", name: "Maya", status: "yes", extraGuests: 2, bear: "128 Grazer", dishId: 3 },
      { id: "g2", name: "Theo", status: "no", extraGuests: 0, bear: null, dishId: null },
      { id: "g3", name: "Priya", status: "yes", extraGuests: 1, bear: "32 Chunk", dishId: 17 },
    ]);
    const before = await db.select().from(guests).orderBy(asc(guests.id));

    await simulateGame(db, { bots: 6 });
    await resetBracket(db);

    const after = await db.select().from(guests).orderBy(asc(guests.id));
    expect(after).toEqual(before);

    const { snap, history } = await loadSnapshot(db);
    expect(snap.players).toEqual([]);
    expect(snap.votes).toEqual([]);
    expect(snap.talk).toEqual([]);
    expect(snap.wagers).toEqual([]);
    expect(snap.tbGuesses).toEqual([]);
    expect(history).toEqual([]);
    expect(snap.game).toMatchObject({ mode: "live", onAir: false, round: 0, phase: "lobby", reveal: {}, finishedAt: null });
  });
});

describe("races and validation", () => {
  test("a stale double-tap is rejected instead of skipping a beat", async () => {
    const db = await makeTestDb();
    const { version } = await loadSnapshot(db);
    await hostAction(db, "openRound", { now, rng, expectedVersion: version });
    await expect(hostAction(db, "lockRound", { now, rng, expectedVersion: version })).rejects.toBeInstanceOf(BracketError);
    expect((await loadSnapshot(db)).snap.game.phase).toBe("voting");
  });

  test("votes are changeable while open, frozen after lock", async () => {
    const db = await makeTestDb();
    await db.insert(bracketPlayers).values({ id: "p1", name: "Maya", deviceToken: "t1" });
    await hostAction(db, "openRound", { now, rng });
    const [a, b] = parts(0);
    await castVote(db, "p1", 0, a, now);
    await castVote(db, "p1", 0, b, now + 1);
    expect((await db.select().from(bracketVotes)).map((v) => v.bearNum)).toEqual([b]);
    await expect(castVote(db, "p1", 8, parts(8)[0], now)).rejects.toThrow("Voting is closed for that match.");
    await hostAction(db, "lockRound", { now: now + 2, rng });
    await expect(castVote(db, "p1", 0, a, now + 3)).rejects.toThrow("Voting is closed for that match.");
  });

  test("bots are rehearsal-only", async () => {
    const db = await makeTestDb();
    await expect(addBots(db, 3, { now, rng })).rejects.toThrow("rehearsal");
    await setGameSettings(db, { mode: "rehearsal" });
    await addBots(db, 3, { now, rng });
    expect((await loadSnapshot(db)).snap.players.map((p) => p.name)).toEqual(["Bot 1", "Bot 2", "Bot 3"]);
  });


  test("can't switch to Live while bots are in the game", async () => {
    const db = await makeTestDb();
    await setGameSettings(db, { mode: "rehearsal" });
    await addBots(db, 2, { now, rng });
    await expect(setGameSettings(db, { mode: "live" })).rejects.toThrow("Reset Bracket Night");
    await resetBracket(db);
    expect((await loadSnapshot(db)).snap.game.mode).toBe("live");
  });
});
