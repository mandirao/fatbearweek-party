// Shapes the server snapshot into what each screen is allowed to see.
// Official Katmai counts are only included once a match is at reveal level 2.

import {
  cardsIn,
  champion,
  countedVotes,
  currentMatch,
  FINAL,
  getBracketBear,
  hostPrimary,
  isBusted,
  level,
  matchPoints,
  OFFICIAL,
  officialWinner,
  partyWinner,
  parts,
  ROUND_DATES,
  ROUND_NAMES,
  ROUNDS,
  scoreboard,
  tally,
  TIEBREAKER_QUESTION,
  tiebreakerRanking,
  tiedForFirst,
  type GameState,
  type HostAction,
  type Mode,
  type Phase,
  type Snapshot,
} from "./engine";

// Poster slot centers, in pixels on the 2184×1686 blank bracket (from the prototype's P(x,y)).
const X = 2184;
const Y = 1686;
const P = (x: number, y: number) => ({ x: (x / X) * 100, y: (y / Y) * 100 });
const L1 = [365, 490, 630, 755, 920, 1045, 1185, 1310].map((y) => P(190, y));
const R1S = [365, 490, 635, 760, 920, 1045, 1190, 1315].map((y) => P(1990, y));
const L2 = [425, 685, 1000, 1240].map((y) => P(507, y));
const R2 = [420, 680, 995, 1235].map((y) => P(1672, y));
const LS = [535, 1115].map((y) => P(672, y));
const RS = [530, 1110].map((y) => P(1505, y));
const LF = P(825, 830);
const RF = P(1352, 830);
const CH = P(1090, 865);

export type Slot = { x: number; y: number; num: number; big: boolean; hot: "vote" | "reveal" | null; lost: boolean };

export type BearCard = { num: number; label: string; short: string; photo: string };

const bearCard = (num: number): BearCard => {
  const b = getBracketBear(num);
  return { num, label: b?.label ?? String(num), short: b?.short ?? String(num), photo: b?.photo ?? "" };
};

export type TalkLine = { playerId: string; matchId: number; who: string; bear: string; text: string; hidden: boolean };

export type RevealView = {
  matchId: number;
  matchNum: number;
  a: BearCard;
  b: BearCard;
  level: 0 | 1 | 2;
  party: [number, number] | null;
  split: boolean;
  katmai: [number, number] | null;
  winner: BearCard | null;
  busted: boolean;
  bustText: string;
  talk: TalkLine[];
};

export type Leader = { rank: number; name: string; score: number; delta: string; deltaUp: boolean };

export type PublicView = {
  version: number;
  now: number;
  mode: Mode;
  onAir: boolean;
  phase: Phase;
  round: number;
  roundName: string;
  roundDate: string;
  roundLen: number;
  playerCount: number;
  slots: Slot[];
  voting: { progress: { name: string; done: number; total: number }[]; done: number; total: number } | null;
  reveal: RevealView | null;
  wager: { rows: { name: string; locked: boolean }[]; locked: number; total: number } | null;
  tb: {
    names: string[];
    question: string;
    rows: { name: string; status: string; top: boolean }[];
    revealed: boolean;
    answer: number | null;
    champion: string | null;
    sameNote: boolean;
  } | null;
  leaders: Leader[];
  champion: string | null;
  finishedAt: number | null;
};

export type HostView = PublicView & {
  status: string;
  primary: { action: HostAction | null; label: string };
  missing: number;
  canUndo: boolean;
  talkAll: TalkLine[];
  players: { id: string; name: string; isBot: boolean; score: number }[];
  bots: number;
  rejoins: { playerId: string; name: string; at: number }[];
};

function buildSlots(snap: Snapshot): Slot[] {
  const g = snap.game;
  const m = currentMatch(g);
  const hot = new Set<number>(g.phase === "voting" ? ROUNDS[g.round] : g.phase === "reveal" && level(g, m) < 2 ? [m] : []);
  const hotKind = g.phase === "voting" ? "vote" : "reveal";
  const winner = (k: number) => (level(g, k) >= 2 ? officialWinner(k) : null);
  const slots: Slot[] = [];
  const push = (pos: { x: number; y: number }, num: number | null, matchIdx: number | null, big = false) => {
    if (!num) return;
    const lost = matchIdx != null && level(g, matchIdx) >= 2 && winner(matchIdx) !== num;
    slots.push({ ...pos, num, big, hot: matchIdx != null && hot.has(matchIdx) ? hotKind : null, lost });
  };
  for (let i = 0; i < 8; i++) {
    const LL = i < 4 ? L1 : R1S;
    const j = (i % 4) * 2;
    const [a, b] = parts(i);
    push(LL[j], a, i);
    push(LL[j + 1], b, i);
  }
  for (let i = 0; i < 8; i++) push((i < 4 ? L2 : R2)[i % 4], winner(i), [8, 8, 9, 9, 10, 10, 11, 11][i]);
  push(LS[0], winner(8), 12);
  push(LS[1], winner(9), 12);
  push(RS[0], winner(10), 13);
  push(RS[1], winner(11), 13);
  push(LF, winner(12), 14);
  push(RF, winner(13), 14);
  push(CH, winner(14), null, true);
  return slots;
}

function talkFor(snap: Snapshot, matchId: number, now: number): TalkLine[] {
  const names = new Map(snap.players.map((p) => [p.id, p.name]));
  return snap.talk
    .filter((t) => t.matchId === matchId && t.at <= now && names.has(t.playerId))
    .sort((a, b) => a.at - b.at)
    .map((t) => {
      const vote = snap.votes.find((v) => v.playerId === t.playerId && v.matchId === matchId);
      return {
        playerId: t.playerId,
        matchId,
        who: names.get(t.playerId)!,
        bear: vote ? bearCard(vote.bearNum).short : "",
        text: t.text,
        hidden: t.hidden,
      };
    });
}

export function buildPublicView(snap: Snapshot, version: number, now: number): PublicView {
  const g = snap.game;
  const votes = countedVotes(snap, now);
  const round = ROUNDS[g.round];
  const board = scoreboard(snap, now);
  const champ = champion(snap, now);

  let voting: PublicView["voting"] = null;
  if (g.phase === "voting") {
    const idx = new Set(votes.map((v) => `${v.playerId}:${v.matchId}`));
    const progress = snap.players.map((p) => ({
      name: p.name,
      done: round.filter((m) => idx.has(`${p.id}:${m}`)).length,
      total: round.length,
    }));
    const c = cardsIn(snap, g.round, now);
    voting = { progress, done: c.done, total: c.total };
  }

  let reveal: RevealView | null = null;
  if (g.phase === "reveal") {
    const m = currentMatch(g);
    const lvl = level(g, m);
    const [a, b] = parts(m);
    const t = tally(votes, m);
    const pw = partyWinner(votes, m);
    const busted = isBusted(g, votes, m);
    const o = OFFICIAL[m];
    reveal = {
      matchId: m,
      matchNum: g.revealIdx + 1,
      a: bearCard(a),
      b: bearCard(b),
      level: lvl,
      party: lvl >= 1 ? t : null,
      split: lvl >= 1 && pw === null && t[0] + t[1] > 0,
      katmai: lvl >= 2 ? [o.aVotes, o.bVotes] : null,
      winner: lvl >= 2 ? bearCard(officialWinner(m)) : null,
      busted,
      bustText: busted
        ? `The party picked ${bearCard(pw!).label} ${Math.max(...t)}–${Math.min(...t)}. Katmai sent ${bearCard(officialWinner(m)).label} through.`
        : "",
      talk: lvl >= 1 ? talkFor(snap, m, now).filter((x) => !x.hidden).slice(0, 3) : [],
    };
  }

  let wager: PublicView["wager"] = null;
  if (g.phase === "wager") {
    const rows = board.map((l) => {
      const w = snap.wagers.find((x) => x.playerId === l.playerId);
      return { name: l.name, locked: !!w && w.lockedAt != null && w.lockedAt <= now };
    });
    wager = { rows, locked: rows.filter((r) => r.locked).length, total: rows.length };
  }

  let tb: PublicView["tb"] = null;
  if (g.phase === "tb" || g.phase === "tbDone") {
    const revealed = g.phase === "tbDone";
    const r = tiebreakerRanking(snap, now);
    const rows = revealed
      ? r.rows.map((x, i) => ({
          name: x.name,
          status: x.guess == null ? "NO GUESS" : `${x.guess} · OFF BY ${x.off}`,
          top: i === 0,
        }))
      : [...r.rows]
          .sort((x, y) => x.name.localeCompare(y.name))
          .map((x) => ({ name: x.name, status: x.guess == null ? "THINKING..." : "LOCKED", top: false }));
    tb = {
      names: tiedForFirst(snap, now).map((l) => l.name),
      question: TIEBREAKER_QUESTION,
      rows,
      revealed,
      answer: revealed ? r.answer : null,
      champion: revealed ? (r.rows[0]?.name ?? null) : null,
      sameNote: revealed && r.sameDistanceDecided,
    };
  }

  // The tiebreaker winner tops the board even though the scores are equal.
  if (champ) board.sort((a, b) => Number(b.playerId === champ.playerId) - Number(a.playerId === champ.playerId));

  const showBets = g.round === 3 && level(g, FINAL) >= 1 && g.phase !== "voting";
  const leaders: Leader[] = board.slice(0, 5).map((l, i) => ({
    rank: i + 1,
    name: l.name,
    score: l.score,
    delta: showBets && l.wagerDelta ? `${l.wagerDelta > 0 ? "+" : "−"}${Math.abs(l.wagerDelta)} BET` : "",
    deltaUp: l.wagerDelta > 0,
  }));

  return {
    version,
    now,
    mode: g.mode,
    onAir: g.onAir,
    phase: g.phase,
    round: g.round,
    roundName: ROUND_NAMES[g.round],
    roundDate: ROUND_DATES[g.round],
    roundLen: round.length,
    playerCount: snap.players.length,
    slots: buildSlots(snap),
    voting,
    reveal,
    wager,
    tb,
    leaders,
    champion: champ?.name ?? null,
    finishedAt: g.finishedAt,
  };
}

function hostStatus(snap: Snapshot, view: PublicView): string {
  const g = snap.game;
  const len = ROUNDS[g.round].length;
  const lvl = level(g, currentMatch(g));
  switch (g.phase) {
    case "lobby":
      return `lobby · ${view.playerCount} ${view.playerCount === 1 ? "player" : "players"} in`;
    case "voting":
      return `voting open · ${view.voting!.done}/${view.voting!.total} cards in`;
    case "wager":
      return `final wager · ${view.wager!.locked}/${view.wager!.total} bets locked`;
    case "tb":
      return `tiebreaker · ${view.tb!.rows.filter((r) => r.status === "LOCKED").length}/${view.tb!.rows.length} guesses in`;
    case "tbDone":
      return "tiebreaker settled";
    case "reveal": {
      if (lvl === 0) return `match ${g.revealIdx + 1} of ${len} on screen`;
      if (lvl === 1) return "party vote shown";
      if (g.revealIdx < len - 1) return `match ${g.revealIdx + 1} final`;
      if (g.round < 2) return "round complete";
      if (g.round === 2) return "semis complete";
      return view.champion ? "bracket complete" : "final revealed";
    }
  }
}

export function buildHostView(snap: Snapshot, version: number, history: GameState[], now: number): HostView {
  const view = buildPublicView(snap, version, now);
  const primary = hostPrimary(snap, now);
  const missing = view.voting ? view.voting.total - view.voting.done : 0;
  if (primary.action === "lockRound" && missing === 0) primary.label = "Lock round · all cards in";
  const board = scoreboard(snap, now);
  const champ = champion(snap, now);
  if (champ) board.sort((a, b) => Number(b.playerId === champ.playerId) - Number(a.playerId === champ.playerId));
  return {
    ...view,
    status: hostStatus(snap, view),
    primary,
    missing,
    canUndo: history.length > 0,
    talkAll:
      snap.game.phase === "voting"
        ? ROUNDS[snap.game.round].flatMap((m) => talkFor(snap, m, now))
        : snap.game.phase === "reveal"
          ? talkFor(snap, currentMatch(snap.game), now)
          : [],
    players: board.map((l) => ({ id: l.playerId, name: l.name, isBot: l.isBot, score: l.score })),
    bots: snap.players.filter((p) => p.isBot).length,
    rejoins: snap.players
      .filter((p) => p.rejoinedAt)
      .map((p) => ({ playerId: p.id, name: p.name, at: p.rejoinedAt! }))
      .sort((a, b) => b.at - a.at),
  };
}

// ── Player phone ─────────────────────────────────────────────────────────────

export type RosterRow = { name: string; guestId: string | null; playerId: string | null; playing: boolean; sub: string };

export type PlayerMe = {
  id: string;
  name: string;
  isBot: boolean;
  score: number;
  base: number;
  votes: Record<number, number>;
  talk: Record<number, string>;
  /** Result line for the match on screen during a reveal. */
  result: string;
  /** This player's own bet as saved (only ever sent to them). */
  bet: { amount: number; locked: boolean } | null;
  /** Tiebreaker, from this player's point of view. */
  tb: { tied: boolean; guess: number | null; off: number | null } | null;
};

export type PlayerView = Omit<PublicView, "slots"> & {
  me: PlayerMe | null;
  /** Only once the game is finished: poster, leaderboard and everyone's card. */
  final: FinalBoard | null;
  /** Everyone's non-hidden trash talk for the match on screen once its party vote is out. */
  matchTalk: { who: string; bear: string; text: string; mine: boolean }[];
  roster: RosterRow[];
  signedIn: { guestId: string; name: string; playerId: string | null } | null;
  viewingAs: boolean;
};

export function buildPlayerView(
  snap: Snapshot,
  version: number,
  now: number,
  opts: {
    playerId: string | null;
    guests: { id: string; name: string; status: string | null }[];
    signedIn: { id: string; name: string } | null;
    viewingAs: boolean;
  },
): PlayerView {
  const { slots: _slots, ...pub } = buildPublicView(snap, version, now);
  void _slots;
  const g = snap.game;
  const player = snap.players.find((p) => p.id === opts.playerId) ?? null;

  let me: PlayerMe | null = null;
  if (player) {
    const line = scoreboard(snap, now).find((l) => l.playerId === player.id)!;
    const votes: Record<number, number> = {};
    for (const v of snap.votes) if (v.playerId === player.id) votes[v.matchId] = v.bearNum;
    const talk: Record<number, string> = {};
    for (const t of snap.talk) if (t.playerId === player.id) talk[t.matchId] = t.text;

    let result = "";
    if (pub.reveal && pub.reveal.level >= 1) {
      const m = pub.reveal.matchId;
      const counted = countedVotes(snap, now).find((v) => v.playerId === player.id && v.matchId === m);
      const pw = partyWinner(countedVotes(snap, now), m);
      result = !counted
        ? "NO VOTE THIS MATCH"
        : pw === null
          ? "+1 PT · SPLIT ROOM, EVERYONE SCORES"
          : counted.bearNum === pw
            ? "+1 PT · YOU READ THE ROOM"
            : "AGAINST THE ROOM · 0 PTS";
      if (m === FINAL && line.bet > 0)
        result +=
          line.wagerDelta > 0 ? ` · BET +${line.bet}` : line.wagerDelta < 0 ? ` · BET −${line.bet}` : " · BET KEPT";
    }
    const w = snap.wagers.find((x) => x.playerId === player.id);
    let tb: PlayerMe["tb"] = null;
    if (g.phase === "tb" || g.phase === "tbDone") {
      const ranking = tiebreakerRanking(snap, now);
      const row = ranking.rows.find((x) => x.playerId === player.id);
      const own = snap.tbGuesses.find((x) => x.playerId === player.id);
      tb = {
        tied: !!row,
        guess: own ? own.value : null,
        off: g.phase === "tbDone" && own ? Math.abs(own.value - ranking.answer) : null,
      };
    }
    me = {
      id: player.id,
      name: player.name,
      isBot: player.isBot,
      score: line.score,
      base: line.base,
      votes,
      talk,
      result,
      bet: w ? { amount: w.amount, locked: w.lockedAt != null } : null,
      tb,
    };
  }

  let matchTalk: PlayerView["matchTalk"] = [];
  if (pub.reveal && pub.reveal.level >= 1) {
    matchTalk = talkFor(snap, pub.reveal.matchId, now)
      .filter((t) => !t.hidden)
      .map((t) => ({ who: t.who, bear: t.bear, text: t.text, mine: t.playerId === player?.id }));
  }

  // Roster: guests who haven't said no, plus +1s already playing (so they can say "That's me").
  const byGuest = new Map(snap.players.filter((p) => p.guestId).map((p) => [p.guestId!, p]));
  const roster: RosterRow[] = [];
  if (!player) {
    for (const gu of opts.guests) {
      if (gu.status === "no" && !byGuest.has(gu.id)) continue;
      const p = byGuest.get(gu.id);
      roster.push({ name: gu.name, guestId: gu.id, playerId: p?.id ?? null, playing: !!p, sub: "" });
    }
    for (const p of snap.players)
      if (!p.guestId && !p.isBot) roster.push({ name: p.name, guestId: null, playerId: p.id, playing: true, sub: "+1" });
    roster.sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    ...pub,
    me,
    final: buildFinalBoard(snap, now),
    matchTalk,
    roster,
    signedIn: opts.signedIn
      ? { guestId: opts.signedIn.id, name: opts.signedIn.name, playerId: byGuest.get(opts.signedIn.id)?.id ?? null }
      : null,
    viewingAs: opts.viewingAs,
  };
}

// ── App-wide status (nav tab + live banner) ──────────────────────────────────

export const CHAMPION_BANNER_MS = 48 * 3600 * 1000;

export type BracketStatus = {
  mode: Mode;
  onAir: boolean;
  phase: Phase;
  /** The Bracket tab is locked (shows the info sheet) until the host first goes live. */
  tabLocked: boolean;
  roundName: string;
  roundLen: number;
  revealNum: number;
  cards: { done: number; total: number } | null;
  me: { joined: boolean; cardDone: boolean };
  finishedAt: number | null;
  champion: string | null;
  bearChampion: string;
};

export function buildStatus(snap: Snapshot, now: number, playerId: string | null): BracketStatus {
  const g = snap.game;
  const round = ROUNDS[g.round];
  const joined = !!playerId && snap.players.some((p) => p.id === playerId);
  let cards: BracketStatus["cards"] = null;
  let cardDone = false;
  if (g.phase === "voting") {
    const c = cardsIn(snap, g.round, now);
    cards = { done: c.done, total: c.total };
    // Your own card counts as soon as you've voted, even before the poll catches up.
    cardDone = joined && round.every((m) => snap.votes.some((v) => v.playerId === playerId && v.matchId === m));
  }
  const champ = g.finishedAt ? champion(snap, now) : null;
  return {
    mode: g.mode,
    onAir: g.onAir,
    phase: g.phase,
    tabLocked: !g.onAir && g.phase === "lobby" && !g.finishedAt,
    roundName: ROUND_NAMES[g.round],
    roundLen: round.length,
    revealNum: g.revealIdx + 1,
    cards,
    me: { joined, cardDone },
    finishedAt: g.finishedAt,
    champion: champ?.name ?? null,
    bearChampion: getBracketBear(officialWinner(FINAL))?.short ?? "",
  };
}

// ── Finished bracket (Bracket tab after the Final) ──────────────────────────

export type FinalBoard = {
  slots: Slot[];
  partyWinners: Record<number, number | null>;
  players: { id: string; name: string; score: number; picks: Record<number, number> }[];
};

export function buildFinalBoard(snap: Snapshot, now: number): FinalBoard | null {
  if (!snap.game.finishedAt) return null;
  const votes = countedVotes(snap, now);
  const partyWinners: Record<number, number | null> = {};
  for (let m = 0; m <= FINAL; m++) partyWinners[m] = partyWinner(votes, m);
  const champ = champion(snap, now);
  const board = scoreboard(snap, now);
  if (champ) board.sort((a, b) => Number(b.playerId === champ.playerId) - Number(a.playerId === champ.playerId));
  return {
    slots: buildSlots(snap),
    partyWinners,
    players: board.map((l) => {
      const picks: Record<number, number> = {};
      for (const v of votes) if (v.playerId === l.playerId) picks[v.matchId] = v.bearNum;
      return { id: l.playerId, name: l.name, score: l.score, picks };
    }),
  };
}

// ── Recap (after the Final) ──────────────────────────────────────────────────

export type RecapMatch = {
  id: number;
  round: string;
  a: BearCard;
  b: BearCard;
  party: [number, number];
  katmai: [number, number];
  partyWinner: BearCard | null;
  winner: BearCard;
  busted: boolean;
  margin: number;
};

export type RecapPlayer = {
  rank: number;
  name: string;
  afterSemis: number;
  bet: number;
  wagerDelta: number;
  wagerResult: string | null;
  score: number;
  withRoom: number;
  voted: number;
  matchedKatmai: number;
};

export type Recap = {
  champion: string;
  championScore: number;
  bearChampion: BearCard;
  players: RecapPlayer[];
  matches: RecapMatch[];
  busters: RecapMatch[];
  closest: RecapMatch[];
  lopsided: RecapMatch[];
  splits: number;
  /** Who led going into the Final Wager, if the wager changed the outcome. */
  semisLeaders: { names: string[]; score: number; finalScores: number[] } | null;
  allIn: { count: number; won: number; lost: number };
  superlatives: { title: string; name: string; detail: string }[];
  tiebreaker: { answer: number; rows: { name: string; guess: number | null; off: number | null }[] } | null;
  quotes: { who: string; bear: string; text: string; match: string }[];
};

export function buildRecap(snap: Snapshot, now: number): Recap | null {
  const g = snap.game;
  if (!g.finishedAt) return null;
  const champ = champion(snap, now);
  if (!champ) return null;
  const votes = countedVotes(snap, now);
  const board = scoreboard(snap, now);
  board.sort((a, b) => Number(b.playerId === champ.playerId) - Number(a.playerId === champ.playerId));

  const matches: RecapMatch[] = OFFICIAL.map((o) => {
    const t = tally(votes, o.id);
    const pw = partyWinner(votes, o.id);
    const [a, b] = parts(o.id);
    return {
      id: o.id,
      round: o.round,
      a: bearCard(a),
      b: bearCard(b),
      party: t,
      katmai: [o.aVotes, o.bVotes],
      partyWinner: pw == null ? null : bearCard(pw),
      winner: bearCard(o.winner),
      busted: pw != null && pw !== o.winner,
      margin: Math.abs(t[0] - t[1]),
    };
  });
  const voted = matches.filter((m) => m.party[0] + m.party[1] > 0);
  const minMargin = Math.min(...voted.map((m) => m.margin));
  const maxMargin = Math.max(...voted.map((m) => m.margin));

  const players: RecapPlayer[] = board.map((l, i) => {
    const mine = votes.filter((v) => v.playerId === l.playerId);
    const withRoom = mine.filter((v) => matchPoints(v.bearNum, votes, v.matchId).points === 1).length;
    return {
      rank: i + 1,
      name: l.name,
      afterSemis: l.base,
      bet: l.bet,
      wagerDelta: l.wagerDelta,
      wagerResult: l.wagerResult,
      score: l.score,
      withRoom,
      voted: mine.length,
      matchedKatmai: mine.filter((v) => v.bearNum === officialWinner(v.matchId)).length,
    };
  });

  // Did the wager change who won? Compare the leaders after the Semis with the champion.
  const topSemis = Math.max(...players.map((p) => p.afterSemis));
  const leaders = players.filter((p) => p.afterSemis === topSemis);
  const semisLeaders = leaders.some((p) => p.name === champ.name)
    ? null
    : { names: leaders.map((p) => p.name), score: topSemis, finalScores: leaders.map((p) => p.score) };

  const allInPlayers = players.filter((p) => p.bet > 0 && p.bet === p.afterSemis);

  const superlatives: Recap["superlatives"] = [];
  const full = players.filter((p) => p.voted >= 8);
  const best = (pick: (p: RecapPlayer) => number, pool = full) => {
    const top = Math.max(...pool.map(pick));
    return pool.filter((p) => pick(p) === top);
  };
  const names = (ps: RecapPlayer[]) => ps.map((p) => p.name).join(" & ");
  if (full.length) {
    const kw = best((p) => p.matchedKatmai);
    superlatives.push({
      title: "KATMAI WHISPERER",
      name: names(kw),
      detail: `Picked Katmai’s winner ${kw[0].matchedKatmai} of ${kw[0].voted} times. Katmai’s count never scores, but still.`,
    });
    const rebels = best((p) => p.voted - p.withRoom);
    superlatives.push({
      title: "LONE WOLF",
      name: names(rebels),
      detail: `Voted against the room ${rebels[0].voted - rebels[0].withRoom} times.`,
    });
  }
  const swing = [...players].sort((a, b) => a.wagerDelta - b.wagerDelta)[0];
  if (swing && swing.wagerDelta < 0)
    superlatives.push({
      title: "BIGGEST FALL",
      name: names(players.filter((p) => p.wagerDelta === swing.wagerDelta)),
      detail: `Bet ${-swing.wagerDelta} on the Final and lost every point of it.`,
    });

  let tiebreaker: Recap["tiebreaker"] = null;
  if (g.phase === "tbDone") {
    const r = tiebreakerRanking(snap, now);
    tiebreaker = { answer: r.answer, rows: r.rows.map((x) => ({ name: x.name, guess: x.guess, off: x.off })) };
  }

  const nameOf = new Map(snap.players.map((p) => [p.id, p.name]));
  const quotes = snap.talk
    .filter((t) => !t.hidden && t.at <= now && nameOf.has(t.playerId))
    .sort((a, b) => a.at - b.at)
    .map((t) => {
      const v = snap.votes.find((x) => x.playerId === t.playerId && x.matchId === t.matchId);
      const [a, b] = parts(t.matchId);
      return {
        who: nameOf.get(t.playerId)!,
        bear: v ? bearCard(v.bearNum).short : "",
        text: t.text,
        match: `${OFFICIAL[t.matchId].round} · ${bearCard(a).short} vs ${bearCard(b).short}`,
      };
    });

  return {
    champion: champ.name,
    championScore: champ.score,
    bearChampion: bearCard(officialWinner(FINAL)),
    players,
    matches,
    busters: matches.filter((m) => m.busted),
    closest: voted.filter((m) => m.margin === minMargin),
    lopsided: voted.filter((m) => m.margin === maxMargin),
    splits: voted.filter((m) => m.margin === 0).length,
    semisLeaders,
    allIn: {
      count: allInPlayers.length,
      won: allInPlayers.filter((p) => p.wagerDelta > 0).length,
      lost: allInPlayers.filter((p) => p.wagerDelta < 0).length,
    },
    superlatives,
    tiebreaker,
    quotes,
  };
}
