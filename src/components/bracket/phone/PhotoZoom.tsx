"use client";

import { useEffect, useRef, useState } from "react";
import type { BracketBear } from "@/lib/bracket/engine";

type OrientationWithLock = ScreenOrientation & { lock?: (o: string) => Promise<void> };

/**
 * Fullscreen before/after photo. Where the browser allows it (mostly Android), goes fullscreen
 * and locks landscape. Otherwise (iPhone) it shows the prototype's sideways layout so turning
 * the phone fills the screen, with an UPRIGHT toggle.
 */
export function PhotoZoom({ bear, onClose }: { bear: BracketBear; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [locked, setLocked] = useState(false);
  const [sideways, setSideways] = useState(true);
  const [landscape, setLandscape] = useState(false);

  // If the phone is already turned (or it's a wide screen), show the photo upright.
  useEffect(() => {
    const check = () => setLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ref.current?.requestFullscreen?.();
        await (screen.orientation as OrientationWithLock).lock?.("landscape");
        if (!cancelled) setLocked(true);
      } catch {
        // Not supported: fall back to the CSS-rotated view.
      }
    })();
    return () => {
      cancelled = true;
      try {
        screen.orientation?.unlock?.();
      } catch {}
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const labels = (
    <div className="grid grid-cols-2 bg-night font-pixel text-[13px] text-center">
      <span className="p-2 text-ice">← EARLY SUMMER</span>
      <span className="p-2 text-gold">LATE SUMMER →</span>
    </div>
  );
  const btn = "font-pixel text-[12px] min-h-11 px-3 border-2 cursor-pointer";

  // Device is already landscape (locked), or the guest asked for upright.
  const upright = locked || landscape || !sideways;

  return (
    <div ref={ref} className="fixed inset-0 z-50 bg-black overflow-hidden font-game text-arcade-cream">
      {upright ? (
        <div className="absolute inset-0 flex flex-col">
          <div className="flex items-center gap-2 px-3.5 pt-[max(12px,env(safe-area-inset-top))] pb-3 bg-night border-b-[3px] border-arcade-red">
            <span className="font-pixel text-[18px] flex-1 min-w-0">{bear.label}</span>
            {!locked && !landscape && (
              <button type="button" onClick={() => setSideways(true)} className={`${btn} border-teal bg-transparent text-arcade-cream`}>
                SIDEWAYS
              </button>
            )}
            <button type="button" onClick={onClose} className={`${btn} border-gold bg-gold text-night`}>
              ✕
            </button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bear.photo} alt={`${bear.label} before and after, enlarged`} className="max-w-full max-h-full object-contain block" />
          </div>
          <div className="pb-[env(safe-area-inset-bottom)] bg-night">{labels}</div>
        </div>
      ) : (
        <div
          className="absolute left-1/2 top-1/2 flex flex-col"
          style={{ width: "100dvh", height: "100vw", transform: "translate(-50%,-50%) rotate(90deg)" }}
        >
          <div className="flex items-center gap-3 px-4 py-2.5 bg-night border-b-[3px] border-arcade-red">
            <span className="font-pixel text-[20px]">{bear.label}</span>
            <span className="text-[13px] text-ice">{bear.cls}</span>
            <span className="flex-1" />
            <button type="button" onClick={() => setSideways(false)} className={`${btn} border-teal bg-transparent text-arcade-cream`}>
              UPRIGHT
            </button>
            <button type="button" onClick={onClose} className={`${btn} border-gold bg-gold text-night`}>
              ✕ CLOSE
            </button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bear.photo} alt={`${bear.label} before and after, enlarged`} className="max-w-full max-h-full object-contain block" />
          </div>
          {labels}
        </div>
      )}
    </div>
  );
}
