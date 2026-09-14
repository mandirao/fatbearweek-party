import Link from "next/link";
import { getMeId } from "@/lib/identity";
import { getGuest, getAllGuests, heads, yesHeadsTotal } from "@/lib/guests";
import { findPotluckItem } from "@/lib/potluck";

export default async function RosterPage() {
  const meId = await getMeId();
  const me = meId ? await getGuest(meId) : null;
  const guests = await getAllGuests();
  const yes = guests.filter((g) => g.status === "yes");
  const no = guests.filter((g) => g.status === "no");
  const pending = guests.filter((g) => !g.status);
  const yesHeads = yesHeadsTotal(guests);

  const myDish = me?.status === "yes" ? findPotluckItem(me.dishId) : null;
  const myHeadsLabel = me?.status === "yes" ? (heads(me) === 1 ? "1 head" : `${heads(me)} heads`) : "";

  return (
    <div className="px-5 pt-6 pb-[30px] flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <div className="font-semibold text-[11px] tracking-[0.2em] text-ink-faint">THE FIELD</div>
        <h2 className="m-0 font-display text-[30px] leading-none text-forest uppercase">Roster</h2>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 bg-forest rounded p-3.5 flex flex-col gap-[3px]">
          <span className="font-display text-[26px] text-cream leading-none">{yesHeads}</span>
          <span className="font-semibold text-[11px] tracking-[0.14em] text-green-muted">HEADS EXPECTED</span>
        </div>
        <div className="flex-1 bg-tan rounded p-3.5 flex flex-col gap-[3px]">
          <span className="font-display text-[26px] text-salmon leading-none">{pending.length}</span>
          <span className="font-semibold text-[11px] tracking-[0.14em] text-ink-faint">NO REPLY</span>
        </div>
        <div className="flex-1 bg-tan rounded p-3.5 flex flex-col gap-[3px]">
          <span className="font-display text-[26px] text-ink-faint leading-none">{no.length}</span>
          <span className="font-semibold text-[11px] tracking-[0.14em] text-ink-faint">OUT</span>
        </div>
      </div>

      {me?.status === "yes" && (
        <div className="border-2 border-forest rounded overflow-hidden">
          <div className="bg-forest text-cream px-3 py-3 font-semibold text-xs tracking-[0.14em]">
            YOU&apos;RE ON THE ROSTER
          </div>
          <div className="p-4 px-3.5 flex flex-col gap-3 bg-warm-white">
            <p className="m-0 text-base text-ink-muted leading-[1.5]">
              {myDish ? `You're down for ${myHeadsLabel}, bringing ${myDish.name}.` : "Next up: pick a dish for the feast."}
            </p>
            <Link
              href="/potluck"
              className="flex items-center justify-between gap-2 bg-salmon text-salmon-tint rounded-[3px] px-4 py-[13px] font-display text-[15px] tracking-[0.05em] uppercase hover:bg-salmon-hover"
            >
              <span>{myDish ? "CHANGE MY DISH" : "CLAIM A DISH"}</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="font-semibold text-[11px] tracking-[0.18em] text-ink-faint pb-0.5">COMING</div>
        {yes.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between gap-2.5 bg-warm-white border border-border-tan rounded-[3px] px-3.5 py-[15px]"
          >
            <div className="flex flex-col gap-[3px] min-w-0">
              <span className="text-[17px] font-medium text-forest">{g.name}</span>
              {g.bear && (
                <span className="text-xs font-bold tracking-[0.1em] text-salmon">
                  TEAM {g.bear.toUpperCase()}
                </span>
              )}
            </div>
            {g.extraGuests ? (
              <span className="text-sm text-ink-faint flex-none">
                +{g.extraGuests} guest{g.extraGuests > 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="font-semibold text-[11px] tracking-[0.18em] text-ink-faint pb-0.5">STILL DECIDING</div>
        {pending.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between gap-2.5 bg-sand border border-border-tan-alt rounded-[3px] px-3.5 py-[15px]"
          >
            <span className="text-[17px] text-ink-muted-2">{g.name}</span>
          </div>
        ))}
      </div>

      <Link
        href="/"
        className="self-start inline-flex items-center min-h-11 text-[15px] text-river underline underline-offset-2"
      >
        Back to the invite
      </Link>
    </div>
  );
}
