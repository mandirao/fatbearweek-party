import { cookies } from "next/headers";
import { isArchived } from "./archive";

const ME_COOKIE = "fbw_me";
export const HOST_COOKIE = "fbw_host";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

/** In archive mode nobody is signed in, so every page renders as a visitor would see it. */
export async function getMeId(): Promise<string | null> {
  if (isArchived()) return null;
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
  if (isArchived()) return false;
  const store = await cookies();
  return store.get(HOST_COOKIE)?.value === "1";
}
