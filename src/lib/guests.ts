import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { guests, type Guest } from "@/db/schema";

export function heads(g: Guest) {
  return 1 + (g.extraGuests || 0);
}

export async function getAllGuests(): Promise<Guest[]> {
  const db = getDb();
  const rows = await db.select().from(guests);
  return rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function getGuest(id: string): Promise<Guest | null> {
  const db = getDb();
  const rows = await db.select().from(guests).where(eq(guests.id, id));
  return rows[0] ?? null;
}

export async function addGuest(name: string): Promise<Guest> {
  const db = getDb();
  const id = `n${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const [row] = await db.insert(guests).values({ id, name }).returning();
  return row;
}

export async function updateGuest(
  id: string,
  patch: Partial<Pick<Guest, "status" | "extraGuests" | "bear" | "dishId">>,
) {
  const db = getDb();
  await db.update(guests).set(patch).where(eq(guests.id, id));
}

export async function resetAllGuests() {
  const db = getDb();
  await db.update(guests).set({ status: null, extraGuests: 0, bear: null });
}

export function yesHeadsTotal(all: Guest[]) {
  return all.filter((g) => g.status === "yes").reduce((s, g) => s + heads(g), 0);
}
