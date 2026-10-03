"use client";

import { useState } from "react";
import type { PlayerView } from "@/lib/bracket/view";
import { NAME_MAX } from "@/lib/bracket/constants";
import { playerPost, up } from "./api";

type Step = { k: "confirm" } | { k: "who" } | { k: "new" } | { k: "reclaim"; playerId: string; name: string };

const bigGold =
  "font-pixel text-[18px] min-h-[60px] border-[3px] border-gold bg-gold text-night cursor-pointer disabled:opacity-60";
const linkBtn = "font-game font-semibold text-[15px] min-h-11 border-none bg-transparent text-ice cursor-pointer";

export function lateNoteFor(v: PlayerView): string {
  if (v.phase === "lobby") return "Round 1 opens soon. Your card is waiting.";
  if (v.round === 0 && v.phase === "voting") return "Round 1 is open. Your card is waiting.";
  if (v.phase === "voting" || v.phase === "wager")
    return `${v.roundName} is open, so you’re starting here. Earlier rounds don’t count against you.`;
  const next = v.round < 3 ? ["Round 2", "Semifinal", "Final"][v.round] : "next time";
  return `${v.roundName} is mid-reveal. Watch the big screen; your first card is ${next}.`;
}

export function JoinFlow({
  v,
  onJoined,
}: {
  v: PlayerView;
  onJoined: (name: string, lateNote: string) => void;
}) {
  const signedIn = v.signedIn;
  const [step, setStep] = useState<Step>(() =>
    signedIn?.playerId
      ? { k: "reclaim", playerId: signedIn.playerId, name: signedIn.name }
      : signedIn
        ? { k: "confirm" }
        : { k: "who" },
  );
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const send = async (body: object) => {
    setBusy(true);
    setErr(null);
    const note = lateNoteFor(v);
    const res = await playerPost(null, body);
    setBusy(false);
    if (res.error) return setErr(res.error);
    onJoined(res.name ?? "", note);
  };

  const nn = newName.trim().replace(/\s+/g, " ");
  const isDupe = !!nn && v.roster.some((r) => r.name.toLowerCase() === nn.toLowerCase());

  const titles = { confirm: "READY TO PLAY?", who: "WHO ARE YOU?", new: "NEW PLAYER", reclaim: "BACK AGAIN?" };
  const roundState = v.phase === "lobby" ? "opening soon" : v.phase === "voting" ? "open" : "being revealed";
  const subs = {
    confirm: "You checked in on the invite. One tap and you’re in.",
    who: `${v.roundName} is ${roundState}. Pick your name to jump in.`,
    new: "Not on the roster? No problem. Type your name and you’re in.",
    reclaim: "New phone or closed the tab? Pick up where you left off.",
  };

  return (
    <div className="flex flex-col font-game text-arcade-cream">
      <div className="px-[18px] pt-[26px] pb-4 flex flex-col gap-2 bg-night border-b-[3px] border-arcade-red">
        <span className="font-pixel text-[12px] text-gold">● LIVE · BRACKET NIGHT</span>
        <span className="font-pixel text-[28px] leading-[1.05]">{titles[step.k]}</span>
        <span className="text-[14.5px] leading-[1.4] text-ice">{subs[step.k]}</span>
      </div>

      {step.k === "confirm" && signedIn && (
        <div className="px-[18px] py-[22px] flex flex-col gap-3.5">
          <button type="button" disabled={busy} className={bigGold} onClick={() => send({ op: "joinGuest", guestId: signedIn.guestId })}>
            JOIN AS {up(signedIn.name)}
          </button>
          <button type="button" className={`${linkBtn} underline`} onClick={() => setStep({ k: "who" })}>
            Not {signedIn.name}? Pick another name
          </button>
        </div>
      )}

      {step.k === "who" && (
        <div className="px-[18px] pt-4 pb-6 flex flex-col gap-2">
          <span className="font-pixel text-[11px] text-ice">ON THE ROSTER</span>
          {v.roster.map((r) =>
            r.playing ? (
              <button
                key={`p-${r.playerId}`}
                type="button"
                onClick={() => setStep({ k: "reclaim", playerId: r.playerId!, name: r.name })}
                className="flex items-center justify-between gap-2.5 min-h-[52px] px-3.5 border-2 border-line bg-transparent text-[#5E7A8C] font-game text-[16px] font-semibold cursor-pointer text-left"
              >
                <span>{r.name}</span>
                <span className="flex flex-col items-end gap-0.5">
                  <span className="font-pixel text-[11px]">PLAYING</span>
                  <span className="text-[12px] text-ice underline">That’s me</span>
                </span>
              </button>
            ) : (
              <button
                key={`g-${r.guestId}`}
                type="button"
                disabled={busy}
                onClick={() => send({ op: "joinGuest", guestId: r.guestId })}
                className="flex items-center justify-between gap-2.5 min-h-[52px] px-3.5 border-2 border-teal bg-night text-arcade-cream font-game text-[16px] font-semibold cursor-pointer text-left"
              >
                <span>{r.name}</span>
                <span className="text-[13px] font-medium text-ice">{r.sub}</span>
              </button>
            ),
          )}
          <div className="mt-3 border-t-2 border-dashed border-teal pt-4 flex flex-col gap-2">
            <span className="font-pixel text-[11px] text-ice">NOT ON THE LIST?</span>
            <button
              type="button"
              onClick={() => setStep({ k: "new" })}
              className="font-pixel text-[16px] min-h-14 border-[3px] border-gold bg-transparent text-gold cursor-pointer"
            >
              I&apos;M A +1 / NEW HERE ▶
            </button>
          </div>
        </div>
      )}

      {step.k === "reclaim" && (
        <div className="px-[18px] py-[22px] flex flex-col gap-3.5">
          <span className="text-[15px] leading-[1.5]">
            {up(step.name)} is already playing on another phone. If that’s you, your picks and points move to this phone.
            The host sees a note and can undo it if it wasn’t you.
          </span>
          <button type="button" disabled={busy} className={bigGold} onClick={() => send({ op: "reclaim", playerId: step.playerId })}>
            YES, I’M {up(step.name)}
          </button>
          <button type="button" className={linkBtn} onClick={() => setStep({ k: "who" })}>
            ◀ Back to the roster
          </button>
        </div>
      )}

      {step.k === "new" && (
        <form
          className="px-[18px] pt-5 pb-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (nn) send({ op: "joinNew", name: nn });
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="font-pixel text-[11px] text-ice">YOUR NAME</span>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="First name"
              maxLength={NAME_MAX}
              autoComplete="given-name"
              className="font-game text-[18px] font-semibold px-3.5 min-h-[54px] border-[3px] border-gold bg-night text-arcade-cream rounded-none"
            />
            {isDupe && (
              <span className="text-[13.5px] leading-[1.4] text-gold">
                There’s already a {nn} here. You’ll show up as “{nn} 2”.
              </span>
            )}
          </label>
          <button
            type="submit"
            disabled={busy || !nn}
            className="font-pixel text-[18px] min-h-[60px] border-[3px] border-gold text-night cursor-pointer"
            style={{ background: nn ? "#F7C21B" : "#5E6B52" }}
          >
            JOIN THE BRACKET
          </button>
          <button type="button" className={linkBtn} onClick={() => setStep({ k: "who" })}>
            ◀ Back to the roster
          </button>
        </form>
      )}

      {err && <div className="px-[18px] pb-6 text-[15px] text-gold">{err}</div>}
    </div>
  );
}

export function JoinDone({ name, lateNote, onGo }: { name: string; lateNote: string; onGo: () => void }) {
  return (
    <div className="px-[18px] py-6 flex flex-col gap-4 font-game text-arcade-cream">
      <div className="bg-gold text-night p-4 flex flex-col gap-1.5">
        <span className="font-pixel text-[24px] leading-[1.05]">YOU&apos;RE IN, {up(name)}</span>
        <span className="text-[15px] leading-[1.45] font-semibold">{lateNote}</span>
      </div>
      <div className="border-2 border-teal px-3.5 py-3 flex flex-col gap-1.5">
        <span className="font-pixel text-[11px] text-ice">HOW SCORING WORKS</span>
        <span className="text-[15px] leading-[1.5]">
          Pick the fatter bear. Score by agreeing with the room: one point each time your pick matches the party majority,
          and everyone scores on a tie. Katmai’s official count decides who moves on.
        </span>
      </div>
      <button
        type="button"
        onClick={onGo}
        className="font-pixel text-[18px] min-h-[60px] border-[3px] border-gold bg-arcade-red text-gold cursor-pointer"
      >
        LET&apos;S GO ▶
      </button>
    </div>
  );
}
