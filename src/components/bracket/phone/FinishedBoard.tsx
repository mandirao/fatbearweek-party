"use client";

import { useEffect, useRef, useState } from "react";
import { getBracketBear, OFFICIAL, parts, ROUND_NAMES, roundOf, FINAL } from "@/lib/bracket/engine";
import type { FinalBoard } from "@/lib/bracket/view";
import { Medallion } from "../TvScreen";
import { up } from "./api";

const short = (n: number) => getBracketBear(n)?.short ?? String(n);
const POSTER_W = 1166;
const POSTER_H = 900;

function Poster({ final }: { final: FinalBoard }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / POSTER_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="w-full overflow-hidden" style={{ height: POSTER_H * scale }}>
      <div className="relative origin-top-left" style={{ width: POSTER_W, height: POSTER_H, transform: `scale(${scale})` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/bracket/poster.jpg" alt="The finished Fat Bear Week 2026 bracket" className="block w-full h-full" />
        {final.slots.map((s, i) => (
          <Medallion key={i} s={s} />
        ))}
      </div>
    </div>
  );
}

function Card({ picks, partyWinners }: { picks: Record<number, number>; partyWinners: FinalBoard["partyWinners"] }) {
  return (
    <div className="flex flex-col">
      {OFFICIAL.map((m) => {
        const [a, b] = parts(m.id);
        const pick = picks[m.id];
        const pw = partyWinners[m.id];
        const scored = pick != null && (pw == null || pick === pw);
        const firstOfRound = m.id === 0 || roundOf(m.id) !== roundOf(m.id - 1);
        return (
          <div key={m.id} className="flex flex-col">
            {firstOfRound && (
              <span className="font-pixel text-[10px] text-ice pt-2.5 pb-1">{up(ROUND_NAMES[roundOf(m.id)])}</span>
            )}
            <div
              className="grid gap-2 items-center py-1.5 border-t border-line text-[13.5px]"
              style={{ gridTemplateColumns: "minmax(0,1fr) auto 20px" }}
            >
              <span className="text-arcade-cream">
                {short(a)} vs {short(b)}
              </span>
              <span className="font-pixel text-[11px] text-gold">{pick ? up(short(pick)) : "—"}</span>
              <span className={`text-right font-bold ${scored ? "text-gold" : "text-[#5E7A8C]"}`} aria-label={scored ? "scored" : "no point"}>
                {pick == null ? "" : scored ? "✓" : "✗"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FinishedBoard({ final, meId, champion }: { final: FinalBoard; meId: string | null; champion: string | null }) {
  const [open, setOpen] = useState<string | null>(meId);
  const bearChamp = getBracketBear(OFFICIAL[FINAL].winner);

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-8 font-game text-arcade-cream border-t-[3px] border-arcade-red">
      <div className="flex flex-col gap-1">
        <span className="font-pixel text-[12px] text-gold">BRACKET NIGHT · FINAL</span>
        <span className="font-pixel text-[24px] leading-none">THE FINISHED BRACKET</span>
      </div>
      <div className="bg-arcade-red border-[3px] border-gold p-3 flex flex-col gap-1">
        <span className="font-pixel text-[13px] text-white">PARTY CHAMPION</span>
        <span className="font-pixel text-[24px] text-gold">{up(champion ?? "")}</span>
        <span className="text-[14px] text-white">{bearChamp?.label} takes the Golden Salmon.</span>
      </div>
      <Poster final={final} />
      <div className="flex flex-col gap-1.5">
        <span className="font-pixel text-[12px] text-ice">READ THE ROOM · FINAL LEADERBOARD</span>
        {final.players.map((p, i) => {
          const isOpen = open === p.id;
          return (
            <div key={p.id} className={`flex flex-col ${isOpen ? "bg-night" : ""}`}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : p.id)}
                aria-expanded={isOpen}
                className="flex justify-between items-center gap-2.5 min-h-11 px-2 bg-transparent border-none text-left font-game text-[16px] font-semibold cursor-pointer"
                style={{ color: i === 0 ? "#F7C21B" : "#F3E6C4" }}
              >
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {i + 1}. {p.name}
                  {p.id === meId ? " (you)" : ""}
                </span>
                <span className="flex items-center gap-2 flex-none">
                  <span className="font-pixel text-gold">{p.score}</span>
                  <span className="text-ice text-[12px]">{isOpen ? "▲" : "▼"}</span>
                </span>
              </button>
              {isOpen && (
                <div className="px-2 pb-3">
                  <Card picks={p.picks} partyWinners={final.partyWinners} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
