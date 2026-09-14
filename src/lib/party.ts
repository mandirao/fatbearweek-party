export const PARTY = {
  title: "Fat Bear\nWeek",
  subtitle: "COMPETING FOR THE GOLDEN SALMON",
  whenLabel: "Friday, October 2 · 7:00 PM",
  whenShort: "Oct 2, 7:00 PM",
  addressLine: "Denver, CO",
  mapUrl: "https://maps.google.com/?q=Denver+CO",
  bracketLockLabel: "9:00 PM sharp",
};

export const SITE_URL = "https://fatbear.sprigbo.com";

export const BEAR_CHIPS = ["Grazer", "Chunk", "747", "Holly", "Undecided"];

export type Cam = {
  badge: string;
  name: string;
  src?: string;
  link?: string;
};

export const CAMS: Cam[] = [
  { badge: "CAM 01", name: "Brooks Falls", src: "https://www.youtube.com/embed/J7ZrIDvqlic" },
  { badge: "CAM 02", name: "River Watch", src: "https://www.youtube.com/embed/wkVLYfU-Kew" },
  { badge: "CAM 03", name: "The Riffles", src: "https://www.youtube.com/embed/z7_GhJeFxQI" },
  { badge: "CAM 04", name: "Kat's River View", src: "https://www.youtube.com/embed/cTsjMtjRLCo" },
];

export const SCOUTING_LINKS = [
  {
    href: "https://files.explore.org/files/Brown-Bears-of-Brooks-Camp-ebook.pdf",
    title: "Bears of Brooks River ↗",
    desc: "Official Park Service profiles, IDs and life histories.",
  },
  {
    href: "https://katmai-bearcams.fandom.com/wiki/Bear_Book_~_The_Bearcam_Wiki_Edition",
    title: "The Bearcam Wiki bear book ↗",
    desc: "Fan-maintained bear lore. Deep, uneven, delightful.",
  },
  {
    href: "https://www.nps.gov/katm/learn/fat-bear-week.htm",
    title: "Katmai's Fat Bear Week page ↗",
    desc: "Official bracket, dates and voting.",
  },
];
