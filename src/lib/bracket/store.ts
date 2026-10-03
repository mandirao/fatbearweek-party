// Bracket Night persistence. Takes the db as an argument so tests can run the
// exact same code against an in-memory Postgres (PGlite).

import { and, eq, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import {
  bracketGame,
  bracketPlayers,
  bracketTalk,
  bracketTbGuesses,
  bracketVotes,
  bracketWagers,
} from "@/db/schema";
import {
  applyHostAction,
  initialGame,
  officialWinner,
  parts,
  planBots,
  ROUNDS,
  roundOf,
  scoreboard,
  TALK_MAX,
  tiedForFirst,
  type GameState,
  type HostAction,
  type Mode,
  type Rng,
  type Snapshot,
} from "./engine";
import { NAME_MAX } from "./constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<any, any>;

const GAME_ID = 1;

export class BracketError extends Error {}

export type Loaded = { snap: Snapshot; version: number; history: GameState[] };

async function ensureGame(db: Db) {
  await db
    .insert(bracketGame)
    .values({ id: GAME_ID, version: 0, state: initialGame(), history: [] })
    .onConflictDoNothing();
}

export async function loadSnapshot(db: Db): Promise<Loaded> {
  let [row] = await db.select().from(bracketGame).where(eq(bracketGame.id, GAME_ID));
  if (!row) {
    await ensureGame(db);
    [row] = await db.select().from(bracketGame).where(eq(bracketGame.id, GAME_ID));
  }
  const [players, votes, talk, wagers, tbGuesses] = await Promise.all([
    db.select().from(bracketPlayers),
    db.select().from(bracketVotes),
    db.select().from(bracketTalk),
    db.select().from(bracketWagers),
    db.select().from(bracketTbGuesses),
  ]);
  return {
    version: row.version,
    history: row.history as GameState[],
    snap: {
      game: { ...initialGame(), ...(row.state as GameState) },
      players: players
        .map((p) => ({
          id: p.id,
          name: p.name,
          guestId: p.guestId,
          isPlusOne: p.isPlusOne,
          isBot: p.isBot,
          bonus: p.bonus,
          joinedAt: p.joinedAt.getTime(),
          rejoinedAt: p.prevDeviceToken && p.rejoinedAt ? p.rejoinedAt.getTime() : null,
        }))
        .sort((a, b) => a.joinedAt - b.joinedAt),
      votes: votes.map((v) => ({ ...v, at: v.at.getTime() })),
      talk: talk.map((t) => ({ ...t, at: t.at.getTime() })),
      wagers: wagers.map((w) => ({ ...w, lockedAt: w.lockedAt ? w.lockedAt.getTime() : null })),
      tbGuesses: tbGuesses.map((t) => ({ ...t, lockedAt: t.lockedAt.getTime() })),
    },
  };
}

/** Compare-and-set: only writes if nobody changed the game since `version`. */
async function saveGame(db: Db, version: number, game: GameState, history: GameState[]) {
  const rows = await db
    .update(bracketGame)
    .set({ state: game, history, version: version + 1, updatedAt: new Date() })
    .where(and(eq(bracketGame.id, GAME_ID), eq(bracketGame.version, version)))
    .returning({ version: bracketGame.version });
  if (!rows.length) throw new BracketError("The game moved on from another screen. Try again.");
  return rows[0].version;
}

/** Writes whatever the bots should do now. No-op when there are no bots. */
export async function runBots(db: Db, now: number, rng: Rng) {
  const { snap } = await loadSnapshot(db);
  const plan = planBots(snap, now, rng);
  const d = (ms: number) => new Date(ms);
  if (plan.votes.length)
    await db
      .insert(bracketVotes)
      .values(plan.votes.map((v) => ({ ...v, at: d(v.at) })))
      .onConflictDoNothing();
  if (plan.talk.length)
    await db
      .insert(bracketTalk)
      .values(plan.talk.map((t) => ({ ...t, at: d(t.at) })))
      .onConflictDoNothing();
  if (plan.wagers.length)
    await db
      .insert(bracketWagers)
      .values(plan.wagers.map((w) => ({ ...w, lockedAt: w.lockedAt == null ? null : d(w.lockedAt) })))
      .onConflictDoNothing();
  if (plan.tbGuesses.length)
    await db
      .insert(bracketTbGuesses)
      .values(plan.tbGuesses.map((t) => ({ ...t, lockedAt: d(t.lockedAt) })))
      .onConflictDoNothing();
}

export async function hostAction(
  db: Db,
  action: HostAction,
  opts: { now: number; rng: Rng; expectedVersion?: number },
) {
  const { snap, version, history } = await loadSnapshot(db);
  if (opts.expectedVersion != null && opts.expectedVersion !== version)
    throw new BracketError("The game moved on from another screen. Try again.");
  const res = applyHostAction(snap, history, action, opts.now);
  if (!res.ok) throw new BracketError(res.error);
  const v = await saveGame(db, version, res.game, res.history);
  // A fresh tiebreaker never inherits guesses from one that was undone.
  if (action === "startTiebreaker") await db.delete(bracketTbGuesses);
  await runBots(db, opts.now, opts.rng);
  return v;
}

/** Settings that sit outside the undo history. */
export async function setGameSettings(db: Db, patch: { onAir?: boolean; mode?: Mode }) {
  const { snap, version, history } = await loadSnapshot(db);
  if (patch.mode === "live" && snap.game.mode !== "live" && snap.players.some((p) => p.isBot))
    throw new BracketError("Bots are still in the game. Reset Bracket Night to start the live game clean.");
  return saveGame(db, version, { ...snap.game, ...patch }, history);
}

export async function addBots(db: Db, n: number, opts: { now: number; rng: Rng }) {
  const { snap } = await loadSnapshot(db);
  if (snap.game.mode !== "rehearsal") throw new BracketError("Bots are for rehearsal mode only.");
  const count = Math.max(1, Math.min(20, Math.floor(n)));
  const taken = new Set(snap.players.map((p) => p.name));
  const rows = [];
  for (let i = 1; rows.length < count; i++) {
    const name = `Bot ${i}`;
    if (taken.has(name)) continue;
    const id = `bot-${opts.now}-${i}`;
    rows.push({ id, name, isBot: true, deviceToken: `bot:${id}`, joinedAt: new Date(opts.now) });
  }
  await db.insert(bracketPlayers).values(rows);
  await runBots(db, opts.now, opts.rng);
}

/** Rehearsal only: bumps a bot's bonus so it ties whoever is in first. */
export async function forceTie(db: Db, now: number) {
  const { snap } = await loadSnapshot(db);
  if (snap.game.mode !== "rehearsal") throw new BracketError("Force tie is rehearsal-only.");
  const board = scoreboard(snap, now);
  if (board.length > 1 && board[0].score === board[1].score) return;
  const bot = board.find((l, i) => i > 0 && l.isBot);
  if (!bot) throw new BracketError("Add a bot first.");
  const p = snap.players.find((x) => x.id === bot.playerId)!;
  await db
    .update(bracketPlayers)
    .set({ bonus: p.bonus + (board[0].score - bot.score) })
    .where(eq(bracketPlayers.id, p.id));
}

export type JumpTarget = "round2" | "semis" | "wager" | "final";

/**
 * Rehearsal only: skips ahead so the ending can be re-tested without replaying.
 * Earlier rounds get bot votes (counted, stamped in the past) and are marked fully revealed.
 * Undo (Back a step) returns to where you jumped from.
 */
export async function jumpTo(db: Db, target: JumpTarget, opts: { now: number; rng: Rng }) {
  const { snap, version, history } = await loadSnapshot(db);
  const g = snap.game;
  if (g.mode !== "rehearsal") throw new BracketError("Jump to is rehearsal-only.");
  const round = { round2: 1, semis: 2, wager: 3, final: 3 }[target];
  const past = opts.now - 60_000;

  const bots = snap.players.filter((p) => p.isBot);

  const have = new Set(snap.votes.map((v) => `${v.playerId}:${v.matchId}`));
  const votes = [];
  const reveal: GameState["reveal"] = {};
  const lockedAt: GameState["lockedAt"] = {};
  for (let r = 0; r < round; r++) {
    // Lock at the moment of the jump (or keep an earlier real lock) so votes already cast still count.
    lockedAt[r] = g.lockedAt[r] ?? opts.now;
    for (const m of ROUNDS[r]) {
      reveal[m] = 2;
      const [a, b] = parts(m);
      for (const bot of bots) {
        if (have.has(`${bot.id}:${m}`)) continue;
        const fav = officialWinner(m);
        votes.push({ playerId: bot.id, matchId: m, bearNum: opts.rng() < 0.64 ? fav : fav === a ? b : a, at: new Date(past - 1000) });
      }
    }
  }
  if (votes.length) await db.insert(bracketVotes).values(votes).onConflictDoNothing();

  const next: GameState = {
    ...g,
    round,
    phase: target === "wager" ? "wager" : "voting",
    revealIdx: 0,
    reveal,
    lockedAt,
    wagerClosedAt: target === "final" ? opts.now : null,
    tbClosedAt: null,
    finishedAt: null,
  };
  await saveGame(db, version, next, [...history, g]);

  if (target === "final") {
    // Bots bet as if they'd locked in during the wager.
    const after = (await loadSnapshot(db)).snap;
    const board = scoreboard(after, opts.now);
    const wagers = bots
      .filter((b) => !after.wagers.some((w) => w.playerId === b.id))
      .map((b) => ({
        playerId: b.id,
        amount: Math.round(opts.rng() * (board.find((l) => l.playerId === b.id)?.base ?? 0)),
        lockedAt: new Date(past),
      }));
    if (wagers.length) await db.insert(bracketWagers).values(wagers).onConflictDoNothing();
  }
  await runBots(db, opts.now, opts.rng);
}

// ── Player writes ────────────────────────────────────────────────────────────

export async function castVote(db: Db, playerId: string, matchId: number, bearNum: number, now: number) {
  const { snap } = await loadSnapshot(db);
  const g = snap.game;
  if (!snap.players.some((p) => p.id === playerId)) throw new BracketError("Join the game first.");
  if (g.phase !== "voting" || roundOf(matchId) !== g.round) throw new BracketError("Voting is closed for that match.");
  if (!parts(matchId).includes(bearNum)) throw new BracketError("That bear isn't in this match.");
  await db
    .insert(bracketVotes)
    .values({ playerId, matchId, bearNum, at: new Date(now) })
    .onConflictDoUpdate({ target: [bracketVotes.playerId, bracketVotes.matchId], set: { bearNum, at: new Date(now) } });
}

export async function postTalk(db: Db, playerId: string, matchId: number, text: string, now: number) {
  const clean = text.trim().slice(0, TALK_MAX);
  if (!clean) return;
  const { snap } = await loadSnapshot(db);
  if (snap.game.phase !== "voting" || roundOf(matchId) !== snap.game.round)
    throw new BracketError("Trash talk is closed for that match.");
  if (!snap.votes.some((v) => v.playerId === playerId && v.matchId === matchId))
    throw new BracketError("Vote first, then talk.");
  await db
    .insert(bracketTalk)
    .values({ playerId, matchId, text: clean, at: new Date(now) })
    .onConflictDoUpdate({ target: [bracketTalk.playerId, bracketTalk.matchId], set: { text: clean, at: new Date(now) } });
}

export async function setTalkHidden(db: Db, playerId: string, matchId: number, hidden: boolean) {
  await db
    .update(bracketTalk)
    .set({ hidden })
    .where(and(eq(bracketTalk.playerId, playerId), eq(bracketTalk.matchId, matchId)));
}

export async function setWager(db: Db, playerId: string, amount: number, locked: boolean, now: number) {
  const { snap } = await loadSnapshot(db);
  if (snap.game.phase !== "wager") throw new BracketError("Bets are closed.");
  const base = scoreboard(snap, now).find((l) => l.playerId === playerId)?.base ?? 0;
  const amt = Math.max(0, Math.min(base, Math.floor(amount)));
  const lockedAt = locked ? new Date(now) : null;
  await db
    .insert(bracketWagers)
    .values({ playerId, amount: amt, lockedAt })
    .onConflictDoUpdate({ target: bracketWagers.playerId, set: { amount: amt, lockedAt } });
}

export async function lockTbGuess(db: Db, playerId: string, value: number, now: number) {
  const { snap } = await loadSnapshot(db);
  if (snap.game.phase !== "tb") throw new BracketError("The tiebreaker isn't running.");
  if (!tiedForFirst(snap, now).some((t) => t.playerId === playerId))
    throw new BracketError("Only players tied for first can guess.");
  if (snap.tbGuesses.some((t) => t.playerId === playerId)) throw new BracketError("Your guess is already locked.");
  const v = Math.max(0, Math.floor(value));
  await db.insert(bracketTbGuesses).values({ playerId, value: v, lockedAt: new Date(now) }).onConflictDoNothing();
}

// ── Joining ──────────────────────────────────────────────────────────────────

export { NAME_MAX };

export type PlayerRow = typeof bracketPlayers.$inferSelect;

export async function findPlayerByToken(db: Db, token: string | null | undefined): Promise<PlayerRow | null> {
  if (!token) return null;
  const [row] = await db.select().from(bracketPlayers).where(eq(bracketPlayers.deviceToken, token));
  return row ?? null;
}

export async function getPlayer(db: Db, id: string): Promise<PlayerRow | null> {
  const [row] = await db.select().from(bracketPlayers).where(eq(bracketPlayers.id, id));
  return row ?? null;
}

/** "Maya" → "Maya 2" when a Maya is already playing or on the guest list. */
export function dedupeName(name: string, taken: string[]): string {
  const lower = new Set(taken.map((n) => n.trim().toLowerCase()));
  if (!lower.has(name.toLowerCase())) return name;
  for (let i = 2; ; i++) if (!lower.has(`${name} ${i}`.toLowerCase())) return `${name} ${i}`;
}

/**
 * Adds a player for this device. Roster guests join under their guest name; +1s type one.
 * Returns the existing player if this device already joined.
 */
export async function joinPlayer(
  db: Db,
  opts: { deviceToken: string; now: number; guest?: { id: string; name: string }; name?: string; otherNames?: string[] },
): Promise<PlayerRow> {
  const existing = await findPlayerByToken(db, opts.deviceToken);
  if (existing) return existing;
  const players = await db.select().from(bracketPlayers);

  let name: string;
  if (opts.guest) {
    if (players.some((p) => p.guestId === opts.guest!.id))
      throw new BracketError(`${opts.guest.name} is already playing on another phone.`);
    name = opts.guest.name;
  } else {
    const typed = (opts.name ?? "").trim().replace(/\s+/g, " ").slice(0, NAME_MAX);
    if (!typed) throw new BracketError("Type your name first.");
    name = dedupeName(typed, [...players.map((p) => p.name), ...(opts.otherNames ?? [])]);
  }

  const id = `p${opts.now.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const [row] = await db
    .insert(bracketPlayers)
    .values({
      id,
      name,
      guestId: opts.guest?.id ?? null,
      isPlusOne: !opts.guest,
      deviceToken: opts.deviceToken,
      joinedAt: new Date(opts.now),
    })
    .returning();
  return row;
}

/** "That's me": moves a player to this device. The host can undo it from the Press Box. */
export async function reclaimPlayer(db: Db, playerId: string, deviceToken: string, now: number): Promise<PlayerRow> {
  const p = await getPlayer(db, playerId);
  if (!p || p.isBot) throw new BracketError("That player isn't in the game.");
  if (p.deviceToken === deviceToken) return p;
  const mine = await findPlayerByToken(db, deviceToken);
  if (mine) throw new BracketError(`This phone is already playing as ${mine.name}.`);
  const [row] = await db
    .update(bracketPlayers)
    .set({ prevDeviceToken: p.deviceToken, deviceToken, rejoinedAt: new Date(now) })
    .where(eq(bracketPlayers.id, playerId))
    .returning();
  return row;
}

export async function undoRejoin(db: Db, playerId: string) {
  const p = await getPlayer(db, playerId);
  if (!p?.prevDeviceToken) throw new BracketError("Nothing to undo for that player.");
  const holder = await findPlayerByToken(db, p.prevDeviceToken);
  if (holder) throw new BracketError(`The old phone has since joined as ${holder.name}.`);
  await db
    .update(bracketPlayers)
    .set({ deviceToken: p.prevDeviceToken, prevDeviceToken: null, rejoinedAt: null })
    .where(eq(bracketPlayers.id, playerId));
}

export async function dismissRejoin(db: Db, playerId: string) {
  await db.update(bracketPlayers).set({ prevDeviceToken: null, rejoinedAt: null }).where(eq(bracketPlayers.id, playerId));
}

// ── Reset ────────────────────────────────────────────────────────────────────

/** Wipes Bracket Night only. Never touches guests, RSVPs, potluck or backed bears. */
export async function resetBracket(db: Db) {
  await db.delete(bracketVotes);
  await db.delete(bracketTalk);
  await db.delete(bracketWagers);
  await db.delete(bracketTbGuesses);
  await db.delete(bracketPlayers);
  await ensureGame(db);
  await db
    .update(bracketGame)
    .set({ state: initialGame(), history: [], version: sql`${bracketGame.version} + 1`, updatedAt: new Date() })
    .where(eq(bracketGame.id, GAME_ID));
}
