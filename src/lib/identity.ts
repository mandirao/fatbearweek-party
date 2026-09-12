import { cookies } from "next/headers";

const ME_COOKIE = "fbw_me";
export const HOST_COOKIE = "fbw_host";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function getMeId(): Promise<string | null> {
  const store = await cookies();
  return store.get(ME_COOKIE)?.value ?? null;
}

export async function setMeId(id: string) {
  const store = await cookies();
  store.set(ME_COOKIE, id, COOKIE_OPTS);
}

export async function clearMeId() {
  const store = await cookies();
  store.delete(ME_COOKIE);
}

export async function isHost(): Promise<boolean> {
  const store = await cookies();
  return store.get(HOST_COOKIE)?.value === "1";
}
