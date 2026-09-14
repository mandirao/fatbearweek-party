export const PARTY = {
  title: "Fat Bear\nWeek",
  dateEyebrow: "FRI · OCT 2",
  subtitle: "COMPETING FOR THE GOLDEN SALMON",
  whenLabel: "Friday, October 2 · 7:00 PM",
  whenShort: "Oct 2, 7:00 PM",
  addressLine: "Denver, CO",
  mapUrl: "https://maps.google.com/?q=Denver+CO",
  bracketLockLabel: "9:00 PM sharp",
};

export const SITE_URL = "https://fatbear.sprigbo.com";

export const WHATSAPP_URL = "https://chat.whatsapp.com/REVOKED";

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
    desc: "Campaign-poster nerdery with explore.org + Katmai.",
    url: "https://www.youtube.com/live/NFHcGluF2To",
  },
  {
    iso: "2026-09-14T17:00:00-04:00",
    day: "MON",
    date: "14",
    title: "Bear Cam Q&A",
    times: "5p ET · 2p PT",
    desc: "Mike Fitz + rangers answer audience questions.",
    url: "https://www.youtube.com/live/Vbqot4I9nDk",
  },
  {
    iso: "2026-09-15T16:00:00-04:00",
    day: "TUE",
    date: "15",
    title: "Play by Play Live Broadcast",
    times: "4p ET · 1p PT",
    desc: "Live commentary from Brooks River.",
    url: "https://www.youtube.com/live/3M5Tulym4_U",
  },
  {
    iso: "2026-09-16T19:00:00-04:00",
    day: "WED",
    date: "16",
    title: "Live Chat with Dr Michael Saxton",
    times: "7p ET · 4p PT",
    desc: "Current + future bear research at Katmai.",
    url: "https://www.youtube.com/live/Gh42FGyak6k",
  },
  {
    iso: "2026-09-17T17:00:00-04:00",
    day: "THU",
    date: "17",
    title: "Play by Play Live Broadcast",
    times: "5p ET · 2p PT",
    desc: "Live commentary from Brooks River.",
    url: "https://www.youtube.com/live/UW5Z_Kglz3Q",
  },
  {
    iso: "2026-09-18T15:00:00-04:00",
    day: "FRI",
    date: "18",
    title: "Fat Bear Week Bracket Reveal",
    big: true,
    times: "3p ET · 12p PT · 11a AK",
    desc: "Meet the gloriously fat 2026 contenders.",
    url: "https://www.youtube.com/live/dhDQHjOgfIc",
  },
];

export function upcomingBroadcastEvents(now = Date.now()): BroadcastEvent[] {
  return BROADCAST_EVENTS.filter((e) => new Date(e.iso).getTime() + 2 * 3600e3 > now);
}

// Spoiler policy: no link anywhere to official Fat Bear Week voting/results pages
// or fan pages documenting past/current winners. Only the profile ebook remains.
export const SCOUTING_LINKS = [
  {
    href: "https://files.explore.org/files/Brown-Bears-of-Brooks-Camp-ebook.pdf",
    title: "Bears of Brooks River ↗",
    desc: "Official Park Service profiles, IDs and life histories.",
  },
];
