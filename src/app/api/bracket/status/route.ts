import { getBracketStatus } from "@/lib/bracket/server";

export async function GET() {
  return Response.json(await getBracketStatus(), { headers: { "Cache-Control": "no-store" } });
}
