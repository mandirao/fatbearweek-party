import { isHost } from "@/lib/identity";
import { getLoaded } from "@/lib/bracket/server";
import { buildHostView, buildPublicView } from "@/lib/bracket/view";

export async function GET(request: Request) {
  const view = new URL(request.url).searchParams.get("view");
  const { snap, version, history } = await getLoaded();
  const now = Date.now();
  const headers = { "Cache-Control": "no-store" };

  if (view === "host") {
    if (!(await isHost())) return Response.json({ error: "Host only." }, { status: 403, headers });
    return Response.json(buildHostView(snap, version, history, now), { headers });
  }
  return Response.json(buildPublicView(snap, version, now), { headers });
}
