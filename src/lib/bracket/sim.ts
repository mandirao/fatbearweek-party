// Plays a full rehearsal game with bots through the real store + engine and returns
// a round-by-round log. Used by the CLI (`npm run bracket:sim`) and the tests.

import {
  countedVotes,
  FINAL,
  getBracketBear,
  hostPrimary,
  isBusted,
  officialWinner,
  OFFICIAL,
  partyWinner,
  parts,
  ROUND_NAMES,
  ROUNDS,
  scoreboard,
  seededRng,
  tally,
  tiebreakerRanking,
  TIEBREAKER_QUESTION,
} from "./engine";
import { addBots, forceTie, hostAction, loadSnapshot, resetBracket, setGameSettings, type Db } from "./store";

const label = (n: number | null) => (n == null ? "—" : (getBracketBear(n)?.label ?? String(n)));

export async function simulateGame(db: Db, opts: { bots?: number; seed?: number; forceTieAtEnd?: boolean } = {}) {
  const rng = seededRng(opts.seed ?? 7);
  let now = Date.UTC(2026, 9, 3, 2, 0, 0); // 8 PM MDT
  const out: string[] = [];
  const log = (s = "") => out.push(s);
  const tick = (ms: number) => (now += ms);

  await resetBracket(db);
  await setGameSettings(db, { mode: "rehearsal", onAir: true });
  await addBots(db, opts.bots ?? 10, { now, rng });

  const steps: string[] = [];
  for (let guard = 0; guard < 200; guard++) {
    const { snap, version } = await loadSnapshot(db);
    const primary = hostPrimary(snap, now);
    steps.push(primary.label);
    if (!primary.action) {
      log(`■ ${primary.label}`);
      break;
    }

    const g = snap.game;
    if (primary.action === "lockRound" || primary.action === "openFinal") tick(11_000); // let bots finish
    if (primary.action === "revealTiebreaker") tick(11_000);

    if (primary.action === "revealKatmai" && g.round === 3 && opts.forceTieAtEnd !== false) {
      await forceTie(db, now);
      log("  (rehearsal) forced a tie for first");
    }

    if (primary.action === "openRound" || primary.action === "openWager" || primary.action === "openFinal") log();
    await hostAction(db, primary.action, { now, rng, expectedVersion: version });
    tick(500);

    const after = (await loadSnapshot(db)).snap;
    const votes = countedVotes(after, now);
    const ag = after.game;

    if (primary.action === "openRound") log(`══ ${ROUND_NAMES[ag.round].toUpperCase()} OPEN ══`);
    if (primary.action === "openFinal") log(`══ FINAL OPEN (bets locked) ══`);
    if (primary.action === "lockRound") log(`  locked · ${after.votes.filter((v) => ROUNDS[ag.round].includes(v.matchId)).length} votes in`);

    if (primary.action === "revealKatmai") {
      const m = ROUNDS[ag.round][ag.revealIdx];
      const [a, b] = parts(m);
      const [ta, tb] = tally(votes, m);
      const pw = partyWinner(votes, m);
      const o = OFFICIAL[m];
      log(
        `  M${String(m).padStart(2, "0")} ${label(a)} vs ${label(b)} · party ${ta}–${tb} → ${pw == null ? "SPLIT ROOM" : label(pw)}` +
          ` · Katmai ${o.aVotes.toLocaleString()}–${o.bVotes.toLocaleString()} → ${label(officialWinner(m))}` +
          (isBusted(ag, votes, m) ? " · BRACKET BUSTED" : ""),
      );
      const lastInRound = ag.revealIdx === ROUNDS[ag.round].length - 1;
      if (lastInRound) {
        const board = scoreboard(after, now);
        log(`  scoreboard after ${ROUND_NAMES[ag.round]}: ` + board.map((l) => `${l.name} ${l.score}`).join(", "));
        if (m === FINAL) {
          log("  wagers resolved:");
          for (const l of board)
            log(`    ${l.name}: base ${l.base}, final +${l.finalPoint}, bet ${l.bet} ${l.wagerResult ?? "(none)"} ${l.wagerDelta >= 0 ? "+" : ""}${l.wagerDelta} → ${l.score}`);
        }
      }
    }

    if (primary.action === "openWager") log("══ FINAL WAGER OPEN ══");
    if (primary.action === "startTiebreaker") log(`══ TIEBREAKER ══ ${TIEBREAKER_QUESTION}`);
    if (primary.action === "revealTiebreaker") {
      const r = tiebreakerRanking(after, now);
      log(`  answer: ${r.answer}`);
      for (const row of r.rows) log(`    ${row.name}: guessed ${row.guess ?? "—"} · off by ${row.off ?? "—"}`);
      if (r.sameDistanceDecided) log("  Same distance, so the first guess locked in wins.");
    }
  }

  return { log: out.join("\n"), steps, finalSnapshot: (await loadSnapshot(db)).snap, now };
}
