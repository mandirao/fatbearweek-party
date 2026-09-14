export const PARTY = {
  title: "Fat Bear\nWeek",
  dateEyebrow: "FRI · OCT 2",
  subtitle: "COMPETING FOR THE GOLDEN SALMON",
  whenLabel: "Friday, October 2 · 7:00 PM",
  whenShort: "Oct 2, 7:00 PM",
  addressLine: "Denver, CO",
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

export type BroadcastEvent = {
  iso: string;
  day: string;
  date: string;
  title: string;
  times: string;
  desc: string;
  url: string;
  big?: boolean;
};

export const BROADCAST_EVENTS: BroadcastEvent[] = [
  {
    iso: "2026-09-14T12:00:00-04:00",
    day: "MON",
    date: "14",
    title: "Drawn to Explore — Creating a Fat Bear Campaign Poster",
    times: "12p ET · 9a PT · 8a AK",
    desc: "Campaigning for your Fat Bear Week candidate is a time-honored tradition. Join explore.org's Sara Wolman and Katmai National Park ranger Sarah Bruce as they explore the creative process behind designing a Fat Bear Week campaign poster.",
    url: "https://www.youtube.com/live/NFHcGluF2To",
  },
  {
    iso: "2026-09-14T17:00:00-04:00",
    day: "MON",
    date: "14",
    title: "Bear Cam Q&A",
    times: "5p ET · 2p PT",
    desc: "Mike Fitz and Rangers will be live on camera answering audience questions.",
    url: "https://www.youtube.com/live/Vbqot4I9nDk",
  },
  {
    iso: "2026-09-15T16:00:00-04:00",
    day: "TUE",
    date: "15",
    title: "Play by Play Live Broadcast",
    times: "4p ET · 1p PT",
    desc: "Live commentary on the bear and salmon activity at Brooks River.",
    url: "https://www.youtube.com/live/3M5Tulym4_U",
  },
  {
    iso: "2026-09-16T19:00:00-04:00",
    day: "WED",
    date: "16",
    title: "Live Chat with Dr Michael Saxton, bear biologist at Brooks",
    times: "7p ET · 4p PT",
    desc: "Dr Michael Saxton joins bearcam this week to discuss current and future bear research projects in Katmai. Learn what data is being collected and how the data is used to protect brown bears.",
    url: "https://www.youtube.com/live/Gh42FGyak6k",
  },
  {
    iso: "2026-09-17T17:00:00-04:00",
    day: "THU",
    date: "17",
    title: "Play by Play Live Broadcast",
    times: "5p ET · 2p PT",
    desc: "Live commentary on the bear and salmon activity at Brooks River.",
    url: "https://www.youtube.com/live/UW5Z_Kglz3Q",
  },
  {
    iso: "2026-09-18T15:00:00-04:00",
    day: "FRI",
    date: "18",
    title: "Fat Bear Week Bracket Reveal",
    big: true,
    times: "3p ET · 12p PT · 11a AK",
    desc: "After a summer-long effort, brown bears at Brooks River in Katmai National Park have reached peak fat. Join in as we reveal the contenders and the bracket for the 2026 Fat Bear Week tournament.",
    url: "https://www.youtube.com/live/dhDQHjOgfIc",
  },
];

export function upcomingBroadcastEvents(now = Date.now()): BroadcastEvent[] {
  return BROADCAST_EVENTS.filter((e) => new Date(e.iso).getTime() + 2 * 3600e3 > now);
}

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
