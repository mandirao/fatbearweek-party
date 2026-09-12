import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isHost } from "@/lib/identity";
import { getAllGuests, heads, yesHeadsTotal } from "@/lib/guests";
import { resetAllAction, hostAddGuestAction } from "@/lib/actions";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";

export default async function HostPage() {
  if (!(await isHost())) redirect("/");

  const guests = await getAllGuests();
  const yes = guests.filter((g) => g.status === "yes");
  const pending = guests.filter((g) => !g.status);
  const yesHeads = yesHeadsTotal(guests);

  const hdrs = await headers();
  const host = hdrs.get("host") || "";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const inviteUrl = host ? `${proto}://${host}/` : "";

  const hostSummary = `${yesHeads} expected · ${yes.length} ${yes.length === 1 ? "ballot" : "ballots"} · ${pending.length} still deciding`;

  return (
    <div className="px-5 pt-6 pb-[30px] flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <div className="font-semibold text-[10px] tracking-[0.2em] text-ink-faint">HOST ONLY</div>
        <h2 className="m-0 font-display text-[30px] leading-none text-forest uppercase">Press box</h2>
        <p className="m-0 text-sm leading-[1.55] text-ink-muted">{hostSummary}</p>
      </div>

      <div className="border-2 border-forest rounded overflow-hidden">
        <div className="flex bg-forest text-cream font-semibold text-[10px] tracking-[0.14em] px-3 py-2.5">
          <span className="flex-1">GUEST</span>
          <span className="w-[74px]">STATUS</span>
          <span className="w-11 text-right">HEADS</span>
        </div>
        {guests.map((g) => (
          <div
            key={g.id}
            className="flex items-center px-3 py-[11px] border-b border-tan bg-warm-white text-sm"
          >
            <span className="flex-1 text-forest">{g.name}</span>
            <span className="w-[74px] font-semibold text-[11px] tracking-[0.08em] text-ink-faint">
              {g.status === "yes" ? (g.bear ? `IN · ${g.bear}` : "IN") : g.status === "no" ? "OUT" : "—"}
            </span>
            <span className="w-11 text-right text-ink">{g.status === "yes" ? heads(g) : "—"}</span>
          </div>
        ))}
        <div className="flex px-3 py-3 bg-tan font-display text-sm text-forest">
          <span className="flex-1">TOTAL EXPECTED</span>
          <span>{yesHeads}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 bg-tan rounded p-4">
        <div className="font-semibold text-[10px] tracking-[0.18em] text-ink-faint">SHARE THE LINK</div>
        <div className="bg-warm-white border border-border-tan rounded-[3px] p-3 text-[13px] text-ink-muted overflow-hidden text-ellipsis">
          {inviteUrl || "Deploy the app to get a shareable link."}
        </div>
        {inviteUrl && <CopyLinkButton url={inviteUrl} />}
        <div className="text-[13px] text-ink-muted-2 leading-[1.5]">
          Text it to anyone. They pick their name, or add themselves if they&apos;re not listed.
        </div>
      </div>

      <div className="flex flex-col gap-2.5 border border-border-tan rounded p-4">
        <div className="font-semibold text-[10px] tracking-[0.18em] text-ink-faint">ADD A GUEST</div>
        <form action={hostAddGuestAction} className="flex gap-2">
          <input
            name="name"
            placeholder="Guest name"
            required
            className="flex-1 min-w-0 bg-warm-white border border-border-tan rounded-[3px] p-3 text-sm text-forest"
          />
          <button className="bg-forest text-cream border-none rounded-[3px] px-4 font-sans font-bold text-[13px] tracking-[0.06em] cursor-pointer hover:bg-green-hover">
            ADD
          </button>
        </form>
      </div>

      <form action={resetAllAction}>
        <ConfirmSubmitButton
          confirmText="Reset every guest's RSVP, guest count and bear pick? This can't be undone."
          className="text-[13px] text-ink-faint-2 underline underline-offset-2 cursor-pointer bg-transparent border-none p-0"
        >
          Reset all RSVPs
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
