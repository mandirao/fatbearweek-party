import { cookies } from "next/headers";
import type { Snapshot } from "./engine";

export const PLAYER_COOKIE = "fbw_player";

/** The player on this device, if any. Device tokens never leave the server. */
export async function playerIdFromCookie(snap: Snapshot, tokenToId: (token: string) => Promise<string | null>) {
  const token = (await cookies()).get(PLAYER_COOKIE)?.value;
  if (!token) return null;
  const id = await tokenToId(token);
  return id && snap.players.some((p) => p.id === id) ? id : null;
}
