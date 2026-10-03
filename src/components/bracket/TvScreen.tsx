"use client";

import { useEffect, useState } from "react";
import { usePoll } from "./usePoll";
import type { PublicView, Slot } from "@/lib/bracket/view";
import { SITE_URL } from "@/lib/party";

const W = 1600;
const H = 900;
const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (a: number, b: number) => `${(a / (a + b || 1)) * 100}%`;
const up = (s: string) => s.toUpperCase();

function useFitScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return scale;
}

export function Medallion({ s }: { s: Slot }) {
  const glow =
    s.hot === "vote"
      ? "0 0 14px 3px rgba(247,194,27,0.6)"
      : s.hot === "reveal"
        ? "0 0 0 4px #F7C21B, 0 0 24px 6px rgba(247,194,27,0.8)"
        : "none";
  return (
    <div
      className="absolute rounded-full flex items-center justify-center font-pixel font-bold leading-none text-night transition-opacity duration-500"
      style={{
        left: `${s.x}%`,
        top: `${s.y}%`,
        width: s.big ? "9.5%" : "4.9%",
        aspectRatio: "1",
        transform: "translate(-50%,-50%)",
        background: s.big ? "#F7C21B" : "#F3E6C4",
        border: `4px solid ${s.hot ? "#F7C21B" : "#E3262E"}`,
        boxShadow: glow,
        opacity: s.lost ? 0.35 : 1,
        fontSize: s.big ? 30 : String(s.num).length > 2 ? 17 : 21,
      }}
    >
      {s.num}
    </div>
  );
}

function SplitBar({ a, b }: { a: number; b: number }) {
  return (
    <div className="flex h-[14px] border-2 border-arcade-cream">
      <span className="bg-gold transition-[width] duration-700" style={{ width: pct(a, b) }} />
      <span className="flex-1 bg-teal" />
    </div>
  );
}

function Lobby({ v }: { v: PublicView }) {
  const paused = v.phase !== "lobby";
  const host = SITE_URL.replace(/^https?:\/\//, "");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="font-pixel text-[14px] text-gold">{paused ? "BE RIGHT BACK" : "TONIGHT · FAT BEAR WEEK 2026"}</span>
        <span className="font-pixel text-[34px] leading-none">BRACKET NIGHT</span>
        <span className="text-[17px] leading-[1.4] text-ice">
          {paused
            ? "The host paused the game. Nothing is lost. Back in a moment."
            : "Pick the fatter bear. Score by agreeing with the room."}
        </span>
      </div>
      {!paused && (
        <div className="flex flex-col gap-1.5 border-2 border-teal p-3">
          <span className="font-pixel text-[13px] text-ice">JOIN ON YOUR PHONE</span>
          <span className="font-pixel text-[22px] text-gold">{up(host)}</span>
          <span className="text-[16px]">Open the BRACKET tab. Round 1 · Round 2 · Semifinal · Final.</span>
        </div>
      )}
      <span className="font-pixel text-[18px] text-gold">
        {v.playerCount} {v.playerCount === 1 ? "PLAYER" : "PLAYERS"} IN
      </span>
    </div>
  );
}

function Voting({ v }: { v: PublicView }) {
  const vt = v.voting!;
  const two = vt.progress.length > 12;
  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="flex flex-col gap-1">
        <span className="font-pixel text-[14px] text-gold">NOW OPEN · {up(v.roundDate)}</span>
        <span className="font-pixel text-[34px] leading-none">{up(v.roundName)}</span>
        <span className="text-[17px] text-ice">
          {v.roundLen} {v.roundLen === 1 ? "matchup" : "matchups"} · fill in your card
        </span>
      </div>
      <div className={two ? "grid grid-cols-2 gap-x-4 gap-y-[5px]" : "flex flex-col gap-[7px]"}>
        {vt.progress.map((g) => {
          const c = g.done === g.total ? "#F7C21B" : "#7FC4DA";
          return (
            <div
              key={g.name}
              className="grid items-center gap-2.5"
              style={{ gridTemplateColumns: two ? "64px minmax(0,1fr) 32px" : "80px minmax(0,1fr) 40px" }}
            >
              <span className={`font-semibold overflow-hidden text-ellipsis whitespace-nowrap ${two ? "text-[14px]" : "text-[16px]"}`}>
                {g.name}
              </span>
              <div className="h-3 border-2 border-teal flex">
                <span className="transition-[width] duration-500" style={{ width: `${(g.done / g.total) * 100}%`, background: c }} />
              </div>
              <span className="font-pixel text-[13px] text-right" style={{ color: c }}>
                {g.done}/{g.total}
              </span>
            </div>
          );
        })}
      </div>
      <span className="font-pixel text-[18px] text-gold">
        {vt.done}/{vt.total} CARDS IN
      </span>
    </div>
  );
}

function Reveal({ v }: { v: PublicView }) {
  const r = v.reveal!;
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <span className="font-pixel text-[14px] text-gold">
          {up(v.roundName)} · MATCH {r.matchNum} OF {v.roundLen}
        </span>
        <span className="font-pixel text-[28px] leading-none">
          {up(r.a.short)} VS {up(r.b.short)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[r.a, r.b].map((b) => (
          <div key={b.num} className="flex flex-col gap-1.5">
            <div className="h-[120px] bg-black overflow-hidden border-[3px] border-arcade-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.photo} alt={b.label} className="w-full h-full object-cover block" />
            </div>
            <span className="font-pixel text-[17px] leading-[1.1]">{b.label}</span>
          </div>
        ))}
      </div>
      {r.level === 0 && <span className="font-pixel text-[22px] text-gold">DRUMROLL...</span>}
      {r.party && (
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between font-pixel text-[13px]">
            <span>
              PARTY {up(r.a.short)} {r.party[0]}
            </span>
            <span>
              {r.party[1]} {up(r.b.short)}
            </span>
          </div>
          <SplitBar a={r.party[0]} b={r.party[1]} />
          {r.split && <span className="font-pixel text-[18px] text-arcade-cream">SPLIT ROOM · EVERY VOTE SCORES</span>}
          {r.level === 1 && <span className="font-pixel text-[16px] text-ice">KATMAI COUNT NEXT...</span>}
          {r.katmai && r.winner && (
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between font-pixel text-[13px]">
                <span>
                  KATMAI {up(r.a.short)} {fmt(r.katmai[0])}
                </span>
                <span>
                  {fmt(r.katmai[1])} {up(r.b.short)}
                </span>
              </div>
              <SplitBar a={r.katmai[0]} b={r.katmai[1]} />
              {r.busted && (
                <div className="bg-arcade-red border-[3px] border-gold px-3 py-2 font-pixel text-[20px] text-gold text-center">
                  BRACKET BUSTED!
                </div>
              )}
              <span className="font-pixel text-[22px] text-gold">{up(r.winner.short)} ADVANCES</span>
            </div>
          )}
          {r.talk.map((t) => (
            <div key={t.playerId} className="border-l-4 border-arcade-red px-2.5 py-0.5 flex flex-col">
              <span className="text-[16px] leading-[1.35]">“{t.text}”</span>
              <span className="font-pixel text-[11px] text-ice">
                {up(t.who)}
                {t.bear ? ` · ${up(t.bear)}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WagerPanel({ v }: { v: PublicView }) {
  const w = v.wager!;
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <span className="font-pixel text-[14px] text-gold">BEFORE THE FINAL</span>
        <span className="font-pixel text-[34px] leading-none">FINAL WAGER</span>
        <span className="text-[17px] leading-[1.4] text-ice">
          Bet your points. Vote with the room to win your bet. Bets stay secret until the party vote.
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {w.rows.map((r) => (
          <div key={r.name} className="flex justify-between text-[16px] font-semibold">
            <span>{r.name}</span>
            <span className="font-pixel text-[13px]" style={{ color: r.locked ? "#F7C21B" : "#7FC4DA" }}>
              {r.locked ? "LOCKED" : "DECIDING..."}
            </span>
          </div>
        ))}
      </div>
      <span className="font-pixel text-[18px] text-gold">
        {w.locked}/{w.total} BETS LOCKED
      </span>
    </div>
  );
}

function TiebreakerPanel({ v }: { v: PublicView }) {
  const t = v.tb!;
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <span className="font-pixel text-[14px] text-gold">TIE FOR FIRST · {up(t.names.join(" vs "))}</span>
        <span className="font-pixel text-[34px] leading-none">TIEBREAKER</span>
        <span className="font-bold text-[20px] leading-[1.35]">{t.question}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {t.rows.map((r) => (
          <div
            key={r.name}
            className="flex justify-between text-[18px] font-semibold"
            style={{ color: r.top ? "#F7C21B" : "#F3E6C4" }}
          >
            <span>{r.name}</span>
            <span className="font-pixel text-[14px]">{r.status}</span>
          </div>
        ))}
      </div>
      {t.revealed && (
        <div className="flex flex-col gap-2.5">
          <span className="font-pixel text-[22px]">
            ANSWER: <span className="text-gold">{t.answer}</span>
          </span>
          <div className="bg-arcade-red border-[3px] border-gold px-3 py-2.5 flex flex-col gap-0.5">
            <span className="font-pixel text-[13px] text-white">PARTY CHAMPION</span>
            <span className="font-pixel text-[28px] text-gold">{up(t.champion ?? "")}</span>
          </div>
          {t.sameNote && (
            <span className="text-[15px] text-ice">Same distance, so the first guess locked in wins.</span>
          )}
        </div>
      )}
    </div>
  );
}

function Champion({ name }: { name: string }) {
  return (
    <div className="bg-arcade-red border-[3px] border-gold px-3 py-2.5 flex flex-col gap-0.5">
      <span className="font-pixel text-[13px] text-white">PARTY CHAMPION</span>
      <span className="font-pixel text-[28px] text-gold">{up(name)}</span>
    </div>
  );
}

export function TvScreen() {
  const { data: v, error } = usePoll<PublicView>("/api/bracket/state?view=tv", 700);
  const scale = useFitScale();
  const live = v && v.onAir && v.phase !== "lobby";
  const finalChampion = v && v.phase === "reveal" && v.round === 3 && v.reveal?.level === 2 && v.champion;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      <div
        className="relative flex flex-none bg-night text-arcade-cream font-game"
        style={{ width: W, height: H, transform: `scale(${scale})` }}
      >
        <div className="relative flex-none" style={{ width: 1166, height: H }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bracket/poster.jpg" alt="Fat Bear Week 2026 bracket" className="block w-full h-full" />
          {v?.slots.map((s, i) => <Medallion key={i} s={s} />)}
        </div>
        <div className="flex-1 min-w-0 px-[26px] py-7 flex flex-col gap-[18px] border-l-4 border-arcade-red overflow-hidden">
          {!v ? (
            <span className="font-pixel text-[18px] text-ice">{error ?? "LOADING..."}</span>
          ) : !live ? (
            <Lobby v={v} />
          ) : (
            <>
              {v.phase === "voting" && <Voting v={v} />}
              {v.phase === "reveal" && <Reveal v={v} />}
              {v.phase === "wager" && <WagerPanel v={v} />}
              {(v.phase === "tb" || v.phase === "tbDone") && <TiebreakerPanel v={v} />}
              {finalChampion && <Champion name={v.champion!} />}
            </>
          )}

          {v && live && (
            <div className="mt-auto flex flex-col gap-1.5 border-t-2 border-teal pt-3.5">
              <span className="font-pixel text-[13px] text-ice">READ THE ROOM · LEADERBOARD</span>
              {v.leaders.map((l) => (
                <div key={l.rank} className="flex justify-between gap-2.5 text-[17px] font-semibold">
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {l.rank}. {l.name}
                  </span>
                  <span className="flex gap-2.5 items-baseline flex-none">
                    {l.delta && (
                      <span className="font-pixel text-[12px]" style={{ color: l.deltaUp ? "#7FC4DA" : "#E3262E" }}>
                        {l.delta}
                      </span>
                    )}
                    <span className="font-pixel text-gold">{l.score}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {v?.mode === "rehearsal" && (
          <span className="absolute top-3 left-3 bg-arcade-red text-white font-pixel text-[13px] px-2 py-1 border-2 border-gold">
            REHEARSAL
          </span>
        )}
        {v && error && (
          <span className="absolute bottom-2 right-3 font-pixel text-[11px] text-ice opacity-70">{error}</span>
        )}
      </div>
    </div>
  );
}
