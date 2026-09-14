import Link from "next/link";
import { getMeId } from "@/lib/identity";
import { getGuest } from "@/lib/guests";
import { BEAR_CHIPS } from "@/lib/party";
import { toggleBearChipAction, saveBearTextAction } from "@/lib/actions";

export default async function BearsPage() {
  const meId = await getMeId();
  const me = meId ? await getGuest(meId) : null;

  return (
    <div className="flex flex-col">
      {!me && (
        <Link
          href="/checkin"
          className="bg-salmon border-b-2 border-salmon-hover px-5 py-[13px] flex items-center justify-between gap-3 no-underline"
        >
          <span className="text-[14.5px] leading-[1.4] text-salmon-tint">
            Browse freely — <strong>check in on the invite</strong> to pick a bear.
          </span>
          <span className="flex-none font-bold text-sm text-salmon-tint">→</span>
        </Link>
      )}

      <div className="px-5 pt-[22px] pb-[30px] flex flex-col gap-5">
        <div className="flex flex-col gap-2 border-b-2 border-forest pb-[18px]">
          <h1 className="m-0 font-display text-[36px] leading-[0.92] text-forest uppercase">
            Pick
            <br />
            your bear
          </h1>
          <p className="m-0 text-base leading-[1.55] text-ink">
            Allegiance is free, non-binding, and has no bearing on the bracket. It exists so we can talk trash before
            the field is even announced.
          </p>
        </div>

        <div className="border-2 border-forest rounded overflow-hidden">
          <div className="bg-forest text-cream px-3 py-3 font-semibold text-xs tracking-[0.14em]">YOUR BEAR</div>
          <div className="p-3.5 flex flex-col gap-3.5 bg-warm-white">
            {me?.bear ? (
              <div className="flex items-center gap-3 bg-salmon rounded-[3px] p-3.5">
                <span className="flex-1 min-w-0 font-display text-[19px] leading-[1.1] text-salmon-tint">
                  TEAM {me.bear.toUpperCase()}
                </span>
                <form action={toggleBearChipAction}>
                  <input type="hidden" name="bear" value={me.bear} />
                  <button className="flex-none bg-transparent text-salmon-tint border border-salmon-hover rounded-[3px] min-h-11 px-3.5 font-sans font-semibold text-sm cursor-pointer hover:bg-salmon-hover">
                    Undeclare
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-[15px] leading-[1.55] text-ink-muted">
                {me
                  ? "Nothing declared yet. Pick one of the usual suspects, or name any bear you like."
                  : "Check in on the invite first, then pick a bear here."}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {BEAR_CHIPS.map((name) => {
                const selected = me?.bear === name;
                const chipClasses = `min-h-11 inline-flex items-center rounded-full px-[17px] font-sans font-semibold text-[15px] border ${
                  selected ? "bg-forest text-cream border-forest" : "bg-warm-white text-forest border-border-tan"
                }`;

                if (!me) {
                  return (
                    <Link key={name} href="/checkin" className={`${chipClasses} no-underline`}>
                      {name}
                    </Link>
                  );
                }

                return (
                  <form key={name} action={toggleBearChipAction}>
                    <input type="hidden" name="bear" value={name} />
                    <button className={`${chipClasses} cursor-pointer`}>{name}</button>
                  </form>
                );
              })}
            </div>

            {me && (
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
            )}

            <div className="text-sm leading-[1.5] text-ink-muted">
              Not sure yet?{" "}
              <a
                href="https://files.explore.org/files/Brown-Bears-of-Brooks-Camp-ebook.pdf"
                target="_blank"
                className="text-river"
              >
                Read up on the bears ↗
              </a>{" "}
              or wait for the bracket reveal.
            </div>
          </div>
        </div>

        <div className="bg-cam-bg rounded overflow-hidden">
          <div className="p-3.5 flex items-center gap-2">
            <span className="font-bold text-[11px] tracking-[0.2em] text-apricot">THE BRACKET</span>
            <span className="flex-1 h-px bg-green-rule-2" />
            <span className="font-semibold text-[11px] tracking-[0.14em] text-cam-label">LOCKED</span>
          </div>
          <div className="px-3.5 pb-4">
            <div
              className="relative rounded-[3px] py-[26px] px-4 flex flex-col items-center gap-2 text-center"
              style={{ backgroundImage: "repeating-linear-gradient(135deg, #1C3226 0 8px, #16281E 8px 16px)" }}
            >
              <span className="font-display text-[21px] leading-[1.1] text-tan">Opens September 18</span>
              <span className="text-[14.5px] leading-[1.5] text-green-muted-4 max-w-[280px]">
                Katmai reveals the contenders and the bracket that afternoon. Picks open here the moment it drops,
                and lock at 9:00 PM on October 2.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
