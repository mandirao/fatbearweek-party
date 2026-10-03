"use client";

import { createContext, useContext } from "react";
import { usePoll } from "./usePoll";
import type { BracketStatus } from "@/lib/bracket/view";

const Ctx = createContext<BracketStatus | null>(null);

/** Shares the Bracket Night status (tab lock, banner) across the app; refreshes every few seconds. */
export function BracketStatusProvider({ initial, children }: { initial: BracketStatus; children: React.ReactNode }) {
  const { data } = usePoll<BracketStatus>("/api/bracket/status", 3000);
  return <Ctx.Provider value={data ?? initial}>{children}</Ctx.Provider>;
}

export function useBracketStatus(): BracketStatus | null {
  return useContext(Ctx);
}
