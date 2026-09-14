import { redirect } from "next/navigation";
import { getMeId } from "@/lib/identity";
import { getGuest } from "@/lib/guests";
import { PARTY, BEAR_CHIPS } from "@/lib/party";
import {
  sayYesAction,
  sayNoAction,
  incGuestsAction,
  decGuestsAction,
  toggleBearChipAction,
  saveBearTextAction,
  withdrawAction,
  switchUserAction,
} from "@/lib/actions";
import Link from "next/link";

export default async function RsvpPage() {
  const meId = await getMeId();
  const me = meId ? await getGuest(meId) : null;
  if (!me) redirect("/checkin");

  const isYes = me.status === "yes";
  const hasStatus = !!me.status;
  const extra = me.extraGuests || 0;
  const headcountLine = extra
    ? `Counting you, that's ${extra + 1} heads.`
    : "Just you for now — bring a +1, a friend, a cousin, or a fellow bear enthusiast.";

  return (
    <div className="px-5 pt-6 pb-[30px] flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <div className="font-semibold text-[11px] tracking-[0.2em] text-ink-faint">ON THE CLOCK</div>
        <h2 className="m-0 font-display text-[30px] leading-none text-forest uppercase">{me.name}</h2>
        <p className="m-0 text-base leading-[1.55] text-ink-muted">
          {PARTY.whenLabel} · {PARTY.addressLine}
        </p>
      </div>

      <div className="flex gap-2">
        <form action={sayYesAction} className="flex-1">
          <button className="w-full bg-salmon text-salmon-tint border-none rounded-[3px] py-5 px-3 font-display text-[17px] tracking-[0.05em] uppercase cursor-pointer hover:bg-salmon-hover">
            I&apos;m in
          </button>
        </form>
        <form action={sayNoAction} className="flex-1">
          <button className="w-full bg-warm-white text-forest border-2 border-forest rounded-[3px] py-[18px] px-3 font-display text-[17px] tracking-[0.05em] uppercase cursor-pointer hover:bg-[#F0E8D6]">
            Can&apos;t make it
          </button>
        </form>
      </div>

      {isYes && (
        <>
          <div className="flex flex-col gap-3 bg-tan rounded p-4">
            <div className="font-semibold text-[11px] tracking-[0.18em] text-ink-faint">BRINGING ANYONE?</div>
            <div className="flex items-center justify-between bg-warm-white rounded-[3px] px-3.5 py-3">
              <span className="text-base text-ink">Additional guests</span>
              <div className="flex items-center gap-4">
                <form action={decGuestsAction}>
                  <button
                    aria-label="Decrease additional guests"
                    className="bg-[#F0E8D6] border-none rounded-[3px] w-11 h-11 text-xl text-forest cursor-pointer hover:bg-tan-pressed"
                  >
                    –
                  </button>
                </form>
                <span className="font-display text-[17px] text-forest min-w-[14px] text-center">{extra}</span>
                <form action={incGuestsAction}>
                  <button
                    aria-label="Increase additional guests"
                    className="bg-[#F0E8D6] border-none rounded-[3px] w-11 h-11 text-xl text-forest cursor-pointer hover:bg-tan-pressed"
                  >
                    +
                  </button>
                </form>
              </div>
            </div>
            <div className="text-[15px] text-ink-muted-2 leading-[1.55]">{headcountLine}</div>
          </div>

          <div className="flex flex-col gap-3 border-2 border-forest rounded overflow-hidden">
            <div className="bg-forest text-cream px-3 py-3 font-semibold text-xs tracking-[0.14em]">
              DECLARE A BEAR <span className="text-green-muted tracking-[0.08em]">· OPTIONAL</span>
            </div>
            <div className="px-3.5 pb-4 flex flex-col gap-3">
              <div className="text-[15px] leading-[1.55] text-ink-muted">
                Allegiance usually happens after scouting, but if you already have a bear, stake your claim now. You
                can switch before brackets lock.{" "}
                <a
                  href="https://files.explore.org/files/Brown-Bears-of-Brooks-Camp-ebook.pdf"
                  target="_blank"
                  className="text-river"
                >
                  Read up on the bears ↗
                </a>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BEAR_CHIPS.map((name) => {
                  const selected = me.bear === name;
                  return (
                    <form key={name} action={toggleBearChipAction}>
                      <input type="hidden" name="bear" value={name} />
                      <button
                        className={`min-h-11 inline-flex items-center rounded-full px-[17px] font-sans font-semibold text-[15px] cursor-pointer border ${
                          selected
                            ? "bg-forest text-cream border-forest"
                            : "bg-warm-white text-forest border-border-tan"
                        }`}
                      >
                        {name}
                      </button>
                    </form>
                  );
                })}
              </div>
              <form action={saveBearTextAction} className="flex gap-2">
                <input
                  name="bear"
                  placeholder="Or type a bear (128, Holly, 856…)"
                  className="flex-1 min-w-0 bg-warm-white border border-border-tan rounded-[3px] p-3 text-base text-forest"
                />
                <button className="bg-forest text-cream border-none rounded-[3px] px-4 font-sans font-bold text-sm tracking-[0.06em] cursor-pointer hover:bg-green-hover">
                  SET
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {hasStatus && (
        <div className="flex flex-col gap-2.5">
          <Link
            href="/"
            className="min-h-11 flex items-center justify-center text-center bg-forest text-cream border-none rounded-[3px] py-4 font-sans font-bold text-base tracking-[0.06em] hover:bg-green-hover"
          >
            Done
          </Link>
          <form action={withdrawAction}>
            <button className="min-h-11 inline-flex items-center text-[15px] text-ink-faint underline underline-offset-2 cursor-pointer bg-transparent border-none p-0">
              Withdraw my RSVP entirely
            </button>
          </form>
        </div>
      )}

      <form action={switchUserAction}>
        <button className="min-h-11 inline-flex items-center self-start text-[15px] text-river underline underline-offset-2 cursor-pointer bg-transparent border-none p-0">
          Not me? Switch name
        </button>
      </form>
    </div>
  );
}
