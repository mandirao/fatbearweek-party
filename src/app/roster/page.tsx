import Link from "next/link";
import { getAllGuests, yesHeadsTotal } from "@/lib/guests";

export default async function RosterPage() {
  const guests = await getAllGuests();
  const yes = guests.filter((g) => g.status === "yes");
  const no = guests.filter((g) => g.status === "no");
  const pending = guests.filter((g) => !g.status);
  const yesHeads = yesHeadsTotal(guests);

  return (
    <div className="px-5 pt-6 pb-[30px] flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <div className="font-semibold text-[10px] tracking-[0.2em] text-ink-faint">THE FIELD</div>
        <h2 className="m-0 font-display text-[30px] leading-none text-forest uppercase">Roster</h2>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 bg-forest rounded p-3.5 flex flex-col gap-[3px]">
          <span className="font-display text-[26px] text-cream leading-none">{yesHeads}</span>
          <span className="font-semibold text-[10px] tracking-[0.14em] text-green-muted">HEADS EXPECTED</span>
        </div>
        <div className="flex-1 bg-tan rounded p-3.5 flex flex-col gap-[3px]">
          <span className="font-display text-[26px] text-salmon leading-none">{pending.length}</span>
          <span className="font-semibold text-[10px] tracking-[0.14em] text-ink-faint-2">NO REPLY</span>
        </div>
        <div className="flex-1 bg-tan rounded p-3.5 flex flex-col gap-[3px]">
          <span className="font-display text-[26px] text-ink-faint-2 leading-none">{no.length}</span>
          <span className="font-semibold text-[10px] tracking-[0.14em] text-ink-faint-2">OUT</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="font-semibold text-[10px] tracking-[0.18em] text-ink-faint pb-0.5">COMING</div>
        {yes.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between gap-2.5 bg-warm-white border border-border-tan rounded-[3px] px-3.5 py-3"
          >
            <div className="flex flex-col gap-[3px] min-w-0">
              <span className="text-[15px] font-medium text-forest">{g.name}</span>
              {g.bear && (
                <span className="text-[11px] font-bold tracking-[0.1em] text-salmon">
                  TEAM {g.bear.toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-xs text-ink-faint flex-none">
              {g.extraGuests ? `+${g.extraGuests} guest${g.extraGuests > 1 ? "s" : ""}` : "solo"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="font-semibold text-[10px] tracking-[0.18em] text-ink-faint pb-0.5">STILL DECIDING</div>
        {pending.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between gap-2.5 bg-sand border border-border-tan-alt rounded-[3px] px-3.5 py-3"
          >
            <span className="text-[15px] text-ink-muted-2">{g.name}</span>
          </div>
        ))}
      </div>

      <Link href="/" className="self-start text-[13px] text-river underline underline-offset-2">
        Back to the invite
      </Link>
    </div>
  );
}
