import Link from "next/link";
import { getAllGuests } from "@/lib/guests";
import { checkinAction, addSelfAction } from "@/lib/actions";

export default async function CheckinPage() {
  const guests = await getAllGuests();

  return (
    <div className="px-5 pt-6 pb-[30px] flex flex-col gap-[18px]">
      <div className="flex flex-col gap-1.5">
        <div className="font-semibold text-[10px] tracking-[0.2em] text-ink-faint">CHECK-IN</div>
        <h2 className="m-0 font-display text-[30px] leading-none text-forest uppercase">Who&apos;s this?</h2>
        <p className="m-0 text-sm leading-[1.55] text-ink-muted">
          No password, no account. Pick your name so the roster knows who just walked in.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {guests.map((g) => (
          <form key={g.id} action={checkinAction}>
            <input type="hidden" name="guestId" value={g.id} />
            <button className="flex items-center justify-between gap-2.5 w-full bg-warm-white border border-border-tan rounded-[3px] px-3.5 py-[13px] cursor-pointer text-left hover:border-forest">
              <span className="text-[15px] font-medium text-forest">{g.name}</span>
              <span className="text-[11px] font-semibold tracking-[0.1em] text-ink-faint-2">
                {g.status === "yes" ? "IN" : g.status === "no" ? "OUT" : ""}
              </span>
            </button>
          </form>
        ))}
      </div>

      <div className="border-t border-border-tan pt-4 flex flex-col gap-2.5">
        <div className="font-semibold text-[10px] tracking-[0.2em] text-ink-faint">NOT ON THE LIST</div>
        <form action={addSelfAction} className="flex gap-2">
          <input
            name="name"
            placeholder="Your name"
            required
            className="flex-1 min-w-0 bg-warm-white border border-border-tan rounded-[3px] px-[13px] py-[13px] text-[15px] text-forest"
          />
          <button className="bg-forest text-cream border-none rounded-[3px] px-[18px] font-sans font-bold text-[13px] tracking-[0.06em] cursor-pointer hover:bg-green-hover">
            ADD
          </button>
        </form>
      </div>

      <Link href="/" className="self-start text-[13px] text-river underline underline-offset-2">
        Back to the invite
      </Link>
    </div>
  );
}
