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
  { badge: "CAM 01", name: "Brooks Falls Low", src: "https://www.youtube.com/embed/EwTH5yY7Mks" },
  { badge: "CAM 02", name: "Brooks Falls Salmon Cam", link: "https://explore.org/livecams/brown-bears/brown-bear-salmon-cam-brooks-falls" },
  { badge: "CAM 03", name: "Lower River", link: "https://explore.org/livecams/brown-bears/brown-bear-salmon-cam-brooks-falls" },
  { badge: "CAM 04", name: "Underwater", link: "https://explore.org/livecams/brown-bears/brown-bear-salmon-cam-brooks-falls" },
  { badge: "CAM 05", name: "Dumpling Mountain", link: "https://explore.org/livecams/brown-bears/brown-bear-salmon-cam-brooks-falls" },
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
