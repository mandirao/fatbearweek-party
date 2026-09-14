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
  thumb?: string;
  link?: string;
};

const youtubeCam = (badge: string, name: string, id: string): Cam => ({
  badge,
  name,
  src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1`,
  thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
});

export const CAMS: Cam[] = [
  youtubeCam("CAM 01", "Brooks Falls", "J7ZrIDvqlic"),
  youtubeCam("CAM 02", "River Watch", "wkVLYfU-Kew"),
  youtubeCam("CAM 03", "The Riffles", "z7_GhJeFxQI"),
  youtubeCam("CAM 04", "Kat's River View", "cTsjMtjRLCo"),
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
