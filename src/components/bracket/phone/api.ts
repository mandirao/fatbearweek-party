"use client";

export const playerUrl = (asId: string | null) => `/api/bracket/player${asId ? `?as=${encodeURIComponent(asId)}` : ""}`;

export async function playerPost(asId: string | null, body: object): Promise<{ ok?: boolean; name?: string; error?: string }> {
  try {
    const res = await fetch(playerUrl(asId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.error ?? `Error ${res.status}` };
    return json;
  } catch {
    return { error: "No connection. Try again." };
  }
}

export const up = (s: string) => s.toUpperCase();
