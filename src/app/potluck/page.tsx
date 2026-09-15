import Link from "next/link";
import { getMeId } from "@/lib/identity";
import { getGuest, getAllGuests } from "@/lib/guests";
import { POTLUCK_ITEMS, POTLUCK_COURSES, HOST, findPotluckItem } from "@/lib/potluck";
import { claimDishAction } from "@/lib/actions";

export default async function PotluckPage({
  searchParams,
}: {
  searchParams: Promise<{ taken?: string }>;
}) {
  const { taken } = await searchParams;
  const meId = await getMeId();
  const me = meId ? await getGuest(meId) : null;
  const allGuests = await getAllGuests();

  const dishOwner = new Map<number, string>();
  allGuests.forEach((g) => {
    if (g.dishId != null) dishOwner.set(g.dishId, g.name);
  });

  const myItem = findPotluckItem(me?.dishId);
  const openCount = POTLUCK_ITEMS.filter((i) => !i.host && !dishOwner.has(i.n)).length;

  return (
    <div className="flex flex-col">
      {!me && (
        <Link
          href="/checkin"
          className="bg-salmon border-b-2 border-salmon-hover px-5 py-[13px] flex items-center justify-between gap-3 no-underline"
        >
          <span className="text-[14.5px] leading-[1.4] text-salmon-tint">
            Browse freely — <strong>check in on the invite</strong> to claim something.
          </span>
          <span className="flex-none font-bold text-sm text-salmon-tint">→</span>
        </Link>
      )}

      <div className="px-5 pt-[22px] pb-[30px] flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2.5 border-b-2 border-forest pb-[18px]">
          <h1 className="m-0 font-display text-[36px] leading-[0.92] text-forest uppercase">The Feast</h1>
          <p className="m-0 text-base leading-[1.55] text-ink max-w-[320px]">
            Pick a food thing to bring. Some suggest cooking. Some require buying gummy bears and accepting praise.
          </p>
        </div>

        {taken === "1" && (
          <div className="bg-tan border border-border-tan rounded-[3px] px-3.5 py-3 text-[14px] text-ink-muted">
            Someone just took that — pick another.
          </div>
        )}

        <div className="bg-sand rounded p-3.5 text-[15px] leading-[1.55] text-ink">
          <strong className="text-forest">The brief:</strong> salmon, smoke, brine, berries, dark fruit, mushroom,
          nuts, honey, chocolate, butterscotch — plus anything bear-, fish-, or forest-shaped.
        </div>

        <div className="bg-forest rounded p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] tracking-[0.2em] text-apricot">DRINKS</span>
            <span className="flex-1 h-px bg-green-rule" />
          </div>
          <p className="m-0 text-[17px] leading-[1.5] text-cream font-medium">
            BYO wine, beer, cider, or batch cocktail to share.
          </p>
          <p className="m-0 text-[14.5px] leading-[1.5] text-green-muted-4">
            Please bring a drink <em>and</em> claim a dish, below.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[15px] text-ink-muted">
          <span>🛒 Buy it</span>
          <span>👩‍🍳 Make it</span>
          <span>🤡 Commit to the bit</span>
        </div>

        {POTLUCK_COURSES.map((course) => {
          const items = course.ns.map((n) => POTLUCK_ITEMS.find((i) => i.n === n)!);
          const openN = items.filter((i) => !i.host && !dishOwner.has(i.n)).length;
          const labelColor = course.label === "THE MEAL" && openN ? "text-salmon" : "text-ink-muted";

          return (
            <div key={course.label} className="flex flex-col gap-2.5">
              <div className="flex items-baseline gap-2.5">
                <span className={`font-bold text-xs tracking-[0.18em] ${labelColor}`}>{course.label}</span>
                <span className="flex-1 h-px bg-border-tan" />
                <span className="text-[13.5px] text-ink-muted">{openN ? `${openN} open` : "all claimed"}</span>
              </div>

              {items.map((item) => {
                const ownerName = item.host ? HOST : dishOwner.get(item.n);
                const mine = !item.host && ownerName === me?.name;
                const disabledRow = item.host || (!!ownerName && !mine);

                const rowBg = item.host ? "bg-sand" : mine ? "bg-tan" : "";
                const rowPad = item.host || mine ? "rounded-[3px] px-3 py-2.5" : "py-[7px]";
                const nameColor = ownerName && !mine ? "text-ink-muted" : "text-forest";

                const pillLabel = item.host
                  ? `${HOST.toUpperCase()} HAS THIS COVERED`
                  : mine
                    ? "YOURS — TAP TO RELEASE"
                    : ownerName
                      ? `${ownerName.toUpperCase()} IS BRINGING THIS`
                      : me
                        ? "TAP TO CLAIM"
                        : "CHECK IN TO CLAIM";
                const pillClasses = mine
                  ? "bg-forest border-forest text-cream"
                  : ownerName
                    ? "bg-transparent border-border-tan text-ink-muted"
                    : "bg-salmon border-salmon text-salmon-tint";

                return (
                  <form key={item.n} action={claimDishAction}>
                    <input type="hidden" name="dishId" value={item.n} />
                    <button
                      type="submit"
                      disabled={disabledRow}
                      className={`flex flex-col gap-[3px] w-full border-none border-b border-tan text-left font-sans ${rowBg} ${rowPad} ${
                        disabledRow ? "cursor-default" : "cursor-pointer"
                      }`}
                    >
                      <span className="flex items-baseline gap-2 w-full">
                        <span className={`text-base font-semibold leading-[1.35] ${nameColor}`}>{item.name}</span>
                        <span className="flex-1 min-w-[14px] border-b border-dotted border-[#CFC5B0] -translate-y-1" />
                        <span className="flex-none text-[13.5px] text-ink-muted">{item.eff}</span>
                      </span>
                      {item.desc && <span className="text-sm leading-[1.4] text-ink-muted">{item.desc}</span>}
                      <span
                        className={`self-start mt-[3px] inline-flex items-center min-h-[17px] px-1.5 rounded-[3px] border text-[11px] font-bold tracking-[0.04em] ${pillClasses}`}
                      >
                        {pillLabel}
                      </span>
                    </button>
                  </form>
                );
              })}
            </div>
          );
        })}
      </div>

      {myItem && (
        <div className="sticky bottom-0 z-10 bg-forest border-t-2 border-spruce px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex items-center gap-3">
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="font-bold text-[11px] tracking-[0.16em] text-apricot">YOU&apos;RE BRINGING</span>
            <span className="text-[14.5px] text-cream overflow-hidden text-ellipsis whitespace-nowrap block">
              {myItem.name}
            </span>
          </div>
          <form action={claimDishAction}>
            <input type="hidden" name="dishId" value={myItem.n} />
            <button className="flex-none bg-transparent text-green-muted-4 border border-green-rule rounded-[3px] min-h-11 px-4 font-sans font-semibold text-sm cursor-pointer hover:bg-spruce">
              Pick something else
            </button>
          </form>
        </div>
      )}

      {me && !myItem && (
        <div className="sticky bottom-0 z-10 bg-tan border-t-2 border-forest px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex items-center">
          <span className="text-[14.5px] text-ink-muted">{openCount} dishes still open. Pick one above.</span>
        </div>
      )}
    </div>
  );
}
