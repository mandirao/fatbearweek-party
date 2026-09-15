# Update 3 — Bear Guide inside the Bears tab

Supersedes the Bears tab described in `README.md`. Everything else in that document
(identity model, tabs, potluck, roster) is unchanged.

## What this is

A digital version of the National Park Service ebook *Bears of Brooks River: A Photographic
Guide to the Lives of Katmai's Brown Bears* (Katmai National Park and Preserve, designed and
written by Michael Fitz), folded into the existing Bears tab — plus Fat Bear Week competitive
history for the bears people actually argue about.

It is a **design reference built in HTML**. Recreate it in the target codebase's environment
using that codebase's patterns; do not ship the HTML. Fidelity is **high** — colors, type,
spacing, and copy are final.

## Files in this bundle

| File | What it is |
| --- | --- |
| `Bears.dc.html` | The design. Open it in a browser to see the real thing. |
| `bears-data.json` | The content model — 42 bear records. |
| `photos/` | 91 JPEGs — 82 from the source PDF, 8 from the NPS Fat Bear Week 2022 page. |
| `support.js` | Runtime for the prototype only. Not part of the design. |
| `CONTENT-AND-ASSETS.md` | **Content, data model, image paths, provenance, and known gaps.** |
| `YOUR-BEAR-MODULE.md` | **The allegiance module above the guide — now a single text field.** |

Everything about the data shape, where the text came from, how the image paths are wired, and
what will break if you move them lives in `CONTENT-AND-ASSETS.md`. Read it before touching the
assets. This document is the design spec only.

## Screen 1 — The Field (list)

Sits inside the existing Bears tab, below the "Your Bear" card, under a `SCOUTING REPORT` /
"The field" header.

**Controls, in order:**
1. Filter pills — All bears / Adult males / Adult females / Subadults / Fat Bear record.
   Single select, default All. 40px min-height, `border-radius: 999px`, selected = `#1F3B2C`
   fill with `#FBF4E4` text, unselected = white with `#DED3BC` border.
2. Search input — matches number, name, class, fishing spots, note text, and record line/badges.
   Substring, case-insensitive. 16px font (prevents iOS zoom), `#DED3BC` border, 4px radius.

**Sort is tier-first, then record-holders ahead of the rest within a tier:**

| Tier | Header | Members |
| --- | --- | --- |
| `current` | CURRENT CONTENDERS | 128, 32, 901, 151, 856, 747, 435, 480 |
| `guide` | THE FIELD AT BROOKS RIVER | the other 19 ebook bears |
| `legacy` | DEEP LORE | 409, 6, 16, 24, 211, 218, 234, 247, 420, 489, 634, 755, 814, 864 |
| `memorial` | IN MEMORIAM | 402 |

Section headers are inline rows in the list, not sticky: an 11px/0.2em uppercase label in
`#5C564C`, a 1px `#DED3BC` rule filling the remaining width, and a right-aligned count
("8 bears"). Below it, a 13.5px `#5C564C` blurb — one line of framing per section. Headers
recompute against the filtered/searched result set: filter to Adult females and you get the
same four headers with different counts, and empty sections disappear.

**Card anatomy** (a single `<button>`, whole card tappable):

- Container: white, 1px `#DED3BC` border, 4px radius, `border-left: 4px solid` — `#DED3BC`
  normally, `#C2522E` when this is the user's bear. Hover: border `#1F3B2C`.
- Thumbnail: square, `object-fit: cover`, flush to the card's left edge. 96px normal tiers,
  74px quiet tiers. When the bear has no photo, a `#1F3B2C` square with the bear number in
  Archivo Black 23px `#E8A87C`.
- Title: Archivo Black. 18px normal, 16px quiet. `"480 · Otis"` when named, `"Bear 747"` when not.
- Chip (optional, baseline-aligned beside the title): 10px/0.16em uppercase, 1px border, 3px
  radius. LEGEND is `#5C564C` on `#DED3BC` border; IN MEMORIAM is `#C2522E` on `#E0B4A2`.
- Meta: 13px `#5C564C`, sentence case — `"Adult Male · The Lip, Jacuzzi"`. Spots omitted when empty.
  **Do not uppercase this line** — uppercase + letterspacing is reserved for app chrome.
- Record badges (when `record` exists): dark green pills, `#1F3B2C` on `#FBF4E4`, 12px/700,
  4px radius, `white-space: nowrap`. The nowrap matters — the emoji and the year split lines without it.
- Note: 14px, `line-height: 1.5`, `#38352E`, clamped with `-webkit-line-clamp` **plus
  `text-overflow: ellipsis`** — 2 lines normal, 1 line quiet. Shows `record.line` when the bear
  has a record, otherwise `note`.

**Quiet treatment** (`legacy` + `memorial`): 74px thumb, 16px title, 1-line note, card background
`#FDFAF1` instead of white. Everything else identical. These are **not** disabled, dimmed, or
low-contrast — the goal is "optional deep lore," not "obsolete data."

**Empty state:** when a search returns nothing — `#EFE6D2` panel, 4px radius, 18px padding,
telling the user the guide is a sample of regulars and they can still back any bear by typing
the name above.

## Screen 2 — Bear profile (detail)

Replaces the list in place (same tab, same scroll container). The app header and identity banner
stay; the list is unmounted.

**Sub-header** (sticky below the main nav, `top: 86px`, `#1F3B2C`): a "← The field" button in
`#E8A87C` on the left, and a position counter on the right — "3 of 42", counted against the
*current filtered list*, not the whole set.

**Hero:** full-bleed `photos[0]`, natural aspect. Bottom-anchored gradient
(`rgba(10,18,14,0.9)` → transparent) carrying the name in Archivo Black 32px `#FBF4E4`, and
below it a row with the class in 13px/0.16em `#E8A87C` plus the chip (if any) in a hairline
`rgba(251,244,228,0.45)` outline. When there is no photo: a 200px band of 135° 10px stripes
(`#1C3226` / `#16281E`) with the bear number in Archivo Black 86px `#26402F` — a watermark, not
a broken-image state.

**Body, in order** (18px gap, 20px side padding):

1. **FISHES** row — an 11px/0.18em label followed by `spots` as tan pills (`#EFE6D2`, `#DED3BC`
   border, 999px). Entire row hidden when `spots` is empty.
2. **Why legend** note — only for `chip: "LEGEND"`. `#EFE6D2` panel, 3px `#E8A87C` left rule,
   right corners rounded. Explains the specific reason that bear is labeled (tenure, dominance).
   Copy is per-bear; four exist (6, 16, 24, 864).
3. **In memoriam** note — same construction, `#C2522E` rule and label. 402 only.
4. **FAT BEAR RECORD** card — only when `record` exists. `#1F3B2C` header bar with the label in
   12px/0.16em; white body holding the badge pills (14px, nowrap), then `record.line` in
   Archivo Black 17px `#C2522E`, then `record.detail` paragraphs at 15.5px.
5. **Primary CTA** — full-width, 52px, 4px radius, Archivo 700 16px. Three labels:
   - no bear declared: "Back Otis" — `#1F3B2C` fill, `#FFF8EA` text
   - a different bear declared: "Change your bear to Otis" — same fill
   - this bear declared: "You're backing Otis — tap to undo" — `#C2522E` fill, `#A84322` border
   - signed out: "Check in to back a bear", routes to the invite
6. **ID MARKS AND HINTS** — `#C2522E` 12px/0.18em label, paragraphs at 16px/1.6 `#38352E`.
7. **Secondary photo** + caption, when `photos[1]` exists. 13px `#5C564C` caption noting that
   coats darken and bodies fill out across the season.
8. **LIFE HISTORY** — same treatment as ID marks.
9. **Credit line** — 1px `#DED3BC` top rule, 13px `#5C564C`. Two variants, chosen by whether the
   record has a `page`: ebook records name *Bears of Brooks River* plus the page number; the four
   Fat Bear Week records name Fat Bear Week 2022 and append their per-photo `credits`.
10. **Prev / next** — two equal buttons, 48px, labeled with the adjacent bears' names. They walk
    the **filtered** list and wrap around. Both scroll to top on navigate.

The "no ebook page" fallback panel and the number-watermark hero are both still in the design
but currently unreachable — every record has photos and text. Keep them: bears added from a
future bracket may arrive before their photos do.

## Briefings

Three collapsible cards below the field, one open at a time (accordion). White, 1px `#DED3BC`,
4px radius; 52px header row with a 15px/700 title and a `+` / `–` in `#C2522E`; body holds an
optional image then paragraphs at 15.5px/1.6.

1. **The Brooks River** — image `photos/p4_1.jpg` (the Brooks Falls panorama), three paragraphs
   on why the river concentrates bears and who fishes where.
2. **Quick facts: how many bears?** — no image, three paragraphs on counts, return rates, and
   the upward trend.
3. **An introduction to brown bears** — image `photos/p7_1.jpg`, three paragraphs on species,
   calories, and how to identify one.

Copy lives in the logic class as `BRIEFS`; move it into content storage.

## Behavior and state

| State | Type | Notes |
| --- | --- | --- |
| `bears` | array | Fetched from `bears-data.json` on mount. Static content — cache it. |
| `filter` | string | Filter pill key. Default `"all"`. |
| `query` | string | Search box. |
| `openNum` | int / null | Which bear's profile is open. `null` = list. Scroll resets to top on change. |
| `briefOpen` | string / null | Which briefing is expanded. |
| `guests`, `meId` | existing | From `fbw2026.rsvps.v1`, unchanged from the main README. |

Backing a bear writes `bear` onto the current guest record in `fbw2026.rsvps.v1` — the same field
the Roster tab reads. The list card's left border and the CTA state both derive from it. Signed-out
users can browse everything; any attempt to back a bear routes to the invite to check in first.

The four filters and the search compose (filter AND query). `openNum` survives filter changes,
which is why the counter and prev/next are computed against the live filtered list.

## Design tokens (unchanged from the main README, listed for convenience)

```
#16291F  page surround          #1F3B2C  primary green (headers, fills, CTA)
#FBF4E4  app background         #FFF     card white
#FDFAF1  quiet card white       #EFE6D2  tan panel
#DED3BC  hairline border        #38352E  body text
#5C564C  secondary text         #8A8275  tertiary (counts)
#C2522E  rust accent            #A84322  rust border
#E8A87C  warm highlight on dark #122019 / #26402F  photo well, watermark
```

Type: Archivo (400/500/600/700) and Archivo Black. Body 15.5–16px/1.55–1.6. Labels 10–12px with
0.14–0.22em tracking, uppercase — **chrome only**. Radius 4px everywhere, 999px for pills.
Minimum tap target 44px; 52px for the primary CTA.

## Assets, content, and known gaps

See `CONTENT-AND-ASSETS.md`.
