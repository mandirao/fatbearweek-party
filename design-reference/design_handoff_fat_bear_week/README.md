# Handoff: Fat Bear Week Party App

## Overview
A single-link party app for a Fat Bear Week draft-night party. The host texts one URL to guests. A guest opens it, reads the party details, identifies themselves from a name list (no authentication), RSVPs yes or no, sets how many additional guests they're bringing, and optionally declares a bear allegiance. They can reopen the same link later and change any of it. The host has a private view of all responses.

Two features are stubbed as "coming soon" tiles and are expected in later phases: a **potluck claim sheet** (guests claim items from a curated list of on-theme foods) and a **bracket competition** (guests make Fat Bear Week bracket picks, the host enters official winners, the app scores ballots progressively and crowns a Golden Salmon champion).

## About the Design Files
The file in this bundle is a **design reference created in HTML** — a working prototype that shows the intended look, copy, and behavior. It is **not production code to copy directly**. It is a "Design Component" file: a single HTML document with an inline template and a small JavaScript logic class, with all styling written as inline styles. Persistence is `localStorage` only; there is no backend.

The task is to **recreate this design in the target codebase's environment** — React, Next.js, Vue, SwiftUI, whatever is already established — using that codebase's patterns, component library, and styling approach. If no codebase exists yet, choose an appropriate stack. A small server-backed app (e.g. Next.js + a hosted Postgres/SQLite, or Supabase) is a good fit, because the real product needs RSVPs shared across devices, which the prototype fakes with `localStorage`.

Open the HTML file directly in a browser to interact with the prototype.

## Fidelity
**High fidelity.** Colors, typography, spacing, copy, and interaction states are final and intentional. Recreate the UI closely, adapting only where the target platform's conventions demand it. All hex values, font sizes, and copy strings in this document are exact.

The visual direction is "vintage wilderness sporting club" — Katmai National Park × old-school summer camp × collegiate playoffs. Roughly 75% warm autumnal lodge, 25% sports-broadcast nonsense. Forest green and cream dominate; rusty salmon is the action color; river blue is for links only.

## Data Model

```
Party        { id, title, subtitle, whenISO, addressLine, mapUrl, bracketLockTime }
Guest        { id, name, status: "yes" | "no" | null, extraGuests: 0-6, bear: string | null }
```

- `status: null` means invited but hasn't answered (or has withdrawn).
- `extraGuests` is guests **in addition to** the person. Headcount for a guest = `1 + extraGuests`.
- `bear` is free text; the UI offers five quick chips.
- The guest list is seeded by the host and grows: a visitor not on the list can add their own name, which creates a new Guest.

### Identity (deliberately not authentication)
There is no login. A visitor picks their name from the roster (or adds themselves), and that choice is stored client-side (`localStorage`, key `fbw2026.rsvps.v1`, shape `{ guests: Guest[], meId: string | null }`). Returning to the link restores their identity so they see and can edit their own RSVP. "Not you?" clears `meId` and returns to the check-in screen.

In a server-backed build, keep the same UX but move guests to the database and store only `meId` (or a signed guest cookie) on the device. Accept the tradeoff explicitly: anyone with the link can answer as anyone. That is intended for this party.

### Host access
The Press Box (host view) is hidden. It appears in the nav only when the URL carries `?host` (or `#host`); double-clicking the "FAT BEAR HQ" wordmark also navigates to it. In production, replace with a separate unguessable host URL or a simple shared secret — it does not need real auth, but it should not be reachable by accident.

## Screens / Views

The app is one 440px-max-width column centered on a dark green page (`#16291F`), cream card background (`#FBF4E4`), `min-height: 100vh`, `box-shadow: 0 0 60px rgba(0,0,0,0.35)`. It is a phone-first layout; on desktop it stays a centered column.

### Persistent chrome (all views)

**Top nav** — sticky, `background #1F3B2C`, padding `12px 18px`, space-between.
- Left: "FAT BEAR HQ" — 11px, weight 700, letter-spacing 0.2em, `#E8A87C`. Click → invite. Double-click → press box.
- Right: "ROSTER" (11px/600/0.14em, `#9FBBA9`, hover `#FBF4E4`), and "PRESS BOX" with the same styling, rendered only when the host flag is set.

**Check-in strip** — shown only when a guest is identified. `background #EFE6D2`, bottom border `1px solid #DED3BC`, padding `9px 18px`.
- Left, 12.5px `#5C564C`: "Checked in as **{name}**{tagline}" where tagline is ` · in`, ` · in · Team {bear}`, ` · out`, or ` · no answer yet`.
- Right: "Not you?" text link, 12.5px, `#2F6B7A`, underlined.

---

### 1. Invite (default view)

**Masthead** — `background #1F3B2C`, padding `6px 20px 26px`, gap 10px.
- Eyebrow row: "KATMAI PLAYOFFS" (10px/600/0.2em, `#E8A87C`), a 1px `#3A5A48` rule that flexes to fill, then "2026" in the same type.
- H1: "Fat Bear<br>Week" — Archivo Black, 46px, line-height 0.88, letter-spacing -0.02em, uppercase, `#FBF4E4`.
- Badge: "COMPETING FOR THE GOLDEN SALMON" — `background #C2522E`, `#FFF8EA`, 12px/600/0.1em, padding `7px 12px`, radius 2px, uppercase, self-start.

**Body** — padding `22px 20px 28px`, vertical flex, gap 22px between blocks.

1. **Intro paragraph** — 15px/1.6, `#38352E`:
   "I stinkin' love Fat Bear Week, so naturally this calls for a party."
   "Come scout some extremely large Alaskan bears, make questionably informed bracket picks, eat salmon-adjacent food, and compete for eternal glory—and possibly **The Golden Salmon**." ("The Golden Salmon" is bold, `#C2522E`.)

2. **Game Details table** — 2px `#1F3B2C` border, radius 4px, overflow hidden.
   - Header bar: `#1F3B2C` bg, `#FBF4E4` text, 11px/600/0.14em, padding `10px 12px`: "GAME DETAILS"
   - Rows alternate `#FFF` / `#F5EDDC`, padding 12px, 14px text, label `#7A7266` left, value weight 500 right-aligned:
     - When — "Friday, October 2 · 7:00 PM"
     - Where — "Denver, CO" with a second line link "Open in Maps ↗" (13px, `#2F6B7A`) to `https://maps.google.com/?q=Denver+CO`
     - Brackets lock — "9:00 PM sharp"

3. **Bullet list** — three items, gap 9px, 14px/1.5 `#38352E`. Each: a 6px `#C2522E` dot (`margin-top: 7px`, `flex: none`) + text, gap 10px.
   - "**No homework required.** Bear profiles, before/after photos and scouting material provided. Fill out as much—or as little—of the bracket as you want."
   - "**Bring a +1!** Friends, spouses, singles, cousins and fellow bear enthusiasts welcome."
   - "**Costumes encouraged.** [See below](#costume)." — anchor jumps to the costume block, which carries `scroll-margin-top: 70px` to clear the sticky nav.

4. **Live cam carousel** ("LIVE FROM KATMAI") — `background #122019`, radius 4px.
   - Header row, padding `12px 14px 10px`: 7px `#C2522E` dot, "LIVE FROM KATMAI" (10px/700/0.2em, `#E8A87C`), flexing 1px `#2A4335` rule, then the current cam label (10px/600/0.14em, `#6E8578`) formatted "CAM 01 · Brooks Falls Low".
   - Stage: 16:9 box (`padding-top: 56.25%`, absolutely positioned child).
     - If the selected cam has an embed URL: a borderless iframe, `allow="autoplay; encrypted-media; picture-in-picture"`, allowFullScreen.
     - Otherwise: a diagonal striped panel (`repeating-linear-gradient(135deg, #1C3226 0 8px, #16281E 8px 16px)`) centering the cam label (11px/700/0.18em, `#EFE6D2`), the line "This feed doesn't embed. Watch it on explore.org." (12.5px, `#B4C4B6`, max-width 260px), and an "Open the cam ↗" link (12.5px/600, `#7FB4C0`).
   - Thumbnail rail: horizontal scroll, gap 8px, padding `12px 14px`. Each item is 132px wide: a 56px striped tile (`repeating-linear-gradient(135deg, #1C3226 0 6px, #16281E 6px 12px)`) with a 2px border — `#C2522E` when selected, `#3A5244` otherwise — holding the badge text bottom-left (10px/700/0.12em), plus the cam name below (11.5px/1.25). Text is `#EFE6D2` when selected, `#A9BCAD` otherwise.
   - Footnote, padding `0 14px 14px`, 12px `#A9BCAD`: "Cams are seasonal — if a feed is dark, it's the off-season." + link "All Katmai cams on explore.org ↗" (`#7FB4C0`).
   - Cam data (see Assets for URLs): CAM 01 Brooks Falls Low (embeds), CAM 02 Brooks Falls Salmon Cam, CAM 03 Lower River, CAM 04 Underwater, CAM 05 Dumpling Mountain (link-out).

5. **"Wait, what is Fat Bear Week?" aside** — deliberately quiet: top border `1px solid #DED3BC`, padding-top 16px, no card. Label 10px/600/0.2em `#8A8071`; body 13.5px/1.6 `#6E675B`:
   "Every fall, the brown bears of Katmai National Park in Alaska gorge on salmon before hibernation. Katmai runs a March Madness–style bracket where the public votes, head to head, on which bear got most gloriously fat. It is a real thing. There is a real champion. We are going to take it extremely seriously for one evening."

6. **Scouting Department** — 2px `#1F3B2C` border, radius 4px. Header bar "SCOUTING DEPARTMENT" (same style as Game Details). Body `#FFF`, padding 14px, gap 10px. Intro 13.5px `#5C564C`: "Optional homework for the competitively deranged:". Then three link cards, each `background #F5EDDC`, radius 3px, padding `11px 12px`, no underline: a 14px/600 `#1F3B2C` title and a 12.5px `#6E675B` description.
   - "Bears of Brooks River ↗" — "Official Park Service profiles, IDs and life histories."
   - "The Bearcam Wiki bear book ↗" — "Fan-maintained bear lore. Deep, uneven, delightful."
   - "Katmai's Fat Bear Week page ↗" — "Official bracket, dates and voting."

7. **Costume block** (`id="costume"`) — `background #1F3B2C`, radius 4px, padding 16px.
   - Header: "COSTUME ENCOURAGED" (10px/700/0.2em, `#E8A87C`) + flexing `#3A5A48` rule.
   - Body 14px/1.6 `#EFE6D2`, three paragraphs:
     "Come as a **bear, salmon, tree, river, ranger, wildlife biologist** or suspiciously outdoorsy human."
     "Or just wear **brown, rust, moss, forest green, salmon pink or river blue.**"
     "No purchases required. Commitment to the bit is optional but admired."
   - Swatch row: six 24px squares, radius 2px, gap 6px — `#6B4A2E`, `#C2522E`, `#7A8B4A`, `#2E5B41`, `#E8A87C`, `#2F6B7A`.

8. **Your Status card** — only when a guest is identified. 2px `#1F3B2C` border; header bar "YOUR STATUS"; white body, padding `16px 14px`, gap 12px.
   - Headline, Archivo Black 20px `#1F3B2C`: "{name}, confirmed" / "{name} + {n}, confirmed" / "{name}, out this year" / "{name}, undeclared".
   - Subline, 14px `#5C564C`: "You're on the roster. Brackets lock at 9:00 PM." / "The Golden Salmon will miss you." / "You haven't answered yet."
   - Two equal buttons: "Change it" (solid `#1F3B2C`, `#FBF4E4`, hover `#2C5240`) and "Not you?" (white, 2px `#1F3B2C` border, hover `#F0E8D6`). Both 13px/700/0.06em, radius 3px.

9. **Coming-soon tiles** — two equal tiles, `background #EFE6D2`, `#8A8071`, radius 3px, padding 12px, centered, 10px/600/0.14em: "POTLUCK · SOON" and "BRACKET · SOON". These become the two future features.

10. **Roster link** — text button, 13px `#2F6B7A` underlined: "See who's coming ({yesHeads} confirmed)".

**Sticky RSVP bar** — pinned to the bottom of the invite view (`position: sticky; bottom: 0`), `background #1F3B2C`, top border `2px solid #16291F`, padding `12px 16px`, gap 12px.
- Left column: label 10px/700/0.16em `#E8A87C` — "ONE TAP, NO ACCOUNT" (unidentified) / "YOU HAVEN'T ANSWERED" / "YOU'RE ON THE ROSTER" / "YOU'RE OUT THIS YEAR". Below it, 12.5px `#C5D3C6`, truncated with ellipsis: "Friday, October 2 · 7:00 PM" or "{name} · Oct 2, 7:00 PM" / "{name} + {n} · Oct 2, 7:00 PM".
- Right: primary button, `#C2522E` on `#FFF8EA`, Archivo Black 14px, uppercase, padding `14px 20px`, radius 3px, hover `#A84322`. Label "RSVP" when unanswered, "Change" when answered. Tapping it goes to the RSVP screen, or to check-in first if no identity is set.

---

### 2. Who's this? (check-in)
Padding `24px 20px 30px`, gap 18px.
- Eyebrow "CHECK-IN" (10px/600/0.2em, `#7A7266`); H2 "Who's this?" (Archivo Black 30px, uppercase, `#1F3B2C`); intro 14px `#5C564C`: "No password, no account. Pick your name so the roster knows who just walked in."
- Name list: one button per guest — white, 1px `#DED3BC` border (hover `#1F3B2C`), radius 3px, padding `13px 14px`, space-between. Name 15px/500 `#1F3B2C`; right side shows "IN" or "OUT" (11px/600/0.1em, `#8A8071`) if they've answered. Selecting sets identity and goes to RSVP.
- "NOT ON THE LIST" section above a top border: text input (placeholder "Your name", 15px, 1px `#DED3BC`, radius 3px, padding 13px) plus an "ADD" button (`#1F3B2C` / `#FBF4E4`, 13px/700/0.06em, padding `0 18px`). Adding creates a guest, sets identity, and goes to RSVP. Empty/whitespace names are ignored.
- "Back to the invite" text link.

---

### 3. RSVP
Padding `24px 20px 30px`, gap 20px.
- Eyebrow "ON THE CLOCK"; H2 = the guest's name (Archivo Black 30px, uppercase); subline 14px `#5C564C`: "Friday, October 2 · 7:00 PM · Denver, CO".
- **Yes/No pair**, equal width, gap 8px:
  - "I'm in" — `#C2522E` on `#FFF8EA`, Archivo Black 15px, uppercase, padding `20px 12px`, radius 3px, hover `#A84322`.
  - "Can't make it" — white, 2px `#1F3B2C` border, `#1F3B2C` text, padding `18px 12px`, hover `#F0E8D6`.
  - Choosing "no" resets extraGuests to 0.
- **Guest stepper** — only when status is yes. `background #EFE6D2`, radius 4px, padding 16px. Label "BRINGING ANYONE?" (10px/600/0.18em, `#7A7266`). White row, radius 3px, padding `12px 14px`: "Additional guests" (14px) on the left; on the right a – button, the count in Archivo Black 17px, and a + button (both 36×36, `#F0E8D6`, radius 3px, hover `#E2D7BE`). Range 0–6. Helper line 13px `#6E675B`: "Just you for now — bring a +1, a friend, a cousin, or a fellow bear enthusiast." or "Counting you, that's {n} heads."
- **Declare a bear** — only when status is yes. 2px `#1F3B2C` border, radius 4px. Header "DECLARE A BEAR · OPTIONAL" (the "· OPTIONAL" in `#9FBBA9`). Body padding `0 14px 16px`, gap 12px:
  - Explainer 13.5px `#5C564C`: "Allegiance usually happens after scouting, but if you already have a bear, stake your claim now. You can switch before brackets lock." + link "Read up on the bears ↗" (`#2F6B7A`).
  - Chips, wrapping, gap 6px: Grazer, Chunk, 747, Holly, Undecided. Pill shape (radius 999px), padding `8px 13px`, 12.5px/600. Unselected: white bg, `#1F3B2C` text, 1px `#DED3BC` border. Selected: `#1F3B2C` bg, `#FBF4E4` text. Tapping the selected chip clears the allegiance.
  - Free-text row: input (placeholder "Or type a bear (128, Holly, 856…)") + "SET" button (`#1F3B2C`). Saving trims the value and clears the field.
- **Done / Withdraw** — only when a status exists. "Done" (full-width `#1F3B2C`, 14px/700) returns to the invite. Below it, "Withdraw my RSVP entirely" (13px `#8A8071`, underlined) clears status, extraGuests and bear, and returns to the invite.
- "Not me? Switch name" text link → check-in.

---

### 4. Roster (visible to all guests)
Padding `24px 20px 30px`, gap 20px.
- Eyebrow "THE FIELD"; H2 "Roster".
- Three stat cards, equal width, gap 8px, radius 4px, padding 14px. Number in Archivo Black 26px, label 10px/600/0.14em:
  - Heads expected — `#1F3B2C` bg, `#FBF4E4` number, `#9FBBA9` label. Value = sum of `1 + extraGuests` over yes guests.
  - No reply — `#EFE6D2` bg, `#C2522E` number, `#8A8071` label.
  - Out — `#EFE6D2` bg, `#8A8071` number and label.
- "COMING" list: white rows, 1px `#DED3BC`, radius 3px, padding `12px 14px`. Left column has the name (15px/500 `#1F3B2C`) and, if set, "TEAM {BEAR}" (11px/700/0.1em, `#C2522E`). Right: "solo" or "+{n} guest(s)" (12px `#7A7266`).
- "STILL DECIDING" list: `#F5EDDC` rows, 1px `#E4DAC4`, name in `#6E675B`. (Guests who declined are counted in the stat card but not listed.)
- "Back to the invite" link.

---

### 5. Press Box (host only)
Padding `24px 20px 30px`, gap 20px.
- Eyebrow "HOST ONLY"; H2 "Press box"; summary 14px `#5C564C`: "{heads} expected · {n} ballot(s) · {n} still deciding" — note the singular/plural on "ballot".
- **Response table** — 2px `#1F3B2C` border, radius 4px. Header row `#1F3B2C` / `#FBF4E4`, 10px/600/0.14em: GUEST (flex 1) | STATUS (74px) | HEADS (44px, right). Body rows white, 14px, 1px `#EFE6D2` bottom border. Status reads "IN", "IN · {bear}", "OUT", or "—". Heads shows the number for yes guests, "—" otherwise. Footer row `#EFE6D2`, Archivo Black 14px: "TOTAL EXPECTED" + heads total.
- **Share the link** — `#EFE6D2` card, radius 4px, padding 16px. Label "SHARE THE LINK"; a white field showing the URL (placeholder text in the prototype: `fatbearweek.party/2026`); helper 13px `#6E675B`: "Text it to anyone. They pick their name, or add themselves if they're not listed." In production, show the real invite URL with a copy button and a native share action.
- "Reset all RSVPs" (13px `#8A8071`, underlined) clears status, extraGuests and bear for everyone. Add a confirmation step in production — the prototype has none.

## Interactions & Behavior
- **Navigation** is a single view state: `invite | who | rsvp | roster | host`. No routing in the prototype; use real routes in production (`/`, `/checkin`, `/rsvp`, `/roster`, `/host`).
- **RSVP entry point**: the sticky bar's button goes to `rsvp` if an identity exists, otherwise `who`.
- **Every mutation persists immediately** — no save button. Status, guest count, and bear each write on change.
- **Anchor scroll**: the costume bullet links to `#costume`; the target sets `scroll-margin-top: 70px` for the sticky nav.
- **Hover states**: solid green buttons → `#2C5240`; salmon buttons → `#A84322`; outlined buttons → `#F0E8D6`; stepper buttons → `#E2D7BE`; nav links → `#FBF4E4`; name rows → border `#1F3B2C`.
- **No animations or transitions** are specified. Keep it immediate.
- **Not specified, worth adding in production**: loading and error states for the RSVP write, optimistic UI, an "add to calendar" (.ics) action, and a real share sheet.

## State Management
Prototype state (a single component):
- `view` — current screen.
- `guests` — the full guest array; seeded on first load, then read from `localStorage`.
- `meId` — the identified guest's id, or null.
- `newName` — the check-in "add yourself" input.
- `bearDraft` — the free-text bear input.
- `cam` — index of the selected live cam.
- `hostLink` — whether the URL carried `?host`/`#host`.

Derived values: yes/no/pending partitions, `yesHeads` (sum of `1 + extraGuests` over yes), status headline and subline strings, sticky-bar label/detail/CTA, and the check-in strip tagline.

Production shape: guests and their RSVPs live server-side keyed by party id; the device keeps only the identity. Writes should be a single upsert per guest. Expect concurrent edits from several phones at once — last write wins is acceptable here.

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| Forest green | `#1F3B2C` | Headers, borders, primary buttons, masthead |
| Deep spruce | `#16291F` | Page background behind the column |
| Cam black-green | `#122019` | Live cam panel background |
| Cam stage | `#0B120E` | Behind the iframe |
| Stripe dark / light | `#16281E` / `#1C3226` | Placeholder diagonal stripes |
| Cream | `#FBF4E4` | App background, text on green |
| Warm white | `#FFF` | Table and card rows |
| Sand | `#F5EDDC` | Alternate rows, link cards |
| Tan | `#EFE6D2` | Check-in strip, stat cards, muted tiles |
| Tan pressed | `#E2D7BE` | Stepper hover |
| Border tan | `#DED3BC` | Hairlines, inputs |
| Border tan alt | `#E4DAC4` | Pending row borders |
| Salmon | `#C2522E` | Primary action, bullets, accents |
| Salmon hover | `#A84322` | Primary button hover |
| Salmon tint | `#FFF8EA` | Text on salmon |
| Apricot | `#E8A87C` | Eyebrow labels on green |
| River blue | `#2F6B7A` | Links on cream |
| River blue light | `#7FB4C0` | Links on dark |
| Ink | `#38352E` | Body text |
| Ink muted | `#5C564C`, `#6E675B` | Secondary text |
| Ink faint | `#7A7266`, `#8A8071` | Labels, tertiary text |
| Green muted | `#9FBBA9`, `#A9BCAD`, `#B4C4B6`, `#C5D3C6` | Text on green |
| Green rule | `#3A5A48`, `#2A4335`, `#3A5244` | Rules and inactive borders |
| Green hover | `#2C5240` | Solid green button hover |
| Costume swatches | `#6B4A2E`, `#C2522E`, `#7A8B4A`, `#2E5B41`, `#E8A87C`, `#2F6B7A` | Palette row |

### Typography
Two Google Fonts: **Archivo** (400/500/600/700) for everything, **Archivo Black** for display.
| Role | Spec |
|---|---|
| H1 masthead | Archivo Black 46px / 0.88, -0.02em, uppercase |
| H2 screen title | Archivo Black 30px / 1.0, uppercase |
| Stat number | Archivo Black 26px / 1.0 |
| Status headline | Archivo Black 20px / 1.15 |
| Primary button | Archivo Black 14–16px, 0.05em, uppercase |
| Body | Archivo 14–15px / 1.55–1.6 |
| Secondary body | Archivo 13–13.5px / 1.5–1.6 |
| Section header bar | Archivo 11px / 600, 0.14em |
| Eyebrow label | Archivo 10px / 600–700, 0.18–0.2em |
| Table/meta | Archivo 11–12.5px |

### Spacing & shape
Column max-width 440px. Screen padding `24px 20px 30px`; invite body `22px 20px 28px`. Block gap 22px (invite) / 18–20px (other screens); intra-block gaps 6–12px. Radii: 2px (badge, swatch), 3px (buttons, rows, inputs), 4px (cards), 999px (bear chips). Borders: 2px `#1F3B2C` for structural cards, 1px `#DED3BC` for hairlines. One shadow only: `0 0 60px rgba(0,0,0,0.35)` on the column.

Touch targets: buttons are 36px minimum (steppers are exactly 36×36); primary buttons are ~48px tall.

## Assets
No images or icons. All ornament is CSS: dots, rules, striped gradients, and colored squares. Fonts load from Google Fonts.

External links used in the design:
- Map: `https://maps.google.com/?q=Denver+CO`
- Live cam embed (CAM 01, Brooks Falls Low): `https://www.youtube.com/embed/EwTH5yY7Mks`
- Cam link-outs (CAM 02–05): `https://explore.org/livecams/brown-bears/brown-bear-salmon-cam-brooks-falls`
- Bears of Brooks River ebook: `https://files.explore.org/files/Brown-Bears-of-Brooks-Camp-ebook.pdf`
- Bearcam Wiki bear book: `https://katmai-bearcams.fandom.com/wiki/Bear_Book_~_The_Bearcam_Wiki_Edition`
- Katmai Fat Bear Week: `https://www.nps.gov/katm/learn/fat-bear-week.htm`

**Known issue to resolve during the build:** explore.org does not publish embed URLs and its player may refuse to render in an iframe, so only the YouTube feed is embedded. If more inline feeds are wanted, find the current YouTube live-stream IDs for the Katmai cams (they change season to season) and use `https://www.youtube.com/embed/<id>`. The cam list should be data, not hardcoded markup, so the host can update IDs each year.

## Future phases (design not yet done)
- **Potluck**: host curates a list of on-theme items; guests claim items; claimed items show who took them; a guest can release a claim. Reuse the roster identity.
- **Bracket**: guests make picks per matchup with partial ballots allowed; progressive scoring (early round 1pt, next 2, semifinal 4, champion 10); one numeric tiebreaker per ballot; host enters official winners; the app scores and ranks ballots and names a Golden Salmon champion. Ballots lock at a host-set time. Support a fallback mode where only Final Four / runner-up / champion are predicted, in case the official bracket isn't out by party day.

## Files
- `Fat Bear Week Invite.dc.html` — the complete prototype: all five screens, all copy, all interaction logic. Open it in a browser; the logic class near the bottom of the file holds the state machine, derived values and seed data.
