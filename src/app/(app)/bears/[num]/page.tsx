import Link from "next/link";
import { notFound } from "next/navigation";
import { getMeId } from "@/lib/identity";
import { isArchived } from "@/lib/archive";
import { getGuest } from "@/lib/guests";
import { toggleBearChipAction } from "@/lib/actions";
import {
  FILTERS,
  LEGEND_WHY,
  MEMORIAL_NOTE,
  NOT_IN_BOOK_NOTE,
  SECOND_PHOTO_CAPTION,
  bearLabel,
  bearPhotoUrl,
  bearTitle,
  getBear,
  getFilteredSortedBears,
  type BearFilterKey,
} from "@/lib/bears";

function isFilterKey(value: string | undefined): value is BearFilterKey {
  return !!value && FILTERS.some((f) => f.key === value);
}

function withParams(path: string, filter: BearFilterKey, query: string) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (query.trim()) params.set("q", query.trim());
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export default async function BearDetailPage(props: PageProps<"/bears/[num]">) {
  const { num: numParam } = await props.params;
  const searchParams = await props.searchParams;

  const num = Number(numParam);
  const bear = Number.isFinite(num) ? getBear(num) : null;
  if (!bear) notFound();

  const rawFilter = Array.isArray(searchParams.filter) ? searchParams.filter[0] : searchParams.filter;
  const rawQuery = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  let filter: BearFilterKey = isFilterKey(rawFilter) ? rawFilter : "all";
  let query = rawQuery || "";

  let list = getFilteredSortedBears(filter, query);
  let idx = list.findIndex((b) => b.num === bear.num);
  if (idx === -1) {
    filter = "all";
    query = "";
    list = getFilteredSortedBears(filter, query);
    idx = list.findIndex((b) => b.num === bear.num);
  }

  const prev = idx > 0 ? list[idx - 1] : idx === 0 ? list[list.length - 1] : null;
  const next = idx >= 0 ? list[(idx + 1) % list.length] : null;
  const counter = idx >= 0 ? `${idx + 1} of ${list.length}` : "";

  const meId = await getMeId();
  const me = meId ? await getGuest(meId) : null;

  const backing = bearLabel(bear);
  const isBacked = !!me && me.bear === backing;
  const ctaLabel = !me
    ? "Check in to back a bear"
    : isBacked
      ? `You're backing ${backing} — tap to undo`
      : me.bear
        ? `Change your bear to ${backing}`
        : `Back ${backing}`;

  const inBook = !bear.noBook;
  const isLegend = bear.chip === "LEGEND";
  const isMemorial = bear.chip === "IN MEMORIAM";

  return (
    <div className="flex flex-col">
      <div className="sticky top-[88px] z-[4] bg-forest px-3 flex items-center gap-1.5">
        <Link
          href={withParams("/bears", filter, query)}
          className="text-apricot font-sans font-semibold text-sm min-h-11 inline-flex items-center px-1.5 no-underline"
        >
          ← The field
        </Link>
        <span className="flex-1" />
        {counter && <span className="text-xs tracking-[0.14em] font-semibold text-green-muted">{counter}</span>}
      </div>

      <div className="relative bg-cam-bg min-h-[180px]">
        {bear.photos[0] ? (
          <img
            src={bearPhotoUrl(bear.photos[0])}
            alt={`Bear ${bear.num}${bear.name ? ` (${bear.name})` : ""} at Brooks River`}
            className="block w-full h-auto"
          />
        ) : (
          <div
            className="h-[200px] flex items-center justify-center"
            style={{ backgroundImage: "repeating-linear-gradient(135deg, #1C3226 0 10px, #16281E 10px 20px)" }}
          >
            <span className="font-display text-[86px] leading-none" style={{ color: "#26402F" }}>
              {bear.num}
            </span>
          </div>
        )}
        <div
          className="absolute left-0 right-0 bottom-0 pt-7 px-4.5 pb-3.5"
          style={{ backgroundImage: "linear-gradient(to top, rgba(10,18,14,0.9), rgba(10,18,14,0))" }}
        >
          <div className="font-display text-[32px] leading-none text-cream">{bearTitle(bear)}</div>
          <div className="mt-1.5 flex items-center flex-wrap gap-2">
            <span className="font-semibold text-[13px] tracking-[0.16em] text-apricot">{bear.cls.toUpperCase()}</span>
            {bear.chip && (
              <span
                className="font-bold text-[10px] tracking-[0.16em] text-cream rounded-[3px] px-[7px] py-[3px] border"
                style={{ borderColor: "rgba(251,244,228,0.45)" }}
              >
                {bear.chip}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-[30px] flex flex-col gap-[18px]">
        {bear.spots.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-[11px] tracking-[0.18em] text-ink-muted pr-0.5">FISHES</span>
            {bear.spots.map((spot) => (
              <span key={spot} className="bg-tan border border-border-tan rounded-full px-3 py-1.5 text-[13px] font-semibold text-forest">
                {spot}
              </span>
            ))}
          </div>
        )}

        {isLegend && LEGEND_WHY[bear.num] && (
          <div className="rounded-r border-l-[3px] pl-3.5 pr-3.5 py-3.5 flex flex-col gap-1.5 bg-tan" style={{ borderLeftColor: "#E8A87C" }}>
            <span className="font-bold text-[11px] tracking-[0.18em] text-forest">WHY LEGEND</span>
            <span className="text-[15px] leading-[1.55] text-ink">{LEGEND_WHY[bear.num]}</span>
          </div>
        )}

        {isMemorial && (
          <div className="rounded-r border-l-[3px] border-salmon pl-3.5 pr-3.5 py-3.5 flex flex-col gap-1.5 bg-tan">
            <span className="font-bold text-[11px] tracking-[0.18em] text-salmon">IN MEMORIAM</span>
            <span className="text-[15px] leading-[1.55] text-ink">{MEMORIAL_NOTE}</span>
          </div>
        )}

        {bear.record && (
          <div className="border-2 border-forest rounded overflow-hidden">
            <div className="bg-forest text-cream px-3 py-2.5 font-bold text-xs tracking-[0.16em]">FAT BEAR RECORD</div>
            <div className="bg-warm-white p-3.5 flex flex-col gap-2.5">
              <div className="flex flex-wrap gap-1.5">
                {bear.record.badges.map((badge) => (
                  <span key={badge} className="bg-forest text-cream rounded px-[11px] py-[7px] text-sm font-bold leading-[1.2] whitespace-nowrap">
                    {badge}
                  </span>
                ))}
              </div>
              <div className="font-display text-[17px] leading-[1.2] text-salmon">{bear.record.line}</div>
              {bear.record.detail.map((p, i) => (
                <p key={i} className="m-0 text-[15.5px] leading-[1.6] text-ink">
                  {p}
                </p>
              ))}
            </div>
          </div>
        )}

        {isArchived() ? null : me ? (
          <form action={toggleBearChipAction}>
            <input type="hidden" name="bear" value={backing} />
            <button
              className={`w-full min-h-[52px] rounded font-sans font-bold text-base tracking-[0.06em] border-2 cursor-pointer ${
                isBacked ? "bg-salmon text-salmon-tint border-salmon-hover" : "bg-forest text-salmon-tint border-forest"
              }`}
            >
              {ctaLabel}
            </button>
          </form>
        ) : (
          <Link
            href="/checkin"
            className="w-full min-h-[52px] rounded font-sans font-bold text-base tracking-[0.06em] border-2 bg-forest text-salmon-tint border-forest flex items-center justify-center no-underline"
          >
            {ctaLabel}
          </Link>
        )}

        {inBook ? (
          <div className="flex flex-col gap-2.5">
            <div className="font-bold text-xs tracking-[0.18em] text-salmon">ID MARKS AND HINTS</div>
            {bear.id.map((p, i) => (
              <p key={i} className="m-0 text-base leading-[1.6] text-ink">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <div className="bg-tan rounded p-4 text-[15px] leading-[1.55] text-ink-muted">{NOT_IN_BOOK_NOTE}</div>
        )}

        {bear.photos[1] && (
          <figure className="m-0 flex flex-col gap-1.5">
            <img
              src={bearPhotoUrl(bear.photos[1])}
              alt={`Bear ${bear.num}${bear.name ? ` (${bear.name})` : ""} at Brooks River`}
              className="block w-full h-auto rounded"
            />
            <figcaption className="text-[13px] leading-[1.4] text-ink-muted">{SECOND_PHOTO_CAPTION}</figcaption>
          </figure>
        )}

        {inBook && (
          <>
            <div className="flex flex-col gap-2.5">
              <div className="font-bold text-xs tracking-[0.18em] text-salmon">LIFE HISTORY</div>
              {bear.life.map((p, i) => (
                <p key={i} className="m-0 text-base leading-[1.6] text-ink">
                  {p}
                </p>
              ))}
            </div>

            <div className="border-t border-border-tan pt-3.5 text-[13px] leading-[1.5] text-ink-muted">
              {bear.page != null ? (
                <>
                  Text and photographs from <em>Bears of Brooks River</em>, National Park Service, Katmai National
                  Park and Preserve. Page {bear.page}.
                </>
              ) : (
                <>
                  Description, biography and photographs from Fat Bear Week 2022, National Park Service, Katmai
                  National Park and Preserve. Photos {(bear.credits ?? []).join("; ")}.
                </>
              )}
            </div>
          </>
        )}

        <div className="flex gap-2.5">
          <Link
            href={prev ? withParams(`/bears/${prev.num}`, filter, query) : "#"}
            className="flex-1 bg-warm-white border border-border-tan rounded min-h-12 flex items-center justify-center font-sans font-semibold text-[15px] text-forest no-underline hover:border-forest"
          >
            {prev && `← ${bearLabel(prev)}`}
          </Link>
          <Link
            href={next ? withParams(`/bears/${next.num}`, filter, query) : "#"}
            className="flex-1 bg-warm-white border border-border-tan rounded min-h-12 flex items-center justify-center font-sans font-semibold text-[15px] text-forest no-underline hover:border-forest"
          >
            {next && `${bearLabel(next)} →`}
          </Link>
        </div>
      </div>
    </div>
  );
}
