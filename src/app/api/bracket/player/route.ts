import { cookies } from "next/headers";
import { getMeId, isHost } from "@/lib/identity";
import { ArchivedError, isArchived } from "@/lib/archive";
import { getAllGuests, getGuest } from "@/lib/guests";
import { bracketDb, getLoaded, invalidateBracketCache } from "@/lib/bracket/server";
import { buildPlayerView } from "@/lib/bracket/view";
import {
  BracketError,
  castVote,
  findPlayerByToken,
  getPlayer,
  joinPlayer,
  lockTbGuess,
  postTalk,
  reclaimPlayer,
  setWager,
  type Db,
} from "@/lib/bracket/store";

import { PLAYER_COOKIE } from "@/lib/bracket/identity";
const noStore = { "Cache-Control": "no-store" };

/**
 * Who this request plays as. Normally the device cookie. In rehearsal, the host can
 * open `/bracket?as=<botId>` to drive a bot from one tab without touching their own cookie.
 */
async function resolvePlayer(db: Db, asId: string | null) {
  if (asId) {
    const { snap } = await getLoaded();
    const bot = snap.players.find((p) => p.id === asId && p.isBot);
    if (!bot || snap.game.mode !== "rehearsal" || !(await isHost())) throw new BracketError("View-as is for rehearsal bots only.");
    return { playerId: bot.id, viewingAs: true };
  }
  const token = (await cookies()).get(PLAYER_COOKIE)?.value;
  const row = await findPlayerByToken(db, token);
  return { playerId: row?.id ?? null, viewingAs: false };
}

async function signedInGuest() {
  const id = await getMeId();
  const g = id ? await getGuest(id) : null;
  return g ? { id: g.id, name: g.name } : null;
}

export async function GET(request: Request) {
  const asId = new URL(request.url).searchParams.get("as");
  const db = bracketDb();
  try {
    const who = await resolvePlayer(db, asId);
    const { snap, version } = await getLoaded();
    const joined = who.playerId && snap.players.some((p) => p.id === who.playerId);
    const [guests, signedIn] = joined ? [[], null] : await Promise.all([getAllGuests(), signedInGuest()]);
    const view = buildPlayerView(snap, version, Date.now(), {
      playerId: joined ? who.playerId : null,
      guests: guests.map((g) => ({ id: g.id, name: g.name, status: g.status })),
      signedIn,
      viewingAs: who.viewingAs,
    });
    return Response.json(view, { headers: noStore });
  } catch (err) {
    if (err instanceof BracketError) return Response.json({ error: err.message }, { status: 403, headers: noStore });
    throw err;
  }
}

type Body =
  | { op: "joinGuest"; guestId: string }
  | { op: "joinNew"; name: string }
  | { op: "reclaim"; playerId: string }
  | { op: "vote"; matchId: number; bearNum: number }
  | { op: "talk"; matchId: number; text: string }
  | { op: "wager"; amount: number; locked: boolean }
  | { op: "tbGuess"; value: number };

export async function POST(request: Request) {
  if (isArchived()) return Response.json({ error: new ArchivedError().message }, { status: 403, headers: noStore });
  const asId = new URL(request.url).searchParams.get("as");
  const body = (await request.json().catch(() => ({}))) as Body;
  const db = bracketDb();
  const now = Date.now();
  const store = await cookies();

  try {
    const { snap } = await getLoaded();
    if (!snap.game.onAir) throw new BracketError("Paused by the host. Hang tight.");

    if (body.op === "joinGuest" || body.op === "joinNew" || body.op === "reclaim") {
      if (asId) throw new BracketError("Bots are already in the game.");
      const deviceToken = store.get(PLAYER_COOKIE)?.value ?? crypto.randomUUID();
      let row;
      if (body.op === "reclaim") row = await reclaimPlayer(db, String(body.playerId), deviceToken, now);
      else if (body.op === "joinGuest") {
        const g = await getGuest(String(body.guestId));
        if (!g) throw new BracketError("That name isn't on the roster.");
        row = await joinPlayer(db, { deviceToken, now, guest: { id: g.id, name: g.name } });
      } else {
        const guests = await getAllGuests();
        row = await joinPlayer(db, { deviceToken, now, name: String(body.name ?? ""), otherNames: guests.map((g) => g.name) });
      }
      store.set(PLAYER_COOKIE, deviceToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      invalidateBracketCache();
      return Response.json({ ok: true, name: row.name });
    }

    const who = await resolvePlayer(db, asId);
    if (!who.playerId || !(await getPlayer(db, who.playerId))) throw new BracketError("Join the game first.");

    if (body.op === "vote") await castVote(db, who.playerId, Number(body.matchId), Number(body.bearNum), now);
    else if (body.op === "talk") await postTalk(db, who.playerId, Number(body.matchId), String(body.text ?? ""), now);
    else if (body.op === "wager") await setWager(db, who.playerId, Number(body.amount) || 0, !!body.locked, now);
    else if (body.op === "tbGuess") {
      const value = Number(body.value);
      if (!Number.isFinite(value) || value < 0) throw new BracketError("Type a number first.");
      await lockTbGuess(db, who.playerId, value, now);
    } else throw new BracketError("Unknown request.");
  } catch (err) {
    invalidateBracketCache();
    if (err instanceof BracketError) return Response.json({ error: err.message }, { status: 409 });
    throw err;
  }

  invalidateBracketCache();
  return Response.json({ ok: true });
}
