import { afterEach, beforeEach, expect, test, vi } from "vitest";

// A visitor holding every cookie the party used: signed in as a guest, host, and a bracket player.
const jar = new Map([
  ["fbw_me", "g1"],
  ["fbw_host", "1"],
  ["fbw_player", "phoneA"],
]);
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Any database access at all fails the test: archived writes must be refused before touching it.
const getDb = vi.fn(() => {
  throw new Error("database touched");
});
vi.mock("@/db", () => ({ getDb }));

const { getMeId, isHost } = await import("../identity");
const { addGuest, updateGuest, resetAllGuests } = await import("../guests");
const { ArchivedError } = await import("../archive");
const hostRoute = await import("@/app/api/bracket/host/route");
const playerRoute = await import("@/app/api/bracket/player/route");

const post = (url: string, body: unknown) =>
  new Request(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  getDb.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

test("live: cookies still identify the guest and the host", async () => {
  vi.stubEnv("FBW_ARCHIVED", "");
  expect(await getMeId()).toBe("g1");
  expect(await isHost()).toBe(true);
});

test("archived: nobody is signed in and nobody is host, whatever cookies they hold", async () => {
  vi.stubEnv("FBW_ARCHIVED", "1");
  expect(await getMeId()).toBeNull();
  expect(await isHost()).toBe(false);
});

test("archived: guest writes (RSVP, potluck, bear, add, reset) are refused before the database", async () => {
  vi.stubEnv("FBW_ARCHIVED", "1");
  await expect(addGuest("Stranger")).rejects.toBeInstanceOf(ArchivedError);
  await expect(updateGuest("g1", { status: "no" })).rejects.toBeInstanceOf(ArchivedError);
  await expect(updateGuest("g1", { dishId: 3 })).rejects.toBeInstanceOf(ArchivedError);
  await expect(updateGuest("g1", { bear: "Otis" })).rejects.toBeInstanceOf(ArchivedError);
  await expect(resetAllGuests()).rejects.toBeInstanceOf(ArchivedError);
  expect(getDb).not.toHaveBeenCalled();
});

test("archived: every host control is refused, including reset and undo", async () => {
  vi.stubEnv("FBW_ARCHIVED", "1");
  for (const body of [
    { op: "reset" },
    { op: "action", action: "undo" },
    { op: "settings", onAir: false },
    { op: "hideTalk", playerId: "p1", matchId: 0, hidden: true },
  ]) {
    const res = await hostRoute.POST(post("http://x/api/bracket/host", body));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/read-only archive/);
  }
  expect(getDb).not.toHaveBeenCalled();
});

test("archived: players can't join, reclaim, vote, talk, bet or guess", async () => {
  vi.stubEnv("FBW_ARCHIVED", "1");
  for (const body of [
    { op: "joinNew", name: "Stranger" },
    { op: "joinGuest", guestId: "g1" },
    { op: "reclaim", playerId: "p1" },
    { op: "vote", matchId: 14, bearNum: 32 },
    { op: "talk", matchId: 14, text: "hi" },
    { op: "wager", amount: 5, locked: true },
    { op: "tbGuess", value: 3 },
  ]) {
    const res = await playerRoute.POST(post("http://x/api/bracket/player", body));
    expect(res.status).toBe(403);
  }
  expect(getDb).not.toHaveBeenCalled();
});
