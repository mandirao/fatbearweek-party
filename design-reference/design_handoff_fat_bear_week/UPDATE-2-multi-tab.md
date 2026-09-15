# Update prompt 2: Fat Bear Week party app — multi-tab build

Read this AFTER `README.md` (product overview, data model, identity approach) and `UPDATE-2026-09.md` (the invite's copy and layout). This document supersedes both wherever they disagree, and adds two new screens plus a persistent navigation shell.

Reference prototypes in this folder, all current:
- `Fat Bear Week Invite.dc.html` — invite, check-in, RSVP, roster, press box
- `Fat Bear Feast.dc.html` — the potluck tab
- `Bears.dc.html` — the bears tab

These are **design references built in HTML**, not production code. Recreate them in the target codebase's own stack and patterns. Where the prototype fakes a backend with `localStorage`, the real build needs shared server state — several phones will be claiming dishes at the same party.

---

## 1. Persistent navigation (applies to every screen)

A single sticky green header, identical on all pages. Two rows:

**Row 1** — the wordmark `FAT BEAR HQ` (12px/700/0.2em, `#E8A87C`, 40px min-height, links to the invite). On the invite only, double-clicking it opens the Press Box; on that page the row also holds the `PRESS BOX` link, shown **only** when the URL carries `?host` or `#host`.

**Row 2** — four equal-width tabs above a `1px solid #2C5240` top border, each 46px min-height, 12px/600/0.12em:

| Tab | Target |
|---|---|
| INVITE | invite view |
| ROSTER | roster view |
| POTLUCK | the feast page |
| BEARS | the bears page |

Inactive tabs are `#9FBBA9` (hover `#FBF4E4`) with a transparent 3px bottom border. The active tab is `#FBF4E4` with a `#C2522E` 3px bottom border. In the prototype, INVITE and ROSTER are view-state buttons while POTLUCK and BEARS are page links; in production all four are routes (`/`, `/roster`, `/potluck`, `/bears`).

**Identity bar** — directly beneath the nav on every page, when a guest is identified: `#EFE6D2` ground, `1px solid #DED3BC` bottom border, `padding: 0 20px`, space-between. Left: "Signed in as **{name}**" (14px, `#5C564C`, name in `#1F3B2C`). Right: a "Not you?" link (14px, `#2F6B7A`, 44px min-height — the link's own height sets the bar's height, so do not add vertical padding to the bar). Nothing else goes in this bar — an earlier version appended bear and dish status and it was cut for being too busy.

**Signed-out prompt** — on the potluck and bears pages only, replacing the identity bar when nobody is identified: a full-width `#C2522E` link, `2px solid #A84322` bottom border, `padding: 13px 20px`, cream text — "Browse freely — **check in on the invite** to claim something." / "…to pick a bear." with a → at the right. Browsing is never gated; only claiming is.

---

## 2. Changes to the invite

**Removed:** the map link, the add-to-calendar row, the two coming-soon tiles (potluck/bracket), and the "DECLARE A BEAR" card that used to sit on the RSVP screen. The nav now carries that navigation. Do not reintroduce any of them.

**Scouting Department** is down to a single link card — "Bears of Brooks River ↗" → `https://files.explore.org/files/Brown-Bears-of-Brooks-Camp-ebook.pdf`. See the spoiler policy in §5.

**Bullets** are now two (the costume bullet was removed along with its jump link):
- **No homework required.** Bear profiles, before/after photos and scouting material provided. Fill out as much—or as little—of the bracket as you want.
- **Bring a +1!** Friends, spouses, singles, cousins and fellow bear enthusiasts welcome.

**Game Details** rows are now: When — `Friday, October 2 · 7:00 PM`; Where — `Denver, CO`; Brackets lock — `9:00 PM sharp`.

**Intro copy** (verbatim, one paragraph):
> I stinkin' love Fat Bear Week, so naturally this calls for a party. Come scout some extremely large Alaskan bears, make questionably informed bracket picks, eat salmon-adjacent food, and compete for eternal glory—and possibly **The Golden Salmon.** Love, Mandi

**RSVP screen** is now just the yes/no pair and the guest stepper (0–6 additional guests, 44×44 steppers, no helper line beneath). Its "Done" button goes to the **roster**, not back to the invite.

**Roster** gains a card above the lists, shown when the signed-in guest has RSVP'd yes:
- Header bar: `YOU'RE ON THE ROSTER`
- Line: "You're down for {one|N heads}, bringing {dish}." or "…{one|N heads}. Next up: pick a dish for the feast."
- A salmon CTA link to the potluck: `CLAIM A DISH` or `CHANGE MY DISH` (Archivo Black 15px, uppercase, cream on `#C2522E`, hover `#A84322`, with a → at the right)

Roster rows no longer print "solo" for guests with no plus-ones — only "+N guest(s)" when `extraGuests > 0`, otherwise nothing.

**Your Status** keeps the `TEAM {BEAR}` pill and gains a nudge row above its buttons, for yes-guests: a `#EFE6D2` link to the potluck reading "Claim a dish for the feast" or "You're bringing {dish}", with a `#C2522E` →.

---

## 3. New screen: the potluck ("Fat Bear Feast")

The chosen direction of three explored — a **menu**, not a form. Courses, dotted leaders, one claim per person.

### Layout, top to bottom
1. **Masthead**, centered, `2px solid #1F3B2C` bottom border: eyebrow `KATMAI PLAYOFFS · OCTOBER 2` (11px/600/0.22em, `#5C564C`); H1 "Fat Bear / Feast" (Archivo Black 36px/0.92, uppercase); then "Pick a food thing to bring. Some require cooking. Some require buying gummy bears and accepting praise." (16px, max-width 320px)
2. **DRINKS card** — `#1F3B2C`, radius 4px, padding 16px. Eyebrow `DRINKS` + flexing `#3A5A48` rule. Then, at 17px/500 cream: "BYO wine, beer, cider, or batch cocktail to share." and at 14.5px `#C5D3C6`: "Please bring a drink *and* claim a dish, below." **This card is deliberately first** — the host does not want it missed.
3. **The brief** — `#F5EDDC` card, 15px: "**The brief:** salmon, smoke, brine, berries, dark fruit, mushroom, nuts, honey, chocolate, butterscotch — plus anything bear-, fish-, or forest-shaped."
4. **Effort key** — centered row, 15px `#5C564C`: `🛒 Buy it` · `👩‍🍳 Make it` · `🤡 Commit to the bit`
5. **Five courses** of menu rows (below)
6. **Sticky bottom bar** (below)

### Course headers
A baseline row: label (12px/700/0.18em), a flexing `#DED3BC` hairline, then a count ("4 open" / "all claimed", 13.5px). THE MEAL's label turns `#C2522E` while any of its dishes are unclaimed; the others stay `#5C564C`. Host-locked items never count toward "open".

### Menu rows
Each row is a full-width button, `border-bottom: 1px solid #EFE6D2`, laid out as a column:
- **Line 1**: dish name (16px/600) · a flexing `1px dotted #CFC5B0` leader (nudged up 4px to sit on the baseline) · the effort emoji(s) (13.5px)
- **Line 2**: the description (14px, `#5C564C`), omitted entirely when empty
- **Line 3**: a **claim pill** — `min-height: 34px`, `padding: 0 12px`, radius 3px, 13.5px/700/0.08em, uppercase. This started as italic text and was changed because the claim affordance was too quiet; it must read as a button.

| State | Pill text | Ground | Border | Ink |
|---|---|---|---|---|
| Open, signed in | `TAP TO CLAIM` | `#C2522E` | `#C2522E` | `#FFF8EA` |
| Open, signed out | `CHECK IN TO CLAIM` | `#C2522E` | `#C2522E` | `#FFF8EA` |
| Yours | `YOURS — TAP TO RELEASE` | `#1F3B2C` | `#1F3B2C` | `#FBF4E4` |
| Someone else's | `{NAME} IS BRINGING THIS` | transparent | `#DED3BC` | `#5C564C` |
| Host's | `MANDI HAS THIS COVERED` | transparent | `#DED3BC` | `#5C564C` |

Row grounds: transparent when open, `#EFE6D2` (radius 3px, padding `10px 12px`) when yours, `#F5EDDC` when host-locked. Claimed-by-others rows dim the dish name to `#5C564C`.

### Claim rules
- **One dish per person.** Claiming a second releases the first in the same tap — no release-then-choose.
- Tapping your own row releases it.
- Tapping someone else's row does nothing.
- Host-locked rows are `disabled` with `cursor: default`.
- Tapping any row while signed out routes to check-in.

### Sticky bottom bar
- **Has a dish**: `#1F3B2C` bar — eyebrow `YOU'RE BRINGING` (`#E8A87C`) over the dish name (14.5px cream, ellipsed), plus a "Pick something else" button (transparent, `1px solid #3A5A48`, 44px min-height).
- **Signed in, no dish**: `#EFE6D2` bar — "{N} dishes still open. Pick one above."
- Both pad for the home indicator: `padding-bottom: calc(12px + env(safe-area-inset-bottom))`.

### Host-owned items
`Salmon Centerpiece` and `Dessert Centerpiece` appear **on the menu** (first in THE MEAL and first in SOMETHING SWEET) attributed to the host, with no description — her name is the whole point. They are not claimable and not counted. The separate "HOST TERRITORY" footer block was removed once they were on the menu; do not restore it.

### The twenty claimable items + five courses

```js
// n: 0 and 21 are host-locked (host: true)
const ITEMS = [
  { n: 0,  name: "Salmon Centerpiece", desc: "", eff: "👩‍🍳", host: true },
  { n: 1,  name: "Salmon Dip + Accoutrements", desc: "Dip + crackers, dippin' veg, capers, etc.", eff: "👩‍🍳" },
  { n: 2,  name: "Something Hearty from the Riverbank", desc: "A substantial savory casserole, grain dish, savory pie, etc.", eff: "👩‍🍳" },
  { n: 3,  name: "Something Smoky", desc: "Smoked cheese, dip, trout, BBQ, etc.", eff: "👩‍🍳" },
  { n: 4,  name: "Bear Food, But Make It Dinner", desc: "Vegetarian w/ squash, roots, mushrooms, grains, greens, etc.", eff: "👩‍🍳" },
  { n: 5,  name: "Forest Floor Salad", desc: "Dark greens, nuts, berries, roasted veg, etc.", eff: "👩‍🍳" },
  { n: 6,  name: "Hibernation Carb", desc: "Potatoes, rice, pasta, flatbread, stuffing, etc.", eff: "👩‍🍳" },
  { n: 7,  name: "Something Pickled / Briny", desc: "Pickles, olives, capers, conservas, marinated things, etc.", eff: "🛒 / 👩‍🍳" },
  { n: 8,  name: "Dark Fruit + Berry Forage", desc: "Berries, figs, plums, cherries, grapes, pomegranate, etc.", eff: "🛒 / 👩‍🍳" },
  { n: 9,  name: "Something Nutty", desc: "Spiced nuts, nut brittle, smoked almonds, hazelnut fluff, etc", eff: "🛒 / 👩‍🍳" },
  { n: 10, name: "Tiny Tree Branches", desc: "Pretzel sticks. Literally.", eff: "🛒" },
  { n: 11, name: "Tree / Log / Forest Object", desc: "Chocolate logs, edible rocks, haribo berries, etc.", eff: "🤡" },
  { n: 12, name: "Salmon-Shaped Food", desc: "Goldfish, pastry, sandwiches, unnecessary molding.", eff: "🤡" },
  { n: 13, name: "Bear-Shaped Food", desc: "Cookies, Teddy Grahams, sandwiches, cheese cutouts, etc.", eff: "🤡" },
  { n: 14, name: "A Bag of Gummy Bears", desc: "That's the whole assignment.", eff: "🛒" },
  { n: 15, name: "Something Honeyed", desc: "Honeycomb, honey butter, cheese + honey, cake, etc.", eff: "🛒 / 👩‍🍳" },
  { n: 16, name: "Something Butterscotch / Caramel-Brown", desc: "Blondies, caramel corn, pudding, candy, etc.", eff: "🛒 / 👩‍🍳" },
  { n: 17, name: "Something Chocolatey + Brown-Bear Colored", desc: "Brownies, bark, cookies, truffles, mousse, etc.", eff: "🛒 / 👩‍🍳" },
  { n: 18, name: "Bear Bait", desc: "Snack mix, chips, cheesy things, etc.", eff: "🛒 / 👩‍🍳" },
  { n: 19, name: "Brooks River", desc: "A fun nonalcoholic drink.", eff: "🛒 / 👩‍🍳" },
  { n: 20, name: "Wild Bear Card", desc: "Anything gloriously on-theme.", eff: "🛒 / 👩‍🍳 / 🤡" },
  { n: 21, name: "Dessert Centerpiece", desc: "", eff: "👩‍🍳", host: true }
];

const COURSES = [
  { label: "THE MEAL",          ns: [0, 1, 2, 3, 4, 5, 6] },
  { label: "THE SPREAD",        ns: [7, 8, 9, 18] },
  { label: "SOMETHING SWEET",   ns: [21, 15, 16, 17] },
  { label: "TO POUR",           ns: [19] },
  { label: "COMMIT TO THE BIT", ns: [10, 11, 12, 13, 14, 20] }
];
```

The item list and the course grouping are **editorial data the host edits each year** — not hardcoded markup.

---

## 4. New screen: the bears tab

Bear allegiance moved off the RSVP screen onto its own tab so guests can declare or switch any time. The tab is labelled **BEARS** (it was "BRACKET"); the bracket itself lives here, locked, and the rest of the page unlocks when it opens.

### Layout
1. **Masthead** — eyebrow `KATMAI PLAYOFFS · 2026`; H1 "Pick / your bear" (Archivo Black 36px/0.92, uppercase); then: "Allegiance is free, non-binding, and has no bearing on the bracket. It exists so we can talk trash before the field is even announced."
2. **YOUR BEAR card** — bordered card, header bar `YOUR BEAR`, white body:
   - When declared: a `#1F3B2C` panel with `TEAM {BEAR}` (Archivo Black 19px, cream) and an "Undeclare" button (transparent, `1px solid #3A5A48`, 44px).
   - When not: "Nothing declared yet. Pick one of the usual suspects, or name any bear you like." (or, signed out, "Check in on the invite first, then pick a bear here.")
   - **Chips**: Grazer · Chunk · 747 · Holly · Undecided — pills, radius 999px, `min-height: 44px`, `padding: 0 17px`, 15px/600. Selected: `#1F3B2C` / cream. Unselected: white / `#1F3B2C` / `#DED3BC` border. Tapping the selected chip undeclares. **Chip list is per-season data, not fixed.**
   - **Free text**: input (placeholder "Or type a bear (128, Holly, 856…)", 16px — never smaller, or iOS zooms) + a `SET` button.
   - Footer: "Not sure yet? [Read up on the bears ↗] or wait for the bracket reveal." → the NPS ebook.
3. **WHO'S BACKING WHOM** — shown when at least one guest has declared. Bordered card listing each bear, sorted by backer count descending then alphabetically: a salmon Archivo Black count, the team name (16px/600), and the backers' names joined with commas (14px, `#5C564C`). This is what gives the tab a reason to exist before the bracket drops.
4. **THE BRACKET · LOCKED** — `#122019` card. Header row: eyebrow `THE BRACKET`, flexing `#2A4335` rule, `LOCKED` (`#9FB3A4`). Body: a diagonally striped panel (`repeating-linear-gradient(135deg, #1C3226 0 8px, #16281E 8px 16px)`) centering "Opens September 18" (Archivo Black 21px, `#EFE6D2`) and "Katmai reveals the contenders and the bracket that afternoon. Picks open here the moment it drops, and lock at 9:00 PM on October 2." (14.5px, `#C5D3C6`, max-width 280px). **No link** — see §5.

Declaring writes `Guest.bear` on the shared guest record, so it surfaces in the invite's Your Status pill, the roster's `TEAM {BEAR}` line, and the press box's `IN · {bear}` status.

---

## 5. Spoiler policy (a real product requirement, not a nicety)

The host does not want guests able to learn the Fat Bear Week outcome before the party. Every path to official results has been deliberately removed:

- **No link anywhere** to `nps.gov/katm/learn/fat-bear-week.htm` or any official bracket/voting/results page.
- The **Bearcam Wiki** link was removed — fan pages document past and current winners.
- The **Bracket Reveal** row in the invite's broadcast schedule keeps its date and description but carries **no URL**; it renders "Watch party TBD — no spoilers before Oct 2" as plain text. An event with an empty `url` must render as text, never a dead link.
- The **event-replays playlist** link was removed — a winner-announcement replay would land there.
- What remains: the NPS "Bears of Brooks River" ebook (profiles only, no competition), the Brooks Live Chat channel, and the five non-results bearcam events (poster workshop, Q&A, two play-by-plays, the Saxton chat).

Treat this as a constraint on the whole app, including any future bracket feature: results enter the app only when the host enters them.

---

## 6. Mobile requirements (carried forward, still binding)

- Body text 16–17px; secondary 14–15px; labels 11–12px; **nothing below 11px**.
- **Every text input at least 16px** — smaller triggers iOS Safari zoom-on-focus with no zoom back out.
- **Every interactive element at least 44px tall**, including bare text links. Use `min-height: 44px` with `display: inline-flex; align-items: center` rather than vertical padding — padding gets tuned away in later edits, `min-height` survives.
- Sticky bottom bars pad for the home indicator.
- **Contrast 4.5:1 minimum** for text under ~19px. Two lessons learned the hard way:
  - `#7A7266` only clears 4.5:1 on the lightest cream. On `#F5EDDC`, `#EFE6D2` or a darker canvas it fails. `#5C564C` is the safe tertiary ink everywhere; prefer it.
  - The moss `#7A8B4A` sits at mid-luminance, so **no** ink clears 4.5:1 against it. It is a costume swatch only — never a ground for text. `#5A6733` works with cream.
- The one accepted exception, used throughout: `#C2522E` with cream (~4.2–4.4:1) is the established action pairing and is intentional.

---

## 7. Shared state

Three things live per guest: RSVP status + headcount, bear allegiance, and potluck claim. The prototype splits them across two `localStorage` keys (`fbw2026.rsvps.v1` holding `{guests, meId}`, and `fbw2026.potluck.v1` holding `{itemId: guestName}`), which is why the pages each re-read and re-derive. **In production this is one guest record per party**:

```
Guest { id, name, status: "yes"|"no"|null, extraGuests: 0-6, bear: string|null, dishId: number|null }
```

A dish claim is a guest→item pointer, so the one-dish-per-person rule and the "who has this" lookup both fall out of it. Claims need a uniqueness constraint on `dishId` — two phones claiming the same dish at once should give the second one a clear "someone just took this" result, not a silent overwrite. The device stores only `meId`; everything else is server state.

---

## 8. Still unbuilt

**The bracket.** Guests make picks per matchup (partial ballots allowed), the host enters official winners, the app scores progressively (early round 1pt, next 2, semifinal 4, champion 10) with one numeric tiebreaker per ballot, ranks ballots, and names a Golden Salmon champion. Picks lock at 9:00 PM on Oct 2. Support a fallback mode where only Final Four / runner-up / champion are predicted, in case the official bracket isn't out in time. The Bears tab is where it lands.
