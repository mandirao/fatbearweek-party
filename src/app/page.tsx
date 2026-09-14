import Link from "next/link";
import { getMeId } from "@/lib/identity";
import { getGuest, getAllGuests, yesHeadsTotal } from "@/lib/guests";
import { PARTY, CAMS, SCOUTING_LINKS, upcomingBroadcastEvents } from "@/lib/party";
import { switchUserAction } from "@/lib/actions";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ cam?: string }>;
}) {
  const { cam } = await searchParams;
  const meId = await getMeId();
  const me = meId ? await getGuest(meId) : null;
  const allGuests = await getAllGuests();
  const yesHeads = yesHeadsTotal(allGuests);
  const upcomingEvents = upcomingBroadcastEvents();

  const camIdx = Math.min(Math.max(parseInt(cam || "0", 10) || 0, 0), CAMS.length - 1);
  const activeCam = CAMS[camIdx];

  const barLabel = me
    ? me.status === "yes"
      ? "YOU'RE ON THE ROSTER"
      : me.status === "no"
        ? "YOU'RE OUT THIS YEAR"
        : "YOU HAVEN'T ANSWERED"
    : "ONE TAP, NO ACCOUNT";
  const barDetail = me
    ? me.status === "yes" && me.extraGuests
      ? `${me.name} + ${me.extraGuests} · ${PARTY.whenShort}`
      : `${me.name} · ${PARTY.whenShort}`
    : PARTY.whenLabel;
  const barCta = me && me.status ? "Change" : "RSVP";
  const rsvpHref = me ? "/rsvp" : "/checkin";

  const myHeadline = me
    ? me.status === "yes"
      ? me.extraGuests
        ? `${me.name} + ${me.extraGuests}, confirmed`
        : `${me.name}, confirmed`
      : me.status === "no"
        ? `${me.name}, out this year`
        : `${me.name}, undeclared`
    : "";
  const mySubline = me
    ? me.status === "yes"
      ? `You're on the roster. Brackets lock at ${PARTY.bracketLockLabel}.`
      : me.status === "no"
        ? "The Golden Salmon will miss you."
        : "You haven't answered yet."
    : "";

  return (
    <div className="flex flex-col">
      <div className="bg-forest pt-1.5 px-5 pb-[26px] flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[11px] tracking-[0.2em] text-apricot">KATMAI PLAYOFFS</span>
          <span className="flex-1 h-px bg-green-rule" />
          <span className="font-semibold text-[11px] tracking-[0.2em] text-apricot">{PARTY.dateEyebrow}</span>
        </div>
        <h1 className="m-0 font-display text-[46px] leading-[0.88] tracking-[-0.02em] text-cream uppercase">
          Fat Bear
          <br />
          Week
        </h1>
        <div className="inline-flex self-start bg-salmon text-salmon-tint font-semibold text-[13px] tracking-[0.1em] px-[13px] py-2 rounded-[2px] uppercase">
          {PARTY.subtitle}
        </div>
      </div>

      <div className="px-5 pt-[22px] pb-4 flex flex-col gap-[22px]">
        <p className="m-0 text-[17px] leading-[1.6] text-ink">
          I stinkin&rsquo; love Fat Bear Week, so naturally this calls for a party. Come scout some extremely large
          Alaskan bears, make questionably informed bracket picks, eat salmon-adjacent food, and compete for eternal
          glory&mdash;and possibly <strong className="text-salmon">The Golden Salmon.</strong> Love, Mandi
        </p>

        <div className="flex flex-col rounded overflow-hidden border-2 border-forest">
          <div className="px-3 py-3 bg-forest text-cream font-semibold text-xs tracking-[0.14em]">GAME DETAILS</div>
          <div className="flex justify-between gap-3.5 px-3 py-[14px] text-base text-ink bg-warm-white">
            <span className="text-ink-faint">When</span>
            <span className="font-medium text-right">{PARTY.whenLabel}</span>
          </div>
          <div className="flex justify-between gap-3.5 px-3 py-[14px] text-base text-ink bg-sand">
            <span className="text-ink-faint flex-none">Where</span>
            <span className="font-medium text-right">{PARTY.addressLine}</span>
          </div>
          <div className="flex justify-between gap-3.5 px-3 py-[14px] text-base text-ink bg-warm-white">
            <span className="text-ink-faint">Brackets lock</span>
            <span className="font-medium text-right">{PARTY.bracketLockLabel}</span>
          </div>
        </div>

        <div className="flex flex-col gap-[14px]">
          <div className="flex gap-2.5 items-start text-base leading-[1.55] text-ink">
            <span className="w-1.5 h-1.5 bg-salmon rounded-full mt-[9px] flex-none" />
            <span>
              <strong>No homework required.</strong> Bear profiles, before/after photos and scouting material
              provided. Fill out as much&mdash;or as little&mdash;of the bracket as you want.
            </span>
          </div>
          <div className="flex gap-2.5 items-start text-base leading-[1.55] text-ink">
            <span className="w-1.5 h-1.5 bg-salmon rounded-full mt-[9px] flex-none" />
            <span>
              <strong>Bring a +1!</strong> Friends, spouses, singles, cousins and fellow bear enthusiasts welcome.
            </span>
          </div>
        </div>

        <div id="costume" className="border-2 border-forest rounded overflow-hidden scroll-mt-[70px]">
          <div className="bg-forest text-cream px-3 py-3 font-semibold text-xs tracking-[0.14em]">
            COSTUME ENCOURAGED
          </div>
          <div className="p-3.5 flex flex-col gap-3.5 bg-warm-white">
            <div className="text-[16px] leading-[1.6] text-ink flex flex-col gap-2.5">
              <p className="m-0">
                Come as a <strong>bear, salmon, tree, river, ranger, wildlife biologist</strong> or suspiciously
                outdoorsy human.
              </p>
              <p className="m-0">
                Or just wear <strong>brown, rust, moss, forest green, salmon pink or river blue.</strong>
              </p>
              <p className="m-0">No purchases required. Commitment to the bit is optional but admired.</p>
            </div>
            <div className="flex gap-1.5">
              {["#6B4A2E", "#C2522E", "#7A8B4A", "#2E5B41", "#E8A87C", "#2F6B7A"].map((c) => (
                <div key={c} className="w-7 h-7 rounded-[2px]" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>

        {me && (
          <div className="border-2 border-forest rounded overflow-hidden">
            <div className="bg-forest text-cream px-3 py-3 font-semibold text-xs tracking-[0.14em]">YOUR STATUS</div>
            <div className="p-4 px-3.5 flex flex-col gap-3 bg-warm-white">
              <div className="font-display text-xl text-forest leading-[1.15]">{myHeadline}</div>
              <div className="text-base text-ink-muted leading-[1.5]">{mySubline}</div>
              {me.bear && (
                <div className="self-start bg-forest text-cream rounded-full px-[13px] py-[7px] font-bold text-xs tracking-[0.1em]">
                  TEAM {me.bear.toUpperCase()}
                </div>
              )}
              <div className="flex gap-2">
                <Link
                  href="/rsvp"
                  className="flex-1 bg-forest text-cream border-none rounded-[3px] py-[13px] text-center font-sans font-bold text-[15px] tracking-[0.06em] hover:bg-green-hover"
                >
                  Change it
                </Link>
                <form action={switchUserAction} className="flex-1">
                  <button className="w-full bg-warm-white text-forest border-2 border-forest rounded-[3px] py-[11px] font-sans font-bold text-[15px] tracking-[0.06em] cursor-pointer hover:bg-[#F0E8D6]">
                    Not you?
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 bg-tan rounded-[3px] p-3.5 text-center flex flex-col gap-1">
            <span className="font-bold text-[11px] tracking-[0.14em] text-ink-faint">POTLUCK</span>
            <span className="text-[13px] leading-[1.35] text-ink-faint">Sign-up list goes up in September</span>
          </div>
          <div className="flex-1 bg-tan rounded-[3px] p-3.5 text-center flex flex-col gap-1">
            <span className="font-bold text-[11px] tracking-[0.14em] text-ink-faint">BRACKET</span>
            <span className="text-[13px] leading-[1.35] text-ink-faint">Katmai reveals the field Sept 18</span>
          </div>
        </div>

        <Link
          href="/roster"
          className="self-start inline-flex items-center min-h-11 text-[15px] text-river underline underline-offset-2 w-fit"
        >
          See who&apos;s coming ({yesHeads} confirmed)
        </Link>

        <div className="border-t-2 border-forest pt-5 flex flex-col gap-1">
          <div className="font-display text-2xl leading-[1.05] text-forest uppercase">WTH IS FAT BEAR WEEK?</div>
        </div>

        <div className="bg-cam-bg rounded overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-3.5 pt-3 pb-2.5">
            <span className="w-[7px] h-[7px] rounded-full bg-salmon flex-none" />
            <span className="font-bold text-[11px] tracking-[0.2em] text-apricot">LIVE FROM KATMAI</span>
            <span className="flex-1 h-px bg-green-rule-2" />
            <span className="font-semibold text-[11px] tracking-[0.14em] text-cam-label">
              {activeCam.badge} · {activeCam.name}
            </span>
          </div>

          {activeCam.src ? (
            <div className="relative w-full pt-[56.25%] bg-cam-stage">
              <iframe
                src={activeCam.src}
                title="Katmai live cam"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          ) : (
            <div
              className="relative w-full pt-[56.25%]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, #1C3226 0 8px, #16281E 8px 16px)",
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                <span className="font-bold text-xs tracking-[0.18em] text-tan">
                  {activeCam.badge} · {activeCam.name}
                </span>
                <span className="text-sm leading-[1.5] text-green-muted-3 max-w-[260px]">
                  This feed doesn&apos;t embed. Watch it on explore.org.
                </span>
                <a
                  href={activeCam.link}
                  target="_blank"
                  className="min-h-11 inline-flex items-center text-[15px] font-semibold text-river-light"
                >
                  Open the cam ↗
                </a>
              </div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto px-3.5 py-3">
            {CAMS.map((c, i) => {
              const selected = i === camIdx;
              return (
                <Link
                  key={c.badge}
                  href={`/?cam=${i}`}
                  scroll={false}
                  className="flex-none w-[118px] flex flex-col gap-1.5 text-left"
                >
                  <div
                    className="w-full h-14 rounded-[3px] flex items-end p-[5px] box-border bg-cover bg-center"
                    style={{
                      border: `2px solid ${selected ? "#C2522E" : "#3A5244"}`,
                      backgroundImage: c.thumb
                        ? `linear-gradient(to top, rgba(10,20,14,0.8), rgba(10,20,14,0.15) 65%), url(${c.thumb})`
                        : "repeating-linear-gradient(135deg, #1C3226 0 6px, #16281E 6px 12px)",
                    }}
                  >
                    <span
                      className="font-bold text-[11px] tracking-[0.12em]"
                      style={{ color: selected ? "#EFE6D2" : "#A9BCAD" }}
                    >
                      {c.badge}
                    </span>
                  </div>
                  <span
                    className="text-[13px] leading-[1.3] min-h-[34px]"
                    style={{ color: selected ? "#EFE6D2" : "#A9BCAD" }}
                  >
                    {c.name}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="px-3.5 pb-3.5 text-xs leading-[1.5] text-green-muted-2">
            Cams are seasonal &mdash; if a feed is dark, it&apos;s the off-season.{" "}
            <a
              href="https://explore.org/livecams/brown-bears/brown-bear-salmon-cam-brooks-falls"
              target="_blank"
              className="text-river-light"
            >
              All Katmai cams on explore.org ↗
            </a>
          </div>
        </div>

        <p className="m-0 text-[15px] leading-[1.6] text-ink-muted">
          Every fall, the brown bears of Katmai National Park in Alaska gorge on salmon before hibernation. Katmai
          runs a March Madness&ndash;style bracket where the public votes, head to head, on which bear got most
          gloriously fat. <strong>It is a real thing. There is a real champion.</strong> We are going to take it
          extremely seriously for one evening.
        </p>

        <div className="border-2 border-forest rounded overflow-hidden">
          <div className="bg-forest text-cream px-3 py-3 font-semibold text-xs tracking-[0.14em]">
            SCOUTING DEPARTMENT
          </div>
          <div className="p-3.5 flex flex-col gap-2.5 bg-warm-white">
            <div className="text-[15px] leading-[1.55] text-ink-muted">
              Optional homework for the competitively deranged:
            </div>
            {SCOUTING_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                className="flex flex-col gap-[3px] px-3.5 py-[14px] bg-sand rounded-[3px] no-underline"
              >
                <span className="text-base font-semibold text-forest">{link.title}</span>
                <span className="text-sm leading-[1.45] text-ink-muted-2">{link.desc}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="border-2 border-forest rounded overflow-hidden">
          <div className="bg-forest text-cream px-3 py-3 font-semibold text-xs tracking-[0.14em]">
            BROADCAST SCHEDULE <span className="text-green-muted tracking-[0.08em]">· LIVE ON BEARCAM</span>
          </div>
          <div className="p-3.5 flex flex-col gap-3.5 bg-warm-white">
            <div className="text-[15px] leading-[1.55] text-ink-muted">
              Rangers and biologists go live to answer all our nerdy questions. Free, no registration.
            </div>

            {upcomingEvents.map((e) => (
              <div key={e.iso} className="flex gap-3 items-start">
                <div
                  className="flex-none w-[54px] rounded-[3px] py-2 px-1 text-center"
                  style={{ background: e.big ? "#A84322" : "#F5EDDC" }}
                >
                  <div
                    className="font-bold text-[11px] tracking-[0.1em]"
                    style={{ color: e.big ? "#FFF8EA" : "#7A7266" }}
                  >
                    {e.day}
                  </div>
                  <div
                    className="font-display text-xl leading-[1.1]"
                    style={{ color: e.big ? "#FFF8EA" : "#1F3B2C" }}
                  >
                    {e.date}
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                  <div className="text-base font-semibold leading-[1.3] text-forest">{e.title}</div>
                  <div className="font-semibold text-[13px] tracking-[0.04em] text-ink-faint">{e.times}</div>
                  <div className="text-sm leading-[1.45] text-ink-muted-2">{e.desc}</div>
                  <a
                    href={e.url}
                    target="_blank"
                    className="min-h-11 inline-flex items-center text-sm font-semibold text-river"
                  >
                    Watch on YouTube ↗
                  </a>
                </div>
              </div>
            ))}

            {upcomingEvents.length === 0 && (
              <div className="text-[15px] leading-[1.55] text-ink-muted-2">
                This season&apos;s live events have wrapped.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 bg-forest border-t-2 border-spruce px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex items-center gap-3">
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="font-bold text-[11px] tracking-[0.16em] text-apricot">{barLabel}</span>
          <span className="text-sm text-green-muted-4 overflow-hidden text-ellipsis whitespace-nowrap block">
            {barDetail}
          </span>
        </div>
        <Link
          href={rsvpHref}
          className="flex-none bg-salmon text-salmon-tint rounded-[3px] px-5 py-[14px] font-display text-base tracking-[0.05em] uppercase hover:bg-salmon-hover"
        >
          {barCta}
        </Link>
      </div>
    </div>
  );
}
