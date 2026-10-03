"use client";

import Link from "next/link";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function LockedInfo({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <span className="font-pixel text-[12px] text-gold">LOCKED UNTIL PARTY NIGHT</span>
      <span className="font-pixel text-[26px] leading-[1.05]">BRACKET NIGHT</span>
      <span className="text-[16px] leading-[1.5]">
        Opens Friday, Oct 2 at the party, when Mandi goes live. Everyone plays the same 15 matchups together, one round
        at a time, on their own phone.
      </span>
      <div
        className="grid gap-x-3 gap-y-1.5 text-[14.5px] border-2 border-teal p-3"
        style={{ gridTemplateColumns: "auto minmax(0,1fr)" }}
      >
        <span className="font-pixel text-[11px] text-ice pt-[3px]">ROUNDS</span>
        <span>Round 1 · Round 2 · Semifinal · Final</span>
        <span className="font-pixel text-[11px] text-ice pt-[3px]">POINTS</span>
        <span>Pick the fatter bear. Score by agreeing with the room.</span>
      </div>
      <Link
        href="/bears"
        onClick={onNavigate}
        className="flex items-center justify-center min-h-[54px] border-[3px] border-gold bg-gold text-night no-underline font-pixel text-[15px] hover:text-night"
      >
        SCOUT THE 16 BEARS ▶
      </Link>
    </>
  );
}

export function LockedSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Portal to <body> so the sheet sits above the nav's and pages' sticky bars.
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-center" role="dialog" aria-modal="true" aria-label="Bracket Night">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(10,18,14,0.55)] border-none cursor-pointer"
      />
      <div className="absolute bottom-0 w-full max-w-[440px] bg-deep border-t-4 border-arcade-red px-5 pt-[22px] pb-[34px] flex flex-col gap-3.5 font-game text-arcade-cream">
        <span className="self-center w-10 h-1 rounded-sm bg-teal" />
        <LockedInfo onNavigate={onClose} />
      </div>
    </div>,
    document.body,
  );
}
