import { test, expect } from "vitest";
import { makeTestDb } from "./testDb";
import {
  castVote,
  findPlayerByToken,
  hostAction,
  joinPlayer,
  loadSnapshot,
  postTalk,
  reclaimPlayer,
  undoRejoin,
} from "../store";
import { parts, seededRng } from "../engine";

const now = Date.UTC(2026, 9, 3, 2);
const rng = seededRng(5);

test("roster guest joins once; a second phone must use That's me", async () => {
  const db = await makeTestDb();
  const maya = { id: "g1", name: "Maya" };
  const p = await joinPlayer(db, { deviceToken: "phoneA", now, guest: maya });
  expect(p).toMatchObject({ name: "Maya", guestId: "g1", isPlusOne: false });
  expect((await joinPlayer(db, { deviceToken: "phoneA", now, guest: maya })).id).toBe(p.id); // idempotent
  await expect(joinPlayer(db, { deviceToken: "phoneB", now, guest: maya })).rejects.toThrow("already playing");
});

test("+1 names are deduped against players and the guest list", async () => {
  const db = await makeTestDb();
  await joinPlayer(db, { deviceToken: "a", now, name: "Sam" });
  const b = await joinPlayer(db, { deviceToken: "b", now, name: "  sam ", otherNames: [] });
  expect(b.name).toBe("sam 2");
  const c = await joinPlayer(db, { deviceToken: "c", now, name: "Theo", otherNames: ["Theo"] });
  expect(c).toMatchObject({ name: "Theo 2", isPlusOne: true });
});

test("That's me moves the player and their votes; host can undo", async () => {
  const db = await makeTestDb();
  const p = await joinPlayer(db, { deviceToken: "old", now, name: "Bea" });
  await hostAction(db, "openRound", { now, rng });
  await castVote(db, p.id, 0, parts(0)[1], now);

  await reclaimPlayer(db, p.id, "new", now + 1);
  expect((await findPlayerByToken(db, "new"))?.id).toBe(p.id);
  expect(await findPlayerByToken(db, "old")).toBeNull();
  const { snap } = await loadSnapshot(db);
  expect(snap.votes.filter((v) => v.playerId === p.id)).toHaveLength(1);
  expect(snap.players[0].rejoinedAt).toBe(now + 1);

  await undoRejoin(db, p.id);
  expect((await findPlayerByToken(db, "old"))?.id).toBe(p.id);
  expect((await loadSnapshot(db)).snap.players[0].rejoinedAt).toBeNull();
});

test("a phone already playing can't also claim someone else", async () => {
  const db = await makeTestDb();
  const a = await joinPlayer(db, { deviceToken: "a", now, name: "Al" });
  await joinPlayer(db, { deviceToken: "b", now, name: "Bo" });
  await expect(reclaimPlayer(db, a.id, "b", now)).rejects.toThrow("already playing as Bo");
});

test("trash talk needs a vote and closes at lock", async () => {
  const db = await makeTestDb();
  const p = await joinPlayer(db, { deviceToken: "a", now, name: "Kit" });
  await hostAction(db, "openRound", { now, rng });
  await expect(postTalk(db, p.id, 0, "hi", now)).rejects.toThrow("Vote first");
  await castVote(db, p.id, 0, parts(0)[0], now);
  await postTalk(db, p.id, 0, "x".repeat(200), now);
  expect((await loadSnapshot(db)).snap.talk[0].text).toHaveLength(80);
  await hostAction(db, "lockRound", { now: now + 1, rng });
  await expect(postTalk(db, p.id, 0, "late", now + 2)).rejects.toThrow("closed");
});
