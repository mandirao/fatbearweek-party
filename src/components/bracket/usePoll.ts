"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Polls a JSON endpoint about once a second. `refresh()` fetches right away (after a host tap). */
export function usePoll<T>(url: string, intervalMs = 800) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const seq = useRef(0);

  const refresh = useCallback(async (force = false) => {
    if (inFlight.current && !force) return;
    inFlight.current = true;
    const mine = ++seq.current;
    try {
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (mine !== seq.current) return;
      if (!res.ok) setError(json.error ?? `Error ${res.status}`);
      else {
        setData(json as T);
        setError(null);
      }
    } catch {
      setError("Reconnecting…");
    } finally {
      inFlight.current = false;
    }
  }, [url]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first fetch on mount
    refresh();
    const id = setInterval(() => refresh(), intervalMs);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh, intervalMs]);

  return { data, error, refresh: () => refresh(true) };
}
