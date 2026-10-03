// Bracket Night game engine. Pure functions only: no DB, no clock, no randomness
// except through the `rng` argument. Every rule from UPDATE-5 lives here.

import results from "@/data/bracket-results.json";
import bearsData from "@/data/bracket-bears.json";

// ── Static data ──────────────────────────────────────────────────────────────

export type BracketBear = {
  num: number;
  label: string;
  short: string;
  cls: string;
  sourcePhoto: string;
  photo: string;
  hook: string;
  id: string;
  story: string;
  fishes: string;
};

export type OfficialMatch = {
  id: number;
  round: string;
  date: string;
  a: number;
  aVotes: number;
  b: number;
  bVotes: number;
  winner: number;
};

export const BRACKET_BEARS: BracketBear[] = bearsData as BracketBear[];
export const OFFICIAL: OfficialMatch[] = results.matches as OfficialMatch[];
export const TOTAL_MATCHES = 15;
export const FINAL = 14;

export const ROUNDS: number[][] = [[0, 1, 2, 3, 4, 5, 6, 7], [8, 9, 10, 11], [12, 13], [14]];
export const ROUND_NAMES = ["Round 1", "Round 2", "Semifinal", "Final"];
export const ROUND_DATES = ["Sept 23–24", "Sept 25", "Sept 28", "Sept 29"];
export const FEED: Record<number, [number, number]> = {
  8: [0, 1],
  9: [2, 3],
  10: [4, 5],
  11: [6, 7],
  12: [8, 9],
  13: [10, 11],
  14: [12, 13],
};

export const TIEBREAKER_BEAR = 89;
export const TIEBREAKER_MATCHES = [5, 10, 13, 14];
export const TIEBREAKER_QUESTION =
  "How many party votes did Backpack get tonight, across all four of his matches?";

export const TALK_MAX = 80;

export function getBracketBear(num: number): BracketBear | null {
  return BRACKET_BEARS.find((b) => b.num === num) ?? null;
}

export function roundOf(matchId: number): number {
  return ROUNDS.findIndex((r) => r.includes(matchId));
}

/** The two bears in a match. Katmai's winner always advances, so every pairing is known ahead. */
export function parts(matchId: number): [number, number] {
  if (matchId < 8) return [OFFICIAL[matchId].a, OFFICIAL[matchId].b];
  const [x, y] = FEED[matchId];
  return [OFFICIAL[x].winner, OFFICIAL[y].winner];
}

export function officialWinner(matchId: number): number {
  return OFFICIAL[matchId].winner;
}

// ── Server-held state ────────────────────────────────────────────────────────

export type Phase = "lobby" | "voting" | "reveal" | "wager" | "tb" | "tbDone";
export type Mode = "rehearsal" | "live";
export type RevealLevel = 0 | 1 | 2;

export type GameState = {
  mode: Mode;
  onAir: boolean;
  round: number;
  phase: Phase;
  revealIdx: number;
  reveal: Record<string, RevealLevel>;
  /** round index → ms when voting closed. Votes stamped later don't count. */
  lockedAt: Record<string, number>;
  wagerClosedAt: number | null;
  tbClosedAt: number | null;
  finishedAt: number | null;
};

export type Player = {
  id: string;
  name: string;
  guestId: string | null;
  isPlusOne: boolean;
  isBot: boolean;
  bonus: number;
  joinedAt: number;
  /** Set when "That's me" moved this player to a new phone; cleared by undo/dismiss. */
  rejoinedAt?: number | null;
};

export type Vote = { playerId: string; matchId: number; bearNum: number; at: number };
export type Talk = { playerId: string; matchId: number; text: string; at: number; hidden: boolean };
export type Wager = { playerId: string; amount: number; lockedAt: number | null };
export type TbGuess = { playerId: string; value: number; lockedAt: number };

export type Snapshot = {
  game: GameState;
  players: Player[];
  votes: Vote[];
  talk: Talk[];
  wagers: Wager[];
  tbGuesses: TbGuess[];
};

export function initialGame(): GameState {
  return {
    mode: "live",
    onAir: false,
    round: 0,
    phase: "lobby",
    revealIdx: 0,
    reveal: {},
    lockedAt: {},
    wagerClosedAt: null,
    tbClosedAt: null,
    finishedAt: null,
  };
}

// ── Derived reads ────────────────────────────────────────────────────────────

export function level(game: GameState, matchId: number): RevealLevel {
  return game.reveal[matchId] ?? 0;
}

/** The match on screen right now (voting shows the round's first match). */
export function currentMatch(game: GameState): number {
  const round = ROUNDS[game.round];
  return round[Math.min(game.revealIdx, round.length - 1)];
}

/** Bot votes are written ahead with a future `at`; they only count once that time has passed. */
function voteCutoff(game: GameState, matchId: number, now: number): number {
  const locked = game.lockedAt[roundOf(matchId)];
  return locked != null ? Math.min(locked, now) : now;
}

export function countedVotes(snap: Snapshot, now: number): Vote[] {
  const ids = new Set(snap.players.map((p) => p.id));
  return snap.votes.filter((v) => {
    if (!ids.has(v.playerId)) return false;
    if (!parts(v.matchId).includes(v.bearNum)) return false;
    return v.at <= voteCutoff(snap.game, v.matchId, now);
  });
}

function voteIndex(votes: Vote[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const v of votes) m.set(`${v.playerId}:${v.matchId}`, v.bearNum);
  return m;
}

export function tally(votes: Vote[], matchId: number): [number, number] {
  const [a] = parts(matchId);
  const t: [number, number] = [0, 0];
  for (const v of votes) if (v.matchId === matchId) t[v.bearNum === a ? 0 : 1]++;
  return t;
}

/** Bear with more party votes, or null on a split room. */
export function partyWinner(votes: Vote[], matchId: number): number | null {
  const [a, b] = parts(matchId);
  const [ta, tb] = tally(votes, matchId);
  if (ta === tb) return null;
  return ta > tb ? a : b;
}

export function isBusted(game: GameState, votes: Vote[], matchId: number): boolean {
  if (level(game, matchId) < 2) return false;
  const pw = partyWinner(votes, matchId);
  return pw !== null && pw !== officialWinner(matchId);
}

export type MatchPoints = { points: 0 | 1; reason: "room" | "split" | "against" | "noVote" };

export function matchPoints(pick: number | undefined, votes: Vote[], matchId: number): MatchPoints {
  if (pick == null) return { points: 0, reason: "noVote" };
  const pw = partyWinner(votes, matchId);
  if (pw === null) return { points: 1, reason: "split" };
  return pick === pw ? { points: 1, reason: "room" } : { points: 0, reason: "against" };
}

export type WagerResult = "won" | "lost" | "kept" | "noVote";

export type ScoreLine = {
  playerId: string;
  name: string;
  isBot: boolean;
  /** Points from revealed matches 0–13 plus any rehearsal bonus. The wager ceiling. */
  base: number;
  /** Final match point (0/1) once revealed. */
  finalPoint: number;
  bet: number;
  betLocked: boolean;
  wagerDelta: number;
  wagerResult: WagerResult | null;
  score: number;
};

function lockedWager(snap: Snapshot, playerId: string, now: number): Wager | null {
  const w = snap.wagers.find((x) => x.playerId === playerId);
  if (!w || w.lockedAt == null) return null;
  const cutoff = snap.game.wagerClosedAt != null ? Math.min(snap.game.wagerClosedAt, now) : now;
  return w.lockedAt <= cutoff ? w : null;
}

export function scoreboard(snap: Snapshot, now: number): ScoreLine[] {
  const votes = countedVotes(snap, now);
  const idx = voteIndex(votes);
  const finalShown = level(snap.game, FINAL) >= 1;
  const finalPw = finalShown ? partyWinner(votes, FINAL) : null;

  const lines = snap.players.map((p) => {
    let base = p.bonus;
    for (let m = 0; m < FINAL; m++) {
      if (level(snap.game, m) < 1) continue;
      base += matchPoints(idx.get(`${p.id}:${m}`), votes, m).points;
    }
    const finalPick = idx.get(`${p.id}:${FINAL}`);
    const finalPoint = finalShown ? matchPoints(finalPick, votes, FINAL).points : 0;

    const w = lockedWager(snap, p.id, now);
    const bet = w ? Math.max(0, Math.min(w.amount, base)) : 0;
    let wagerDelta = 0;
    let wagerResult: WagerResult | null = null;
    if (finalShown && bet > 0) {
      if (finalPw === null) wagerResult = "kept";
      else if (finalPick == null) wagerResult = "noVote";
      else wagerResult = finalPick === finalPw ? "won" : "lost";
      wagerDelta = wagerResult === "won" ? bet : wagerResult === "kept" ? 0 : -bet;
    }

    return {
      playerId: p.id,
      name: p.name,
      isBot: p.isBot,
      base,
      finalPoint,
      bet,
      betLocked: !!w,
      wagerDelta,
      wagerResult,
      score: base + finalPoint + wagerDelta,
    };
  });

  return lines.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

/** Players tied for first once the Final's Katmai count is revealed. Empty if no tie. */
export function tiedForFirst(snap: Snapshot, now: number): ScoreLine[] {
  if (level(snap.game, FINAL) < 2) return [];
  const board = scoreboard(snap, now);
  if (board.length < 2) return [];
  const top = board.filter((l) => l.score === board[0].score);
  return top.length >= 2 ? top : [];
}

export function tiebreakerAnswer(snap: Snapshot, now: number): number {
  const votes = countedVotes(snap, now);
  let sum = 0;
  for (const m of TIEBREAKER_MATCHES) {
    if (level(snap.game, m) < 1) continue;
    const [a, b] = parts(m);
    const [ta, tb] = tally(votes, m);
    if (a === TIEBREAKER_BEAR) sum += ta;
    else if (b === TIEBREAKER_BEAR) sum += tb;
  }
  return sum;
}

export type TbRow = {
  playerId: string;
  name: string;
  guess: number | null;
  lockedAt: number | null;
  off: number | null;
};

/**
 * Tied players ranked: closest guess first, equal distance → earliest lock, no guess → last.
 * `sameDistanceDecided` is true when the winner beat someone only on lock time.
 */
export function tiebreakerRanking(snap: Snapshot, now: number): { rows: TbRow[]; answer: number; sameDistanceDecided: boolean } {
  const answer = tiebreakerAnswer(snap, now);
  const cutoff = snap.game.tbClosedAt != null ? Math.min(snap.game.tbClosedAt, now) : now;
  const rows: TbRow[] = tiedForFirst(snap, now).map((l) => {
    const g = snap.tbGuesses.find((x) => x.playerId === l.playerId && x.lockedAt <= cutoff);
    return {
      playerId: l.playerId,
      name: l.name,
      guess: g ? g.value : null,
      lockedAt: g ? g.lockedAt : null,
      off: g ? Math.abs(g.value - answer) : null,
    };
  });
  rows.sort((x, y) => {
    if (x.off == null && y.off == null) return x.name.localeCompare(y.name);
    if (x.off == null) return 1;
    if (y.off == null) return -1;
    return x.off - y.off || (x.lockedAt as number) - (y.lockedAt as number);
  });
  const sameDistanceDecided = rows.length >= 2 && rows[0].off != null && rows[0].off === rows[1].off;
  return { rows, answer, sameDistanceDecided };
}

/** Name of the party champion, or null if the game isn't over. */
export function champion(snap: Snapshot, now: number): ScoreLine | null {
  const g = snap.game;
  if (level(g, FINAL) < 2) return null;
  const board = scoreboard(snap, now);
  if (!board.length) return null;
  const tied = tiedForFirst(snap, now);
  if (!tied.length) return board[0];
  if (g.phase !== "tbDone") return null;
  const winnerId = tiebreakerRanking(snap, now).rows[0]?.playerId;
  return board.find((l) => l.playerId === winnerId) ?? null;
}

/** Players who have a counted vote on every match of the round. */
export function cardsIn(snap: Snapshot, round: number, now: number): { done: number; total: number; missing: string[] } {
  const idx = voteIndex(countedVotes(snap, now));
  const ms = ROUNDS[round];
  const missing = snap.players.filter((p) => !ms.every((m) => idx.has(`${p.id}:${m}`))).map((p) => p.name);
  return { done: snap.players.length - missing.length, total: snap.players.length, missing };
}

// ── Host actions ─────────────────────────────────────────────────────────────

export type HostAction =
  | "openRound"
  | "lockRound"
  | "revealParty"
  | "revealKatmai"
  | "nextMatch"
  | "openWager"
  | "openFinal"
  | "startTiebreaker"
  | "revealTiebreaker"
  | "undo";

export const HOST_ACTIONS: HostAction[] = [
  "openRound",
  "lockRound",
  "revealParty",
  "revealKatmai",
  "nextMatch",
  "openWager",
  "openFinal",
  "startTiebreaker",
  "revealTiebreaker",
  "undo",
];

export type ActionResult = { ok: true; game: GameState; history: GameState[] } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });

function roundComplete(game: GameState): boolean {
  const ms = ROUNDS[game.round];
  return game.phase === "reveal" && game.revealIdx === ms.length - 1 && level(game, ms[ms.length - 1]) === 2;
}

/**
 * Applies one host action. Every action except `undo` pushes the previous game onto `history`.
 * Undo restores the previous game but keeps on-air and mode as they are now.
 */
export function applyHostAction(
  snap: Snapshot,
  history: GameState[],
  action: HostAction,
  now: number,
): ActionResult {
  const g = snap.game;

  if (action === "undo") {
    if (!history.length) return fail("Nothing to undo.");
    const prev = history[history.length - 1];
    return { ok: true, game: { ...prev, onAir: g.onAir, mode: g.mode }, history: history.slice(0, -1) };
  }

  const next = (patch: Partial<GameState>): ActionResult => ({
    ok: true,
    game: { ...g, ...patch },
    history: [...history, g],
  });
  const m = currentMatch(g);
  const lvl = level(g, m);

  switch (action) {
    case "openRound": {
      if (g.phase === "lobby") return next({ round: 0, phase: "voting", revealIdx: 0 });
      if (!roundComplete(g)) return fail("Finish revealing this round first.");
      if (g.round > 1) return fail("After the Semifinal, open the Final Wager instead.");
      return next({ round: g.round + 1, phase: "voting", revealIdx: 0 });
    }
    case "lockRound": {
      if (g.phase !== "voting") return fail("Voting isn't open.");
      return next({ phase: "reveal", revealIdx: 0, lockedAt: { ...g.lockedAt, [g.round]: now } });
    }
    case "revealParty": {
      if (g.phase !== "reveal") return fail("Not revealing right now.");
      if (lvl !== 0) return fail("The party vote is already showing.");
      return next({ reveal: { ...g.reveal, [m]: 1 } });
    }
    case "revealKatmai": {
      if (g.phase !== "reveal") return fail("Not revealing right now.");
      if (lvl !== 1) return fail(lvl === 0 ? "Reveal the party vote first." : "Katmai's count is already showing.");
      const after: GameState = { ...g, reveal: { ...g.reveal, [m]: 2 } };
      const finished = m === FINAL && tiedForFirst({ ...snap, game: after }, now).length === 0;
      return next({ reveal: after.reveal, finishedAt: finished ? now : g.finishedAt });
    }
    case "nextMatch": {
      if (g.phase !== "reveal" || lvl !== 2) return fail("Reveal Katmai's count first.");
      if (g.revealIdx >= ROUNDS[g.round].length - 1) return fail("That was the last match of the round.");
      return next({ revealIdx: g.revealIdx + 1 });
    }
    case "openWager": {
      if (g.round !== 2 || !roundComplete(g)) return fail("Finish revealing the Semifinals first.");
      return next({ round: 3, phase: "wager", revealIdx: 0 });
    }
    case "openFinal": {
      if (g.phase !== "wager") return fail("The Final Wager isn't open.");
      return next({ phase: "voting", wagerClosedAt: now });
    }
    case "startTiebreaker": {
      if (g.round !== 3 || g.phase !== "reveal" || level(g, FINAL) !== 2) return fail("Reveal the Final first.");
      if (!tiedForFirst(snap, now).length) return fail("Nobody is tied for first.");
      return next({ phase: "tb" });
    }
    case "revealTiebreaker": {
      if (g.phase !== "tb") return fail("The tiebreaker isn't running.");
      return next({ phase: "tbDone", tbClosedAt: now, finishedAt: now });
    }
  }
}

/** What the Press Box's one big button does next, and what it says. `action: null` = game over. */
export function hostPrimary(snap: Snapshot, now: number): { action: HostAction | null; label: string } {
  const g = snap.game;
  const m = currentMatch(g);
  const lvl = level(g, m);
  switch (g.phase) {
    case "lobby":
      return { action: "openRound", label: "Open Round 1" };
    case "voting": {
      const c = cardsIn(snap, g.round, now);
      return { action: "lockRound", label: `Lock round · ${c.done}/${c.total} in` };
    }
    case "wager":
      return { action: "openFinal", label: "Lock bets · open the Final" };
    case "tb":
      return { action: "revealTiebreaker", label: "Reveal tiebreaker answer" };
    case "tbDone":
      return { action: null, label: `Party champion: ${champion(snap, now)?.name ?? "?"}` };
    case "reveal": {
      if (lvl === 0) return { action: "revealParty", label: "Reveal party vote" };
      if (lvl === 1) return { action: "revealKatmai", label: "Reveal Katmai count" };
      if (g.revealIdx < ROUNDS[g.round].length - 1) return { action: "nextMatch", label: "Next match →" };
      if (g.round < 2) return { action: "openRound", label: `Open ${ROUND_NAMES[g.round + 1]}` };
      if (g.round === 2) return { action: "openWager", label: "Open the Final Wager" };
      const tied = tiedForFirst(snap, now);
      if (tied.length) return { action: "startTiebreaker", label: `Start tiebreaker · ${tied.length}-way tie` };
      return { action: null, label: `Party champion: ${champion(snap, now)?.name ?? "?"}` };
    }
  }
}

// ── Bots ─────────────────────────────────────────────────────────────────────

export type Rng = () => number;

/** Deterministic PRNG for tests and the CLI sim. */
export function seededRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BOT_LINES = [
  "Look at the after photo. I rest my case.",
  "{B} has been eating since June. Respect the grind.",
  "That belly has its own zip code.",
  "{B} did not come to Alaska to lose.",
  "Hibernation is going to be so cozy for {B}.",
  "The other one looks like a snack, not a contender.",
  "{B}. That is the tweet.",
  "Fat is a lifestyle and {B} is living it.",
];

export type BotPlan = { votes: Vote[]; talk: Talk[]; wagers: Wager[]; tbGuesses: TbGuess[] };

const delay = (rng: Rng, now: number) => now + 1000 + Math.floor(rng() * 9000);

/**
 * What bots do given the current game: vote on an open round, bet during the wager,
 * guess during a tiebreaker. Only fills gaps, so it's safe to call after any change.
 */
export function planBots(snap: Snapshot, now: number, rng: Rng): BotPlan {
  const plan: BotPlan = { votes: [], talk: [], wagers: [], tbGuesses: [] };
  const g = snap.game;
  const bots = snap.players.filter((p) => p.isBot);
  if (!bots.length) return plan;

  if (g.phase === "voting") {
    const have = new Set(snap.votes.map((v) => `${v.playerId}:${v.matchId}`));
    const haveTalk = new Set(snap.talk.map((t) => `${t.playerId}:${t.matchId}`));
    for (const bot of bots) {
      for (const m of ROUNDS[g.round]) {
        if (have.has(`${bot.id}:${m}`)) continue;
        const [a, b] = parts(m);
        const fav = officialWinner(m);
        const bear = rng() < 0.64 ? fav : fav === a ? b : a;
        const at = delay(rng, now);
        plan.votes.push({ playerId: bot.id, matchId: m, bearNum: bear, at });
        if (!haveTalk.has(`${bot.id}:${m}`) && rng() < 0.3) {
          const short = getBracketBear(bear)?.short ?? String(bear);
          const line = BOT_LINES[Math.floor(rng() * BOT_LINES.length)].replace("{B}", short);
          plan.talk.push({ playerId: bot.id, matchId: m, text: line, at: at + 500, hidden: false });
        }
      }
    }
  }

  if (g.phase === "wager") {
    const board = scoreboard(snap, now);
    for (const bot of bots) {
      if (snap.wagers.some((w) => w.playerId === bot.id)) continue;
      const base = board.find((l) => l.playerId === bot.id)?.base ?? 0;
      plan.wagers.push({ playerId: bot.id, amount: Math.round(rng() * base), lockedAt: delay(rng, now) });
    }
  }

  if (g.phase === "tb") {
    const answer = tiebreakerAnswer(snap, now);
    for (const t of tiedForFirst(snap, now)) {
      if (!t.isBot || snap.tbGuesses.some((x) => x.playerId === t.playerId)) continue;
      const value = Math.max(0, answer + Math.round((rng() - 0.5) * 12));
      plan.tbGuesses.push({ playerId: t.playerId, value, lockedAt: delay(rng, now) });
    }
  }

  return plan;
}
