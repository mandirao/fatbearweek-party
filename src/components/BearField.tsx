"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BEARS,
  FILTERS,
  TIER_META,
  NO_RESULTS_NOTE,
  bearPhotoUrl,
  bearTitle,
  getFilteredSortedBears,
  type Bear,
  type BearFilterKey,
  type BearTier,
} from "@/lib/bears";

type Row = { kind: "header"; tier: BearTier; count: number } | { kind: "bear"; bear: Bear; tier: BearTier };

export function BearField({ meBear }: { meBear: string | null }) {
  const [filter, setFilter] = useState<BearFilterKey>("all");
  const [query, setQuery] = useState("");

  const list = useMemo(() => getFilteredSortedBears(filter, query), [filter, query]);
  const noResults = BEARS.length > 0 && list.length === 0;

  const rows = useMemo(() => {
    const out: Row[] = [];
    let seen: BearTier | null = null;
    for (const b of list) {
      const tier = b.tier || "guide";
      if (tier !== seen) {
        seen = tier;
        const count = list.filter((x) => (x.tier || "guide") === tier).length;
        out.push({ kind: "header", tier, count });
      }
      out.push({ kind: "bear", bear: b, tier });
    }
    return out;
  }, [list]);

  const detailHref = (num: number) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    return `/bears/${num}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-3.5 pt-1.5">
      <div className="flex flex-col gap-1.5">
        <div className="font-semibold text-[11px] tracking-[0.22em] text-ink-muted">SCOUTING REPORT</div>
        <h2 className="m-0 font-display text-[30px] leading-[0.95] text-forest uppercase">The field</h2>
        <p className="m-0 text-[15.5px] leading-[1.55] text-ink">
          Get to know the bears profiled by the Brooks River Park Service.{" "}
          <i>Stay tuned for official season before/after photos.</i>
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const selected = f.key === filter;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`min-h-10 inline-flex items-center rounded-full px-3.5 font-sans font-semibold text-sm border cursor-pointer ${
                selected ? "bg-forest text-cream border-forest" : "bg-warm-white text-forest border-border-tan"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a number, name, or fishing spot"
        className="bg-warm-white border border-border-tan rounded p-3 text-base text-forest"
      />

      <div className="flex flex-col gap-2.5">
        {rows.map((row) => {
          if (row.kind === "header") {
            const meta = TIER_META[row.tier];
            return (
              <div key={`header-${row.tier}`} className="flex flex-col gap-1.5 pt-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[11px] tracking-[0.2em] text-ink-muted">{meta.label}</span>
                  <span className="flex-1 h-px bg-border-tan" />
                  <span className="text-xs text-ink-faint">
                    {row.count} {row.count === 1 ? "bear" : "bears"}
                  </span>
                </div>
                {meta.blurb && <div className="text-[13.5px] leading-[1.5] text-ink-muted pb-0.5">{meta.blurb}</div>}
              </div>
            );
          }

          const b = row.bear;
          const tier = row.tier;
          const meta = b.cls + ((b.spots || []).length ? " · " + b.spots.join(", ") : "");
          const note = b.record ? b.record.line : b.note;
          const quiet = tier === "legacy" || tier === "memorial";
          const isMine = !!meBear && meBear === (b.name || "#" + b.num);
          const thumb = quiet ? "size-[74px]" : "size-24";
          const titleSize = quiet ? "text-base" : "text-lg";

          return (
            <Link
              key={b.num}
              href={detailHref(b.num)}
              className={`text-left flex items-stretch gap-3 rounded border overflow-hidden no-underline hover:border-forest ${
                quiet ? "bg-[#FDFAF1]" : "bg-warm-white"
              }`}
              style={{ borderColor: "#DED3BC", borderLeftWidth: 4, borderLeftColor: isMine ? "#C2522E" : "#DED3BC" }}
            >
              {b.photos[0] ? (
                <img
                  src={bearPhotoUrl(b.photos[0])}
                  alt={`Bear ${b.num}${b.name ? ` (${b.name})` : ""} at Brooks River`}
                  loading="lazy"
                  className={`flex-none ${thumb} object-cover bg-tan`}
                />
              ) : (
                <span
                  className={`flex-none ${thumb} bg-forest flex items-center justify-center font-display text-[23px] text-apricot`}
                >
                  {b.num}
                </span>
              )}
              <span className="flex-1 min-w-0 flex flex-col gap-0.5 py-2.5 pr-3">
                <span className="flex items-baseline flex-wrap gap-2">
                  <span className={`font-display ${titleSize} leading-[1.1] text-forest`}>{bearTitle(b)}</span>
                  {b.chip && (
                    <span
                      className="font-bold text-[10px] tracking-[0.16em] rounded-[3px] px-1.5 py-0.5 border"
                      style={{
                        color: b.chip === "IN MEMORIAM" ? "#C2522E" : "#5C564C",
                        borderColor: b.chip === "IN MEMORIAM" ? "#E0B4A2" : "#DED3BC",
                      }}
                    >
                      {b.chip}
                    </span>
                  )}
                </span>
                <span className="text-[13px] text-ink-muted">{meta}</span>
                {b.record && (
                  <span className="flex flex-wrap gap-1.5 py-0.5">
                    {b.record.badges.map((badge) => (
                      <span
                        key={badge}
                        className="bg-forest text-cream rounded px-2 py-1 text-xs font-bold leading-[1.3] whitespace-nowrap"
                      >
                        {badge}
                      </span>
                    ))}
                  </span>
                )}
                <span
                  className="text-sm leading-[1.5] text-ink overflow-hidden text-ellipsis pb-0.5"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: quiet ? 1 : 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {note}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      {noResults && (
        <div className="bg-tan rounded p-[18px] text-[15px] leading-[1.55] text-ink-muted">{NO_RESULTS_NOTE}</div>
      )}
    </div>
  );
}
