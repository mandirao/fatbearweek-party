import { getDb } from "@/db";
import { findPlayerByToken, loadSnapshot, type Db, type Loaded } from "./store";
import { buildStatus } from "./view";
import { playerIdFromCookie } from "./identity";

export function bracketDb(): Db {
  return getDb() as unknown as Db;
}

// ~25 phones + the TV poll about once a second. Fluid compute reuses instances,
// so a short in-memory cache collapses those into a few DB reads per second.
const CACHE_MS = 350;
let cached: { at: number; data: Promise<Loaded> } | null = null;

export function getLoaded(): Promise<Loaded> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) return cached.data;
  const data = loadSnapshot(bracketDb());
  cached = { at: now, data };
  data.catch(() => {
    if (cached?.data === data) cached = null;
  });
  return data;
}

export function invalidateBracketCache() {
  cached = null;
}

/** Nav tab + banner state for this device. Used by the (app) layout and /api/bracket/status. */
export async function getBracketStatus() {
  const { snap } = await getLoaded();
  const playerId = await playerIdFromCookie(snap, async (t) => (await findPlayerByToken(bracketDb(), t))?.id ?? null);
  return buildStatus(snap, Date.now(), playerId);
}
