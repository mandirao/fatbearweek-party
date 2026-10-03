"use client";

import { useRef, useState } from "react";
import { usePoll } from "./usePoll";
import type { HostView } from "@/lib/bracket/view";

async function post(body: object): Promise<string | null> {
  try {
    const res = await fetch("/api/bracket/host", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return null;
    const json = await res.json().catch(() => ({}));
    return json.error ?? `Error ${res.status}`;
  } catch {
    return "Couldn't reach the server. Try again.";
  }
}

function HoldButton({ onConfirm, children }: { onConfirm: () => void; children: React.ReactNode }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = () => {
    setHolding(true);
    timer.current = setTimeout(() => {
      setHolding(false);
      onConfirm();
    }, 2000);
  };
  const cancel = () => {
    setHolding(false);
    if (timer.current) clearTimeout(timer.current);
  };
  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      className="relative overflow-hidden min-h-[52px] rounded-md border-2 border-salmon bg-transparent text-salmon font-bold text-sm tracking-[0.08em] cursor-pointer select-none touch-none"
    >
      <span
        className="absolute inset-y-0 left-0 bg-salmon/25"
        style={{ width: holding ? "100%" : "0%", transition: holding ? "width 2s linear" : "none" }}
      />
      <span className="relative">{holding ? "KEEP HOLDING…" : children}</span>
    </button>
  );
}

const card = "flex flex-col gap-3 border border-border-tan rounded-md p-4 bg-warm-white";
const eyebrow = "font-semibold text-[11px] tracking-[0.18em] text-ink-faint";

export function PressBox({ rsvpYes }: { rsvpYes: number }) {
  const { data: v, error: pollError, refresh } = usePoll<HostView>("/api/bracket/state?view=host", 800);
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [botN, setBotN] = useState(8);
  const [confirmAir, setConfirmAir] = useState(false);
  const lastTap = useRef(0);

  const run = async (body: object) => {
    setBusy(true);
    setMsg(null);
    const err = await post(body);
    if (err) setMsg(err);
    await refresh();
    setBusy(false);
  };

  if (!v) return <div className="px-5 py-8 text-ink-muted">{pollError ?? "Loading the Press Box…"}</div>;

  const needsArm = v.primary.action === "lockRound" && v.missing > 0;
  const primaryLabel = armed && needsArm ? `Tap again: lock with ${v.missing} missing` : v.primary.label;

  const onPrimary = () => {
    const now = Date.now();
    if (now - lastTap.current < 600) return; // double-tap guard
    lastTap.current = now;
    if (!v.primary.action || busy) return;
    if (needsArm && !armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    run({ op: "action", action: v.primary.action, expectedVersion: v.version });
  };

  const onBack = () => {
    if (armed) return setArmed(false);
    if (!v.canUndo || busy) return;
    run({ op: "action", action: "undo", expectedVersion: v.version });
  };

  const rehearsal = v.mode === "rehearsal";

  return (
    <div className="px-5 pt-6 pb-[30px] flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className={eyebrow}>HOST REMOTE</span>
          {rehearsal && (
            <span className="bg-arcade-red text-white font-pixel text-[11px] px-1.5 py-0.5">REHEARSAL</span>
          )}
        </div>
        <h2 className="m-0 font-display text-[30px] leading-none text-forest uppercase">Bracket Night</h2>
      </div>

      <div className="border-2 border-forest rounded overflow-hidden">
        <div className="bg-forest text-cream px-3 py-2.5 font-bold text-xs tracking-[0.16em] flex justify-between">
          <span>STATUS</span>
          <span className={v.onAir ? "text-apricot" : "text-green-muted"}>{v.onAir ? "● LIVE" : "OFF AIR"}</span>
        </div>
        <div className="bg-warm-white px-3 py-3.5 flex flex-col gap-3">
          <span className="text-[15px] leading-[1.5] text-ink">
            {v.onAir
              ? "Every guest’s Bracket tab is unlocked and the banner is up. Going off air pauses the game; nothing is lost."
              : v.phase === "lobby"
                ? "Going live unlocks the Bracket tab for every guest, shows the live banner, and puts the TV screen in its lobby. Round 1 opens when you tap Open Round 1 on the remote."
                : "Paused. Phones show “Paused by the host” and the TV shows the lobby. Going live again picks up right where you left off."}
          </span>
          <span className="text-sm text-ink-muted">
            <strong className="text-forest">{rsvpYes}</strong> RSVP’d yes ·{" "}
            <strong className="text-forest">{v.playerCount}</strong> playing ·{" "}
            <strong className="text-forest">15</strong> official results loaded
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmAir(true)}
            className={`min-h-[54px] rounded-md font-bold text-base tracking-[0.08em] cursor-pointer ${
              v.onAir ? "bg-transparent border border-forest text-forest" : "bg-salmon text-salmon-tint border-none"
            }`}
          >
            {v.onAir ? "GO OFF AIR" : v.phase === "lobby" ? "GO LIVE" : "GO LIVE AGAIN"}
          </button>
        </div>
      </div>

      <div className="flex flex-col border-t border-border-tan">
        <div className="flex justify-between items-center min-h-[52px] border-b border-border-tan text-[15px] text-ink">
          <span>TV screen link</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(`${location.origin}/bracket/tv`).catch(() => {});
              setMsg("TV link copied.");
            }}
            className="min-h-11 bg-transparent border-none font-semibold text-river cursor-pointer text-[15px] p-0"
          >
            Copy
          </button>
        </div>
        <div className="flex justify-between items-center min-h-[52px] border-b border-border-tan text-[15px] text-ink">
          <span>TV screen</span>
          <a href="/bracket/tv" target="_blank" rel="noreferrer" className="font-semibold">
            Open ↗
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-[15px] text-ink">
          <strong className="text-forest">{v.roundName}</strong> · {v.status}
        </div>
        <button
          type="button"
          onClick={onPrimary}
          disabled={!v.primary.action}
          className="min-h-[60px] rounded-md border-none bg-salmon text-salmon-tint font-bold text-[17px] px-4 cursor-pointer disabled:cursor-default disabled:bg-forest"
          style={{ opacity: busy ? 0.6 : 1 }}
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 rounded-md border border-salmon bg-transparent text-ink font-semibold text-[15px] cursor-pointer"
          style={{ opacity: v.canUndo || armed ? 1 : 0.4 }}
        >
          ◀ Back a step
        </button>
        {(msg || pollError) && <div className="text-[15px] text-salmon">{msg ?? pollError}</div>}
      </div>

      {v.rejoins.map((r) => (
        <div key={r.playerId} className="flex flex-col gap-2 border-2 border-salmon rounded-md p-3 bg-rust-tint">
          <span className="text-[15px] leading-[1.45] text-ink">
            <strong className="text-forest">{r.name}</strong> said “That’s me” and moved to a new phone.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => run({ op: "undoRejoin", playerId: r.playerId })}
              className="flex-1 min-h-11 rounded-md bg-salmon text-salmon-tint border-none font-bold text-sm cursor-pointer"
            >
              Undo rejoin
            </button>
            <button
              type="button"
              onClick={() => run({ op: "dismissRejoin", playerId: r.playerId })}
              className="flex-1 min-h-11 rounded-md bg-transparent border border-border-tan text-ink-muted font-semibold text-sm cursor-pointer"
            >
              It was them
            </button>
          </div>
        </div>
      ))}

      <div className={card}>
        <span className={eyebrow}>TRASH TALK · {v.phase === "voting" ? "THIS ROUND" : "THIS MATCH"}</span>
        {v.talkAll.length === 0 && <span className="text-[15px] text-ink-faint">Nothing yet.</span>}
        {v.talkAll.map((t) => (
          <div key={`${t.playerId}:${t.matchId}`} className="flex items-start gap-3 border-t border-tan pt-2.5">
            <div className={`flex-1 min-w-0 flex flex-col ${t.hidden ? "opacity-45 line-through" : ""}`}>
              <span className="text-[15px] leading-[1.4] text-ink">“{t.text}”</span>
              <span className="text-xs text-ink-faint">
                {t.who}
                {t.bear ? ` · ${t.bear}` : ""}
              </span>
            </div>
            <button
              type="button"
              onClick={() => run({ op: "hideTalk", playerId: t.playerId, matchId: t.matchId, hidden: !t.hidden })}
              className="min-h-11 px-3 rounded-md border border-border-tan bg-transparent text-sm font-semibold text-forest cursor-pointer"
            >
              {t.hidden ? "Show" : "Hide"}
            </button>
          </div>
        ))}
      </div>

      <div className={card}>
        <span className={eyebrow}>PLAYERS · {v.playerCount}</span>
        {v.players.length === 0 && <span className="text-[15px] text-ink-faint">No one has joined yet.</span>}
        <div className="flex flex-col">
          {v.players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 min-h-11 border-t border-tan text-[15px]">
              <span className={`flex-1 min-w-0 ${p.isBot ? "text-ink-faint" : "text-forest"}`}>{p.name}</span>
              {p.isBot && rehearsal && (
                <a
                  href={`/bracket?as=${encodeURIComponent(p.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm"
                >
                  View as ↗
                </a>
              )}
              <span className="font-semibold text-ink w-8 text-right">{p.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-2 border-dashed border-salmon rounded-md p-4">
        <span className={eyebrow}>REHEARSAL PANEL</span>
        <div className="flex gap-2">
          {(["rehearsal", "live"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => v.mode !== m && run({ op: "settings", mode: m })}
              className={`flex-1 min-h-11 rounded-md font-bold text-sm tracking-[0.06em] cursor-pointer ${
                v.mode === m
                  ? "bg-forest text-cream border-none"
                  : "bg-transparent border border-border-tan text-ink-muted"
              }`}
            >
              {m === "rehearsal" ? "Rehearsal" : "Live"}
            </button>
          ))}
        </div>

        {rehearsal ? (
          <>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                value={botN}
                onChange={(e) => setBotN(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                className="w-20 bg-warm-white border border-border-tan rounded-[3px] p-3 text-base text-forest"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => run({ op: "addBots", n: botN })}
                className="flex-1 min-h-11 rounded-md bg-forest text-cream border-none font-bold text-sm cursor-pointer"
              >
                Add {botN} {botN === 1 ? "bot" : "bots"} ({v.bots} now)
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-ink-faint">
                Jump to (fills earlier rounds with bot votes, all revealed)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["round2", "Round 2"],
                    ["semis", "Semifinal"],
                    ["wager", "Final Wager"],
                    ["final", "Final"],
                  ] as const
                ).map(([target, label]) => (
                  <button
                    key={target}
                    type="button"
                    disabled={busy}
                    onClick={() => run({ op: "jumpTo", target })}
                    className="min-h-11 rounded-md border border-border-tan bg-transparent text-forest font-semibold text-sm cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => run({ op: "forceTie" })}
              className="min-h-11 rounded-md border border-forest bg-transparent text-forest font-bold text-sm cursor-pointer"
            >
              Force a tie for first
            </button>
          </>
        ) : (
          <span className="text-[14px] text-ink-faint">Switch to Rehearsal to add bots or force a tie.</span>
        )}

        <HoldButton onConfirm={() => run({ op: "reset" })}>HOLD 2s · RESET BRACKET NIGHT</HoldButton>
        <span className="text-[13px] leading-[1.45] text-ink-faint">
          Deletes every bracket player, vote, trash-talk line, bet and guess. Goes off air in Live mode. RSVPs, potluck
          claims and backed bears are never touched.
        </span>
      </div>

      {confirmAir && (
        <div className="fixed inset-0 z-40 flex justify-center" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => setConfirmAir(false)}
            className="absolute inset-0 bg-[rgba(10,18,14,0.45)] border-none cursor-pointer"
          />
          <div className="absolute bottom-6 w-[calc(100%-32px)] max-w-[408px] bg-forest rounded-lg p-4 flex flex-col gap-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
            <span className="font-bold text-[15px] text-cream">
              {v.onAir ? "Go off air?" : "Go live for everyone?"}
            </span>
            <span className="text-sm leading-[1.45] text-green-muted-3">
              {v.onAir
                ? "Phones show “Paused by the host” and the TV goes to its lobby. Nothing is lost; go live again to resume."
                : "Every guest’s Bracket tab unlocks now. You can go off air again later."}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmAir(false)}
                className="min-h-[46px] rounded-md border border-[#4E7560] bg-transparent text-cream font-semibold text-[15px] cursor-pointer"
              >
                Not yet
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setConfirmAir(false);
                  await run({ op: "settings", onAir: !v.onAir });
                }}
                className="min-h-[46px] rounded-md border-none bg-salmon text-salmon-tint font-bold text-[15px] cursor-pointer"
              >
                {v.onAir ? "Go off air" : "Go live"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
