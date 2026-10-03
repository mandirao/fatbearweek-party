"use client";

import { useState } from "react";
import type { PlayerView } from "@/lib/bracket/view";
import { playerPost, up } from "./api";

const outline = "font-pixel border-[3px] border-teal bg-transparent text-arcade-cream cursor-pointer";

export function WagerScreen({ v, asId, refresh }: { v: PlayerView; asId: string | null; refresh: () => Promise<void> }) {
  const me = v.me!;
  const max = me.base;
  const saved = me.bet;
  // Local amount while choosing; starts from whatever is saved.
  const [amount, setAmount] = useState(Math.min(saved?.amount ?? 0, max));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const locked = !!saved?.locked && saved.amount === amount;

  const save = async (amt: number, lock: boolean) => {
    setBusy(true);
    setErr(null);
    const res = await playerPost(asId, { op: "wager", amount: amt, locked: lock });
    if (res.error) setErr(res.error);
    await refresh();
    setBusy(false);
  };

  const set = (n: number) => {
    const next = Math.max(0, Math.min(max, n));
    setAmount(next);
    // Changing a locked bet unlocks it on the server too, so the old amount can't count.
    if (saved?.locked && next !== saved.amount) save(next, false);
  };

  return (
    <div className="px-4 pt-[18px] pb-6 flex flex-col gap-4">
      <div className="border-2 border-teal px-3.5 py-3 flex flex-col gap-1.5">
        <span className="font-pixel text-[11px] text-ice">HOW THE WAGER WORKS</span>
        <span className="text-[15px] leading-[1.5]">
          Bet any of your points on the Final. Vote with the room and you win your bet. Vote against it and you lose it.
          If the room splits, you keep it.
        </span>
      </div>

      {max === 0 ? (
        <span className="text-[15px] leading-[1.5] text-ice text-center">No points to bet yet. You can still vote in the Final.</span>
      ) : (
        <>
          <div className="flex flex-col items-center gap-1.5">
            <span className="font-pixel text-[12px] text-ice">YOUR BET</span>
            <div className="grid gap-2.5 items-center w-full" style={{ gridTemplateColumns: "60px minmax(0,1fr) 60px" }}>
              <button type="button" aria-label="Bet one less" onClick={() => set(amount - 1)} className={`${outline} min-h-[60px] text-[26px]`}>
                −
              </button>
              <span className="font-pixel text-[60px] leading-none text-gold text-center">{amount}</span>
              <button type="button" aria-label="Bet one more" onClick={() => set(amount + 1)} className={`${outline} min-h-[60px] text-[26px]`}>
                +
              </button>
            </div>
            <span className="text-[14px]">of your {max} points</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => set(0)} className={`${outline} min-h-12 text-[14px]`}>
              NONE
            </button>
            <button type="button" onClick={() => set(Math.floor(max / 2))} className={`${outline} min-h-12 text-[14px]`}>
              HALF
            </button>
            <button type="button" onClick={() => set(max)} className={`${outline} min-h-12 text-[14px]`}>
              ALL IN
            </button>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => !locked && save(amount, true)}
            className="font-pixel text-[18px] min-h-[60px] border-[3px] border-gold cursor-pointer"
            style={{ background: locked ? "transparent" : "#F7C21B", color: locked ? "#F7C21B" : "#081627" }}
          >
            {locked ? `✓ BET LOCKED · ${amount} PTS` : `LOCK IN ${amount} PTS`}
          </button>
          <span className="text-[13.5px] leading-[1.4] text-ice text-center">
            You can change your bet until the host opens the Final.
          </span>
        </>
      )}
      {err && <span className="text-[14px] text-gold text-center">{err}</span>}
    </div>
  );
}

export function TiebreakerScreen({ v, asId, refresh }: { v: PlayerView; asId: string | null; refresh: () => Promise<void> }) {
  const me = v.me!;
  const tb = v.tb!;
  const mine = me.tb;
  const tied = !!mine?.tied;
  const [guess, setGuess] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const n = parseInt(guess, 10);
  const valid = !Number.isNaN(n);

  const lock = async () => {
    if (!valid) return;
    setBusy(true);
    setErr(null);
    const res = await playerPost(asId, { op: "tbGuess", value: n });
    if (res.error) setErr(res.error);
    await refresh();
    setBusy(false);
  };

  return (
    <div className="px-4 pt-[18px] pb-6 flex flex-col gap-4">
      <div className="bg-gold text-night p-3 flex flex-col gap-1">
        <span className="font-pixel text-[18px]">{up(tb.names.join(" vs "))}</span>
        <span className="text-[14.5px] leading-[1.4] font-semibold">
          {tied ? "You’re tied for first. One question settles it." : "Tied for first. Watch the big screen."}
        </span>
      </div>
      <span className="font-bold text-[19px] leading-[1.35] text-white">{tb.question}</span>

      {!tb.revealed && tied && mine?.guess == null && (
        <form
          className="flex flex-col gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            lock();
          }}
        >
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Your guess"
            aria-label="Your guess"
            className="font-pixel text-[28px] text-center px-3.5 min-h-16 border-[3px] border-gold bg-night text-arcade-cream rounded-none"
          />
          <button
            type="submit"
            disabled={busy || !valid}
            className="font-pixel text-[18px] min-h-[60px] border-[3px] border-gold text-night cursor-pointer"
            style={{ background: valid ? "#F7C21B" : "#5E6B52" }}
          >
            LOCK GUESS
          </button>
          <span className="text-[13.5px] leading-[1.4] text-ice text-center">Closest wins. Same distance? First to lock in wins.</span>
        </form>
      )}

      {!tb.revealed && tied && mine?.guess != null && (
        <div className="border-2 border-gold p-3.5 flex flex-col gap-1 items-center text-center">
          <span className="font-pixel text-[20px] text-gold">GUESS LOCKED: {mine.guess}</span>
          <span className="text-[14.5px]">The answer comes up on the big screen.</span>
        </div>
      )}

      {tb.revealed && (
        <div className="flex flex-col gap-2.5 items-center text-center">
          <span className="font-pixel text-[13px] text-ice">THE ANSWER</span>
          <span className="font-pixel text-[56px] leading-none text-gold">{tb.answer}</span>
          {tied && (
            <span className="text-[15px]">
              {mine?.guess != null ? `You guessed ${mine.guess}, off by ${mine.off}.` : "You didn’t lock in a guess."}
            </span>
          )}
          <div className="bg-arcade-red border-[3px] border-gold p-3 w-full flex flex-col gap-1">
            <span className="font-pixel text-[13px] text-white">PARTY CHAMPION</span>
            <span className="font-pixel text-[24px] text-gold">{up(tb.champion ?? "")}</span>
          </div>
        </div>
      )}
      {err && <span className="text-[14px] text-gold text-center">{err}</span>}
    </div>
  );
}
