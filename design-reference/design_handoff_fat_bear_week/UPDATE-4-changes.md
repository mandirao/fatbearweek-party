# Update 4 — changes since the last handoff

Applies on top of `UPDATE-3-bear-guide.md`, `CONTENT-AND-ASSETS.md`, and `YOUR-BEAR-MODULE.md`.
Four changes across three tabs. Nothing else moved.

## 1. Four bear records filled in — content is now 42/42

128 Grazer, 32 Chunk, 151 Walker, and 901 had no photo and no description, because the 2009
ebook the guide is built from predates them. They now have both, from the NPS Fat Bear Week 2022
page. **This is a data change, not a redesign** — the screens are unchanged.

**In `bears-data.json`:**

- Those 4 records gained `photos` (2 each), `id`, `life`, `spots`, `since`, and corrected `cls`.
- `noBook` is gone. Only those 4 records ever carried it; it was the flag suppressing their ID
  Marks and Life History sections, and with text present it has no purpose.
- New field **`credits`**, on those 4 records only: a 2-item array of
  `"<date> · <photographer>"`, index-matched to `photos`. NPS credits each of those photos to a
  named photographer, so they need to appear somewhere.
- `photos/` grew from 83 to 91. The 8 new files are named `nps2022_<bearnum>_<n>.jpg`.

**One rendering rule this introduces.** The credit line at the bottom of a profile branches on
whether the record has a `page` — ebook records have one, these four don't:

- `page` present → "Text and photographs from Bears of Brooks River, National Park Service,
  Katmai National Park and Preserve. Page {page}."
- `page` null → "Description, biography and photographs from Fat Bear Week 2022, National Park
  Service, Katmai National Park and Preserve. Photos {credits joined by '; '}."

That is the whole UI delta. No new components, no per-photo overlays.

**Keep the empty-state branches.** The number-watermark hero, the `NO PHOTO YET` thumbnail tile,
and the "no ebook page" fallback panel are all currently unreachable. Bears added from a future
bracket may arrive before their photos do — don't let a dead-code pass eat them.

## 2. Your Bear — declared state is rust, not green

The `TEAM {NAME}` panel inside the Your Bear card was the same dark green as its own header bar,
so the most important piece of state on the tab was camouflaged. It is now the app's rust accent.

| Element | Was | Now |
| --- | --- | --- |
| Panel fill | `#1F3B2C` | `#C2522E` |
| Bear name | `#FBF4E4` | `#FFF8EA` |
| "Undeclare" text | `#C5D3C6` | `#FFE8DC` |
| "Undeclare" border | `#3A5A48` | `#DE8465` |
| "Undeclare" hover fill | `#16291F` | `#A84322` |

Everything else about the module is unchanged — see `YOUR-BEAR-MODULE.md`. The declared panel now
matches the profile CTA's "you're backing this bear" state, which was already rust. Rust means
one thing across the app: *this is your commitment.*

## 3. Potluck — brief moved above Drinks

Order within the Fat Bear Feast tab's content column is now:

1. Intro (eyebrow, "Fat Bear Feast", the "Pick a food thing to bring" line)
2. **The brief** — `#F5EDDC` panel listing the flavor palette (salmon, smoke, brine, berries…)
3. Drinks — dark green panel, BYO
4. Legend (🛒 Buy it / 👩‍🍳 Make it / 🤡 Commit to the bit)
5. The claimable dish list

The brief was below Drinks, which meant guests hit a BYO instruction before they understood what
kind of food the party wanted. No styling changed — the block moved.

## 4. Invite — Scouting Department collapsed to a link

Was a bordered card with a green header bar, a line of intro copy, and an inset tile linking to
the ebook PDF — roughly 150px for one link. The Bears tab now holds the whole guide, so the card
is redundant.

Now a single tappable row: 2px `#1F3B2C` border, 4px radius, white fill, 14px/16px padding,
flex row with a 12px gap.

- Eyebrow: `SCOUT THE COMPETITION`, 12px/700, 0.14em tracking, `#C2522E`
- Body: 15px/1.5 `#38352E` — "Optional homework for the competitively deranged: 42 bear profiles,
  Park Service IDs and life histories."
- Trailing `→` in 16px/700 `#1F3B2C`
- Whole row navigates to the **Bears tab**, not the external PDF

The external ebook link is gone from the Invite tab. The ebook is still credited on every bear
profile, which is where the attribution belongs.

## What to re-read

- `bears-data.json` — `credits` added on 4 records, `noBook` removed.
- `photos/` — 8 new files, `nps2022_*` naming.
- `CONTENT-AND-ASSETS.md` — updated for the second source and the mirrored-image caveat on the
  NPS comparison photos.
