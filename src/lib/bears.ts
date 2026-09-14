import bearsData from "@/data/bears.json";

export type BearClass = "Adult Male" | "Adult Female" | "Subadult Male" | "Subadult Female";
export type BearTier = "current" | "guide" | "legacy" | "memorial";
export type BearChip = "LEGEND" | "IN MEMORIAM" | null;

export type BearRecord = {
  badges: string[];
  line: string;
  detail: string[];
};

export type Bear = {
  num: number;
  name: string;
  cls: BearClass;
  page: number | null;
  photos: string[];
  spots: string[];
  since: string | null;
  note: string;
  life: string[];
  id: string[];
  tier: BearTier;
  chip: BearChip;
  noBook?: boolean;
  record?: BearRecord;
};

export const BEARS: Bear[] = bearsData as Bear[];

export const TIER_ORDER: BearTier[] = ["current", "guide", "legacy", "memorial"];

export const TIER_META: Record<BearTier, { label: string; blurb: string }> = {
  current: {
    label: "LIKELY CONTENDERS",
    blurb: "The cast of the last few brackets—champions, runners-up, and the ones people argue about.",
  },
  guide: {
    label: "THE FIELD AT BROOKS RIVER",
    blurb: "Other regulars. How to tell them apart and where they fish.",
  },
  legacy: {
    label: "DEEP LORE",
    blurb: "Legends from the guide. Gone from the bracket, not our hearts.",
  },
  memorial: {
    label: "IN MEMORIAM",
    blurb: "",
  },
};

export type BearFilterKey = "all" | "Adult Male" | "Adult Female" | "sub" | "record";

export const FILTERS: { key: BearFilterKey; label: string }[] = [
  { key: "all", label: "All bears" },
  { key: "Adult Male", label: "Adult males" },
  { key: "Adult Female", label: "Adult females" },
  { key: "sub", label: "Subadults" },
  { key: "record", label: "Fat Bear record" },
];

export const LEGEND_WHY: Record<number, string> = {
  6: "Classified as an adult in 1988 and seen at Brooks River for more than twenty straight years. Even in old age he displaced younger males from the top of the falls.",
  16: "Also classified as an adult male in 1988, and one of the oldest bears ever known at Brooks — he returned every single year after.",
  24: "For a decade he was the largest and most dominant bear on the river, hyper-dominant enough to have been observed killing other bears.",
  864: "The bear who displaced 24 as the dominant bear at Brooks in 2006 and 2007 — the one fight that changed the hierarchy.",
};

export const MEMORIAL_NOTE = "No longer on the river. This page stays in the guide.";

export const NOT_IN_BOOK_NOTE =
  "This bear rose to fame after the Park Service guide was published, so there's no ID page for them here — photos and marks arrive with Katmai's bracket post.";

export const SECOND_PHOTO_CAPTION =
  "Another look from the guide. Coats darken and bodies fill out as the season goes on, so the same bear can look like two.";

export const NO_RESULTS_NOTE =
  "No bear by that name in the book. The guide is a sample of regulars, not a complete roster — type any bear into Your Bear above to back them anyway.";

export type Brief = {
  key: string;
  title: string;
  img: string | null;
  paras: string[];
};

export const BRIEFS: Brief[] = [
  {
    key: "river",
    title: "The Brooks River",
    img: "photos/p4_1.jpg",
    paras: [
      "Because it is one of the first streams in the region where bright, energetic, and pre-spawned salmon are available to bears, the Brooks River hosts one of the greatest seasonal concentrations of brown bears anywhere on earth.",
      "Early in the salmon run, Brooks Falls creates a temporary barrier to migrating salmon, making it a particularly successful fishing spot. The lip, the jacuzzi, and the far pool are the prime seats, and adult males dominate them.",
      "In July, the riffles below the falls are fished most often by less dominant bears and females with offspring. The cut bank suits bears that are not tolerant of people. During late summer and fall, bears concentrate in the lower half of the river, fishing for dead and dying salmon.",
    ],
  },
  {
    key: "facts",
    title: "Quick facts: how many bears?",
    img: null,
    paras: [
      "From late June through July, the annual cumulative total of independent bears identified regularly using Brooks River has ranged from 43 to 70. From September into early October, that total has ranged from 45 to 59. Another 5 to 10 transient bears are typically documented in each period.",
      "The same bears come back. In 2008, 59 of the 70 independent bears identified in July were recognized from previous years, as were 35 of the 52 identified in fall. Most of the bears not recognized were subadults.",
      "Numbers have trended up over two decades, credited to sustained work minimizing bear-human conflict, strong regional salmon runs averaging 1.8 million fish escapement in the Naknek drainage, and mild weather.",
    ],
  },
  {
    key: "intro",
    title: "An introduction to brown bears",
    img: "photos/p7_1.jpg",
    paras: [
      "The only bears in Katmai are brown bears. Taxonomists consider brown bears and grizzlies the same species; in North America, brown bears are the ones with access to coastal food sources like salmon runs, while grizzlies live further inland.",
      "Bears are eating machines. Survival depends on taking in enough calories across spring, summer, and fall to last the denning period. Hearing and vision are roughly equivalent to ours; smell, many times better than a dog's, is what sets them apart.",
      "To identify one: look for the rounded, dish-shaped face and the prominent shoulder hump, a mass of muscle that black and polar bears lack. Coats range from blonde to dark brown and tend to darken with age and with the season. A wild brown bear averages 20 years, though bears over thirty have been documented.",
    ],
  },
];

export function bearPhotoUrl(path: string): string {
  return `/bears/${path}`;
}

export function bearLabel(bear: Bear): string {
  return bear.name ? bear.name : "#" + bear.num;
}

export function bearTitle(bear: Bear): string {
  return bear.name ? bear.num + " · " + bear.name : "Bear " + bear.num;
}

export function getBear(num: number): Bear | null {
  return BEARS.find((b) => b.num === num) ?? null;
}

function tierRank(bear: Bear): number {
  const idx = TIER_ORDER.indexOf(bear.tier || "guide");
  return idx === -1 ? TIER_ORDER.indexOf("guide") : idx;
}

export function getFilteredSortedBears(filter: BearFilterKey, query: string): Bear[] {
  const q = (query || "").trim().toLowerCase();

  return BEARS.slice()
    .sort((a, b) => tierRank(a) - tierRank(b) || (b.record ? 1 : 0) - (a.record ? 1 : 0))
    .filter((b) => {
      const clsOk =
        filter === "all"
          ? true
          : filter === "record"
            ? !!b.record
            : filter === "sub"
              ? b.cls.startsWith("Subadult")
              : b.cls === filter;
      if (!clsOk) return false;
      if (!q) return true;

      const rec = b.record ? b.record.line + " " + b.record.badges.join(" ") + " champion" : "";
      const haystack = [String(b.num), b.name, b.cls, (b.spots || []).join(" "), b.note, rec].join(" ").toLowerCase();
      return haystack.indexOf(q) >= 0;
    });
}
