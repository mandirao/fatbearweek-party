"use client";

import { useState } from "react";
import { getBracketBear, parts, ROUND_NAMES, ROUNDS, TALK_MAX, type BracketBear } from "@/lib/bracket/engine";
import type { PlayerView } from "@/lib/bracket/view";
import { playerPost, up } from "./api";
import { PhotoZoom } from "./PhotoZoom";
import { TiebreakerScreen, WagerScreen } from "./FinalScreens";
import { FinishedBoard } from "./FinishedBoard";

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (a: number, b: number) => `${(a / (a + b || 1)) * 100}%`;
const bear = (n: number) => getBracketBear(n) as BracketBear;

function Bar({ a, b }: { a: number; b: number }) {
  return (
    <div className="flex h-4 border-2 border-arcade-cream">
      <span className="bg-gold transition-[width] duration-700" style={{ width: pct(a, b) }} />
      <span className="flex-1 bg-teal" />
    </div>
  );
}

export function GameScreen({
  v,
  asId,
  refresh,
}: {
  v: PlayerView;
  asId: string | null;
  refresh: () => Promise<void>;
}) {
  const me = v.me!;
  const round = ROUNDS[v.round];
  const len = round.length;
  const voting = v.phase === "voting";
  const inReveal = v.phase === "reveal";
  const waitingPhase = v.phase === "wager" || v.phase === "tb" || v.phase === "tbDone" || v.phase === "lobby";

  // Local UI state. `cur` is which matchup of the open round is on screen; len = the round card.
  const [cur, setCur] = useState(0);
  const [side, setSide] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Record<number, number>>({});
  const [err, setErr] = useState<string | null>(null);
  const [roundKey, setRoundKey] = useState(`${v.round}:${v.phase}`);
  const [revealKey, setRevealKey] = useState(v.reveal?.matchId ?? -1);

  // Reset local state when the host moves the game on (adjusting state during render).
  const key = `${v.round}:${v.phase}`;
  if (key !== roundKey) {
    setRoundKey(key);
    setCur(0);
    setSide(0);
    setDraft("");
    setPending({});
  }
  const rk = v.reveal?.matchId ?? -1;
  if (rk !== revealKey) {
    setRevealKey(rk);
    setSide(0);
  }

  const votes: Record<number, number> = { ...me.votes, ...pending };
  const onCard = voting && cur >= len;
  const m = voting ? round[Math.min(cur, len - 1)] : inReveal ? v.reveal!.matchId : round[0];
  const pr = parts(m);
  const pair = [bear(pr[0]), bear(pr[1])];
  const act = pair[side];
  const oth = pair[1 - side];
  const mine = votes[m];
  const r = v.reveal;
  const L = inReveal && r ? r.level : 0;
  const partyShown = inReveal && L >= 1;
  const isRevealed = inReveal && L >= 2;
  const myDone = round.filter((k) => votes[k]).length;

  const nextUnvoted = round.findIndex((k, i) => i > cur && !votes[k]);
  const nextIdx = nextUnvoted >= 0 ? nextUnvoted : round.every((k) => votes[k]) ? len : cur + 1;

  const vote = async () => {
    const bearNum = act.num;
    setPending((p) => ({ ...p, [m]: bearNum }));
    setErr(null);
    const res = await playerPost(asId, { op: "vote", matchId: m, bearNum });
    if (res.error) {
      setErr(res.error);
      setPending((p) => {
        const n = { ...p };
        delete n[m];
        return n;
      });
    }
    await refresh();
  };

  const sendTalk = async () => {
    const text = draft.trim();
    if (!text) return;
    setErr(null);
    const res = await playerPost(asId, { op: "talk", matchId: m, text });
    if (res.error) setErr(res.error);
    else setDraft("");
    await refresh();
  };

  const go = (i: number) => {
    setCur(i);
    setSide(0);
    setDraft("");
  };

  const title = waitingPhase
    ? v.phase === "lobby"
      ? "STAND BY"
      : v.phase === "wager"
        ? "FINAL WAGER"
        : "TIEBREAKER"
    : voting
      ? onCard
        ? `YOUR ${up(v.roundName)} CARD`
        : `MATCHUP ${cur + 1}/${len}`
      : `REVEAL ${(r?.matchNum ?? 1)}/${len}`;

  const pips = waitingPhase
    ? []
    : round.map((k, i) => {
        const on = voting ? i === cur : i === v.reveal!.matchNum - 1;
        const done = voting ? !!votes[k] : i < v.reveal!.matchNum - 1 || (on && L >= 2);
        return {
          n: i + 1,
          bg: on ? "#E3262E" : done ? "#F7C21B" : "transparent",
          bd: on || done ? "#F7C21B" : "#1C6E8C",
          fg: on ? "#FFF" : done ? "#081627" : "#7FC4DA",
          go: () => voting && go(i),
        };
      });

  const tab = (b: BracketBear, on: boolean) => ({
    label: up(b.short),
    sub: mine === b.num ? "YOUR PICK" : b.cls,
    bg: on ? "#E3262E" : "transparent",
    bd: mine === b.num ? "#F7C21B" : on ? "#E3262E" : "#1C6E8C",
    fg: on ? "#FFF" : "#F3E6C4",
  });
  const tabs = [tab(pair[0], side === 0), tab(pair[1], side === 1)];

  const lastInRound = inReveal && r && r.matchNum === len;
  const roundOver = lastInRound && L >= 2;
  const betweenText = v.round < 3 ? `${ROUND_NAMES[v.round + 1]} opens when the host is ready.` : "That’s the bracket. Long live the champion.";

  const myTalkLine = me.talk[m];
  const talkList = partyShown
    ? v.matchTalk.map((t) => ({ who: t.who, bear: t.bear, text: t.text }))
    : mine && myTalkLine
      ? [{ who: me.name, bear: bear(mine).short, text: myTalkLine }]
      : [];
  const showTalk = (voting && !onCard && !!mine) || partyShown;
  const canTalk = voting && !!mine;

  return (
    <div className="flex flex-col font-game text-arcade-cream min-h-[calc(100dvh-100px)]">
      {zoom && <PhotoZoom bear={act} onClose={() => setZoom(false)} />}

      <div className="px-4 pt-[18px] pb-3 flex flex-col gap-3 bg-night border-b-[3px] border-arcade-red">
        <div className="flex justify-between items-center gap-2">
          <span className="font-pixel text-[13px] text-gold">
            {up(v.roundName)} · {up(["Sept 23–24", "Sept 25", "Sept 28", "Sept 29"][v.round])}
          </span>
          <span className="font-pixel text-[13px] text-arcade-cream text-right">
            {up(me.name)} · {me.score} PTS
          </span>
        </div>
        <span className="font-pixel text-[24px] leading-none">{title}</span>
        {pips.length > 0 && (
          <div className="flex gap-1">
            {pips.map((p) => (
              <button
                key={p.n}
                type="button"
                onClick={p.go}
                aria-label={`Matchup ${p.n}`}
                className="flex-1 min-w-0 h-11 p-0 bg-transparent border-none cursor-pointer flex items-center"
              >
                <span
                  className="w-full h-[26px] flex items-center justify-center font-pixel text-[11px] border-2"
                  style={{ borderColor: p.bd, background: p.bg, color: p.fg }}
                >
                  {p.n}
                </span>
              </button>
            ))}
          </div>
        )}
        {!onCard && !waitingPhase && (
          <div className="grid gap-2 items-stretch" style={{ gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)" }}>
            {[0, 1].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSide(i)}
                className="font-pixel text-[15px] min-h-[52px] rounded border-[3px] cursor-pointer flex flex-col items-center justify-center gap-0.5 p-1"
                style={{ borderColor: tabs[i].bd, background: tabs[i].bg, color: tabs[i].fg, order: i === 0 ? 0 : 2 }}
              >
                <span>{tabs[i].label}</span>
                <span className="font-game text-[11px] font-semibold">{tabs[i].sub}</span>
              </button>
            ))}
            <span className="font-pixel font-bold text-[20px] text-gold flex items-center" style={{ order: 1 }}>
              VS
            </span>
          </div>
        )}
      </div>

      {v.phase === "wager" && <WagerScreen v={v} asId={asId} refresh={refresh} />}
      {(v.phase === "tb" || v.phase === "tbDone") && v.tb && <TiebreakerScreen v={v} asId={asId} refresh={refresh} />}

      {v.phase === "lobby" && (
        <div className="px-4 py-6 flex flex-col gap-2 items-center text-center">
          <span className="font-pixel text-[16px] text-gold">EYES ON THE BIG SCREEN</span>
          <span className="text-[15px] leading-[1.45]">Round 1 opens when the host is ready.</span>
        </div>
      )}

      {onCard && (
        <div className="px-4 py-[18px] flex flex-col gap-3.5">
          <div className="bg-gold text-night p-3 flex flex-col gap-1">
            <span className="font-pixel text-[18px]">CARD LOCKED IN</span>
            <span className="text-[14.5px] leading-[1.4] font-semibold">
              {myDone === len
                ? `All ${len} picks in. The host locks the round when everyone’s done.`
                : `${myDone} of ${len} picked. Finish the rest before the host locks.`}
            </span>
          </div>
          {round.map((k, i) => {
            const p = parts(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => go(i)}
                className="grid gap-2.5 items-center bg-night border-2 border-teal px-3 py-2.5 min-h-12 cursor-pointer text-left font-game text-arcade-cream"
                style={{ gridTemplateColumns: "auto minmax(0,1fr) auto" }}
              >
                <span className="font-pixel text-[12px] text-ice">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[14px]">
                  {bear(p[0]).short} vs {bear(p[1]).short}
                </span>
                <span className="font-pixel text-[13px] text-gold">{votes[k] ? up(bear(votes[k]).short) : "—"}</span>
              </button>
            );
          })}
          <span className="text-[13px] text-ice">Tap a matchup to change your pick until the host locks the round.</span>
        </div>
      )}

      {inReveal && L === 0 && (
        <div className="px-4 py-3.5 bg-night flex flex-col gap-1 items-center text-center">
          <span className="font-pixel text-[16px] text-gold">EYES ON THE BIG SCREEN</span>
          <span className="text-[14.5px]">
            Party vote coming up. You picked <strong className="text-gold">{mine ? bear(mine).label : "nobody"}</strong>.
          </span>
        </div>
      )}

      {partyShown && r?.party && (
        <div className="p-4 flex flex-col gap-3 bg-night">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between font-pixel text-[12px]">
              <span>
                PARTY {up(pair[0].short)} {r.party[0]}
              </span>
              <span>
                {r.party[1]} {up(pair[1].short)}
              </span>
            </div>
            <Bar a={r.party[0]} b={r.party[1]} />
          </div>
          <span className="font-pixel text-[15px] text-center">{me.result}</span>
          {L === 1 && <span className="font-pixel text-[13px] text-center text-ice">KATMAI COUNT NEXT...</span>}
          {isRevealed && r.katmai && r.winner && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-pixel text-[12px]">
                  <span>
                    KATMAI {up(pair[0].short)} {fmt(r.katmai[0])}
                  </span>
                  <span>
                    {fmt(r.katmai[1])} {up(pair[1].short)}
                  </span>
                </div>
                <Bar a={r.katmai[0]} b={r.katmai[1]} />
              </div>
              {r.busted && (
                <div className="bg-arcade-red border-[3px] border-gold p-3 flex flex-col gap-1 items-center text-center">
                  <span className="font-pixel text-[22px] text-gold">BRACKET BUSTED!</span>
                  <span className="text-[14px] leading-[1.4] text-white">{r.bustText}</span>
                </div>
              )}
              <span className="font-pixel text-[20px] text-gold text-center">{up(r.winner.short)} ADVANCES</span>
              {v.champion && v.round === 3 && (
                <div className="bg-arcade-red border-[3px] border-gold p-3 flex flex-col gap-1">
                  <span className="font-pixel text-[13px] text-white">PARTY CHAMPION</span>
                  <span className="font-pixel text-[24px] text-gold">{up(v.champion)}</span>
                </div>
              )}
            </div>
          )}
          {roundOver && <span className="text-[14px] text-center text-ice">{betweenText}</span>}
        </div>
      )}

      {!onCard && !waitingPhase && (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setZoom(true)}
            className="relative block w-full p-0 border-none bg-black min-h-[120px] cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={act.photo} alt={`${act.label} before and after`} className="block w-full h-auto" />
            <span className="absolute right-2 bottom-2 bg-night border-2 border-gold text-gold font-pixel text-[11px] px-2 py-[5px] flex items-center gap-1.5">
              ⤢ TAP TO ENLARGE
            </span>
          </button>
          <div className="px-4 pt-3.5 pb-5 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-pixel text-[34px] leading-none text-arcade-cream">{act.label}</span>
              <span className="font-semibold text-[13px] tracking-[0.12em] text-gold">{up(act.cls)}</span>
            </div>
            <span className="font-bold text-[17px] leading-[1.35] text-white">{act.hook}</span>
            <div className="border-2 border-teal px-3 py-2.5 flex flex-col gap-1">
              <span className="font-pixel text-[11px] text-ice">HOW TO SPOT</span>
              <span className="text-[15px] leading-[1.5]">{act.id}</span>
            </div>
            <div className="border-2 border-teal px-3 py-2.5 flex flex-col gap-1">
              <span className="font-pixel text-[11px] text-ice">THIS SUMMER</span>
              <span className="text-[15px] leading-[1.5] text-pretty">{act.story}</span>
            </div>
            {act.fishes && (
              <span className="text-[14px]">
                <span className="font-pixel text-[11px] text-ice">FISHES </span>
                {act.fishes}
              </span>
            )}
            <a href="https://explore.org/meet-the-bears" target="_blank" rel="noreferrer" className="text-[14px] text-ice hover:text-gold min-h-11 inline-flex items-center">
              Full bio on explore.org →
            </a>
          </div>
        </div>
      )}

      {showTalk && !waitingPhase && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          <span className="font-pixel text-[12px] text-gold">TRASH TALK</span>
          {canTalk && (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendTalk();
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={myTalkLine ? "Change your line…" : "Make your case…"}
                maxLength={TALK_MAX}
                enterKeyHint="send"
                className="flex-1 min-w-0 font-game text-[16px] px-3 min-h-11 border-2 border-teal bg-night text-arcade-cream rounded-none"
              />
              <button type="submit" className="font-pixel text-[13px] min-h-11 px-3 border-none bg-gold text-night cursor-pointer">
                POST
              </button>
            </form>
          )}
          {talkList.map((t, i) => (
            <div key={i} className="border-l-4 border-arcade-red bg-night px-2.5 py-2 flex flex-col gap-0.5">
              <span className="font-pixel text-[11px] text-gold">
                {up(t.who)} → {up(t.bear)}
              </span>
              <span className="text-[14.5px] leading-[1.4]">{t.text}</span>
            </div>
          ))}
        </div>
      )}

      {err && <div className="px-4 pb-3 text-[14px] text-gold">{err}</div>}

      {v.final && <FinishedBoard final={v.final} meId={me.id} champion={v.champion} />}

      {voting && !onCard && (
        <div
          className="sticky bottom-0 mt-auto bg-night border-t-[3px] border-arcade-red px-3.5 pt-3 pb-[max(22px,env(safe-area-inset-bottom))] grid gap-2.5"
          style={{ gridTemplateColumns: "auto minmax(0,1fr)" }}
        >
          <button
            type="button"
            onClick={() => setSide(1 - side)}
            className="font-pixel text-[13px] min-h-[54px] px-3 border-[3px] border-teal bg-transparent text-arcade-cream cursor-pointer"
          >
            SEE {up(oth.short)}
          </button>
          {mine !== act.num ? (
            <button
              type="button"
              onClick={vote}
              className="font-pixel text-[16px] min-h-[54px] border-[3px] border-gold bg-gold text-night cursor-pointer"
            >
              CHOOSE {up(act.short)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go(nextIdx)}
              className="font-pixel text-[15px] min-h-[54px] border-[3px] border-gold bg-arcade-red text-gold cursor-pointer"
            >
              {nextIdx >= len ? "LOCKED · SEE CARD ▶" : "LOCKED · NEXT ▶"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
