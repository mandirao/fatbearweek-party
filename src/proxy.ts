import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  if (!url.searchParams.has("host")) return NextResponse.next();

  url.searchParams.delete("host");
  const res = NextResponse.redirect(url);
  res.cookies.set("fbw_host", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

export const proxyConfig = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
