import Link from "next/link";
import { getMeId } from "@/lib/identity";
import { getGuest } from "@/lib/guests";
import { toggleBearChipAction, saveBearTextAction } from "@/lib/actions";
import { BearField } from "@/components/BearField";
import { LiveCamPanel } from "@/components/LiveCamPanel";
import { BRIEFS, bearPhotoUrl } from "@/lib/bears";

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
              <div className="flex items-center gap-3 bg-forest rounded p-3.5">
                <span className="flex-1 min-w-0 font-display text-[19px] leading-[1.1] text-cream">
                  TEAM {me.bear.toUpperCase()}
                </span>
                <form action={toggleBearChipAction}>
                  <input type="hidden" name="bear" value={me.bear} />
                  <button className="flex-none bg-transparent text-green-muted-4 border border-green-rule rounded min-h-11 px-3.5 font-sans font-semibold text-sm cursor-pointer hover:bg-spruce">
                    Undeclare
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-[15px] leading-[1.55] text-ink-muted">
                {me
                  ? "Nothing declared yet. Scout the field below, or type any bear you like."
                  : "Check in on the invite first, then pick a bear here."}
              </div>
            )}

            <form action={saveBearTextAction} className="flex gap-2">
              <input
                name="bear"
                aria-label="Your bear"
                placeholder="Type a bear (128, Holly, 856…)"
                className="flex-1 min-w-0 bg-warm-white border border-border-tan rounded py-[15px] px-3 text-base text-forest"
              />
              <button className="bg-forest text-cream border-none rounded min-h-11 px-4 font-sans font-bold text-[15px] tracking-[0.06em] cursor-pointer hover:bg-green-hover">
                SET
              </button>
            </form>
          </div>
        </div>

        <BearField meBear={me?.bear ?? null} />

        <div className="flex flex-col gap-2.5">
          {BRIEFS.map((brief) => (
            <details key={brief.key} name="bear-briefs" className="group border border-border-tan rounded bg-warm-white overflow-hidden">
              <summary className="w-full text-left px-3.5 py-[15px] min-h-13 flex items-center gap-2.5 cursor-pointer list-none font-sans">
                <span className="flex-1 font-bold text-[15px] text-forest">{brief.title}</span>
                <span className="flex-none text-lg text-salmon">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">–</span>
                </span>
              </summary>
              <div className="px-3.5 pb-4 flex flex-col gap-3">
                {brief.img && (
                  <img src={bearPhotoUrl(brief.img)} alt={brief.title} className="block w-full h-auto rounded" />
                )}
                {brief.paras.map((p, i) => (
                  <p key={i} className="m-0 text-[15.5px] leading-[1.6] text-ink">
                    {p}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>

        <LiveCamPanel />

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
