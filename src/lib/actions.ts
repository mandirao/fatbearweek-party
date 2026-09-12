"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getMeId, setMeId, clearMeId, isHost } from "./identity";
import { addGuest, getGuest, updateGuest, resetAllGuests } from "./guests";

async function requireMe() {
  const id = await getMeId();
  if (!id) redirect("/checkin");
  const guest = await getGuest(id);
  if (!guest) redirect("/checkin");
  return guest;
}

export async function checkinAction(formData: FormData) {
  const guestId = String(formData.get("guestId") || "");
  const guest = guestId ? await getGuest(guestId) : null;
  if (!guest) redirect("/checkin");
  await setMeId(guest.id);
  redirect("/rsvp");
}

export async function addSelfAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/checkin");
  const guest = await addGuest(name);
  await setMeId(guest.id);
  redirect("/rsvp");
}

export async function switchUserAction() {
  await clearMeId();
  redirect("/checkin");
}

export async function sayYesAction() {
  const me = await requireMe();
  await updateGuest(me.id, { status: "yes" });
  revalidatePath("/rsvp");
  revalidatePath("/");
}

export async function sayNoAction() {
  const me = await requireMe();
  await updateGuest(me.id, { status: "no", extraGuests: 0 });
  revalidatePath("/rsvp");
  revalidatePath("/");
}

export async function incGuestsAction() {
  const me = await requireMe();
  await updateGuest(me.id, { extraGuests: Math.min(6, (me.extraGuests || 0) + 1) });
  revalidatePath("/rsvp");
  revalidatePath("/");
}

export async function decGuestsAction() {
  const me = await requireMe();
  await updateGuest(me.id, { extraGuests: Math.max(0, (me.extraGuests || 0) - 1) });
  revalidatePath("/rsvp");
  revalidatePath("/");
}

export async function toggleBearChipAction(formData: FormData) {
  const me = await requireMe();
  const bear = String(formData.get("bear") || "");
  await updateGuest(me.id, { bear: me.bear === bear ? null : bear });
  revalidatePath("/rsvp");
  revalidatePath("/");
  revalidatePath("/roster");
}

export async function saveBearTextAction(formData: FormData) {
  const me = await requireMe();
  const bear = String(formData.get("bear") || "").trim();
  if (bear) await updateGuest(me.id, { bear });
  revalidatePath("/rsvp");
  revalidatePath("/");
  revalidatePath("/roster");
}

export async function withdrawAction() {
  const me = await requireMe();
  await updateGuest(me.id, { status: null, extraGuests: 0, bear: null });
  revalidatePath("/rsvp");
  revalidatePath("/roster");
  redirect("/");
}

export async function resetAllAction() {
  if (!(await isHost())) redirect("/");
  await resetAllGuests();
  revalidatePath("/host");
  revalidatePath("/roster");
  revalidatePath("/");
}

export async function hostAddGuestAction(formData: FormData) {
  if (!(await isHost())) redirect("/");
  const name = String(formData.get("name") || "").trim();
  if (name) await addGuest(name);
  revalidatePath("/host");
  revalidatePath("/checkin");
}
