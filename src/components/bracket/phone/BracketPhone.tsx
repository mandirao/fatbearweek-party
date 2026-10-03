"use client";

import { useState } from "react";
import { usePoll } from "../usePoll";
import type { PlayerView } from "@/lib/bracket/view";
import { playerUrl } from "./api";
import { JoinDone, JoinFlow } from "./JoinFlow";
import { GameScreen } from "./GameScreen";
import { FinishedBoard } from "./FinishedBoard";
import { LockedInfo } from "../LockedSheet";

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-[18px] py-8 flex flex-col gap-3 font-game text-arcade-cream">
      <span className="font-pixel text-[12px] text-gold">BRACKET NIGHT</span>
      <span className="font-pixel text-[26px] leading-[1.05]">{title}</span>
      <span className="text-[15px] leading-[1.5] text-ice">{children}</span>
    </div>
  );
}

export function BracketPhone({ asId }: { asId: string | null }) {
  const { data: v, error, refresh } = usePoll<PlayerView>(playerUrl(asId), 1000);
  const [welcome, setWelcome] = useState<{ name: string; lateNote: string } | null>(null);

  let body: React.ReactNode;
  if (!v) body = <Notice title={error ? "HOLD ON" : "LOADING..."}>{error ?? "Finding the game."}</Notice>;
  else if (v.final && (!v.me || !v.onAir))
    body = <FinishedBoard final={v.final} meId={v.me?.id ?? null} champion={v.champion} />;
  else if (!v.onAir)
    body =
      v.phase === "lobby" && !v.me ? (
        <div className="px-5 pt-[22px] pb-[34px] flex flex-col gap-3.5 font-game text-arcade-cream">
          <LockedInfo />
        </div>
      ) : (
        <Notice title="PAUSED BY THE HOST">Nothing is lost. Your picks and points are safe. Back in a moment.</Notice>
      );
  else if (welcome)
    body = <JoinDone name={welcome.name} lateNote={welcome.lateNote} onGo={() => setWelcome(null)} />;
  else if (!v.me)
    body = (
      <JoinFlow
        v={v}
        onJoined={async (name, lateNote) => {
          setWelcome({ name, lateNote });
          await refresh();
        }}
      />
    );
  else body = <GameScreen v={v} asId={asId} refresh={refresh} />;

  return (
    <div className="flex-1 flex flex-col bg-deep">
      {v && (v.mode === "rehearsal" || v.viewingAs) && (
        <div className="bg-arcade-red text-white font-pixel text-[11px] px-4 py-1.5 flex justify-between gap-2">
          <span>REHEARSAL</span>
          {v.viewingAs && v.me && <span>VIEWING AS {v.me.name.toUpperCase()}</span>}
        </div>
      )}
      {body}
      {v && error && <div className="px-4 py-2 font-pixel text-[11px] text-ice">{error}</div>}
    </div>
  );
}
