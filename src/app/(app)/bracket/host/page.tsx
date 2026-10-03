import { redirect } from "next/navigation";
import { isHost } from "@/lib/identity";
import { getAllGuests } from "@/lib/guests";
import { PressBox } from "@/components/bracket/PressBox";

export default async function BracketHostPage() {
  if (!(await isHost())) redirect("/");
  const guests = await getAllGuests();
  return <PressBox rsvpYes={guests.filter((g) => g.status === "yes").length} />;
}
