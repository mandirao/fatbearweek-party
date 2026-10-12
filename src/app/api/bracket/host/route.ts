import { isHost } from "@/lib/identity";
import { ArchivedError, isArchived } from "@/lib/archive";
import { bracketDb, invalidateBracketCache } from "@/lib/bracket/server";
import { HOST_ACTIONS, type HostAction } from "@/lib/bracket/engine";
import {
  addBots,
  BracketError,
  dismissRejoin,
  forceTie,
  hostAction,
  jumpTo,
  resetBracket,
  setGameSettings,
  setTalkHidden,
  undoRejoin,
  type JumpTarget,
} from "@/lib/bracket/store";

type Body =
  | { op: "action"; action: HostAction; expectedVersion?: number }
  | { op: "settings"; onAir?: boolean; mode?: "rehearsal" | "live" }
  | { op: "addBots"; n: number }
  | { op: "forceTie" }
  | { op: "reset" }
  | { op: "hideTalk"; playerId: string; matchId: number; hidden: boolean }
  | { op: "jumpTo"; target: JumpTarget }
  | { op: "undoRejoin"; playerId: string }
  | { op: "dismissRejoin"; playerId: string };

export async function POST(request: Request) {
  if (isArchived()) return Response.json({ error: new ArchivedError().message }, { status: 403 });
  if (!(await isHost())) return Response.json({ error: "Host only." }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as Body;
  const db = bracketDb();
  const now = Date.now();
  const rng = Math.random;

  try {
    switch (body.op) {
      case "action":
        if (!HOST_ACTIONS.includes(body.action)) throw new BracketError("Unknown action.");
        await hostAction(db, body.action, { now, rng, expectedVersion: body.expectedVersion });
        break;
      case "settings": {
        const patch: { onAir?: boolean; mode?: "rehearsal" | "live" } = {};
        if (typeof body.onAir === "boolean") patch.onAir = body.onAir;
        if (body.mode === "rehearsal" || body.mode === "live") patch.mode = body.mode;
        await setGameSettings(db, patch);
        break;
      }
      case "addBots":
        await addBots(db, Number(body.n) || 1, { now, rng });
        break;
      case "forceTie":
        await forceTie(db, now);
        break;
      case "reset":
        await resetBracket(db);
        break;
      case "hideTalk":
        await setTalkHidden(db, String(body.playerId), Number(body.matchId), !!body.hidden);
        break;
      case "jumpTo":
        if (!["round2", "semis", "wager", "final"].includes(body.target)) throw new BracketError("Unknown jump.");
        await jumpTo(db, body.target, { now, rng });
        break;
      case "undoRejoin":
        await undoRejoin(db, String(body.playerId));
        break;
      case "dismissRejoin":
        await dismissRejoin(db, String(body.playerId));
        break;
      default:
        throw new BracketError("Unknown request.");
    }
  } catch (err) {
    invalidateBracketCache();
    if (err instanceof BracketError) return Response.json({ error: err.message }, { status: 409 });
    throw err;
  }

  invalidateBracketCache();
  return Response.json({ ok: true });
}
