"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useBracketStatus } from "./BracketStatus";
import { CHAMPION_BANNER_MS, type BracketStatus } from "@/lib/bracket/view";

function liveLines(s: BracketStatus): { title: string; sub: string } {
  const { phase, roundName, me } = s;
  if (phase === "lobby")
    return me.joined
      ? { title: "Bracket night is live", sub: "Round 1 opens soon · you’re in" }
      : { title: "Bracket night is live", sub: "Round 1 opens soon · join in one tap" };
  if (phase === "voting") {
    const c = s.cards!;
    if (!me.joined) return { title: "Not playing yet?", sub: `${roundName} is open · join in one tap` };
    if (me.cardDone) {
      const waiting = c.total - c.done;
      return {
        title: "Your card is in",
        sub: waiting > 0 ? `Waiting on ${waiting} more · reveals soon` : "All cards in · reveals soon",
      };
    }
    return { title: `${roundName} is open`, sub: `${c.done} of ${c.total} cards in · fill yours` };
  }
  if (phase === "reveal")
    return { title: `Revealing ${roundName} · match ${s.revealNum} of ${s.roundLen}`, sub: "Eyes on the big screen" };
  if (phase === "wager")
    return me.joined
      ? { title: "Final Wager is open", sub: "Bet your points before the Final" }
      : { title: "Final Wager is open", sub: "Eyes on the big screen" };
  return { title: "Tiebreaker for first", sub: "Eyes on the big screen" };
}

const dismissKey = (finishedAt: number) => `fbw-champion-dismissed-${finishedAt}`;

export function LiveBanner() {
  const s = useBracketStatus();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!s?.finishedAt) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read a per-device preference after mount
      if (localStorage.getItem(dismissKey(s.finishedAt))) setDismissed(s.finishedAt);
    } catch {}
  }, [s?.finishedAt]);

  if (!s || pathname.startsWith("/bracket")) return null;

  if (s.finishedAt) {
    if (dismissed === s.finishedAt || !now || now - s.finishedAt > CHAMPION_BANNER_MS) return null;
    const dismiss = () => {
      setDismissed(s.finishedAt);
      try {
        localStorage.setItem(dismissKey(s.finishedAt!), "1");
      } catch {}
    };
    return (
      <div className="relative bg-gold border-b-[3px] border-arcade-red">
        <Link
          href="/bracket"
          className="grid gap-3 items-center px-4 py-3 pr-12 min-h-16 no-underline font-game text-night hover:text-night"
          style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}
        >
          <span className="flex flex-col gap-px min-w-0">
            <span className="font-pixel text-[12px]">CHAMPION CROWNED</span>
            <span className="font-bold text-[15px]">{s.bearChampion} takes the Golden Salmon</span>
            {s.champion && <span className="text-[13px]">{s.champion} read the room best</span>}
          </span>
          <span className="font-pixel text-[13px] p-2.5 bg-night text-gold">BRACKET ▶</span>
        </Link>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="absolute top-0 right-0 w-11 h-11 flex items-center justify-center bg-transparent border-none text-night text-[18px] cursor-pointer"
        >
          ✕
        </button>
      </div>
    );
  }

  if (!s.onAir) return null;
  const { title, sub } = liveLines(s);
  // Only offer JUMP IN when there's something to do on the Bracket tab.
  const cta =
    (s.phase === "voting" && !s.me.cardDone) ||
    (s.phase === "wager" && s.me.joined) ||
    (s.phase === "lobby" && !s.me.joined);

  return (
    <Link
      href="/bracket"
      className="grid gap-3 items-center px-4 py-3 min-h-16 bg-deep border-b-[3px] border-arcade-red no-underline font-game text-arcade-cream hover:text-arcade-cream"
      style={{ gridTemplateColumns: cta ? "auto minmax(0,1fr) auto" : "auto minmax(0,1fr)" }}
    >
      <span className="flex items-center gap-1.5 font-pixel text-[12px] text-gold">
        <span className="w-[9px] h-[9px] rounded-full bg-arcade-red shadow-[0_0_0_4px_rgba(227,38,46,0.35)]" />
        LIVE
      </span>
      <span className="flex flex-col gap-px min-w-0">
        <span className="font-bold text-[15px]">{title}</span>
        <span className="text-[13px] text-ice">{sub}</span>
      </span>
      {cta && <span className="font-pixel text-[13px] p-2.5 bg-gold text-night">JUMP IN ▶</span>}
    </Link>
  );
}
