# Your Bear — module spec

The allegiance module at the top of the Bears tab. It was a chip-picker; it is now a single
text field. This document covers that module only. Design context: `UPDATE-3-bear-guide.md`.

## What changed and why

The original had five quick-pick chips (Grazer, Chunk, 747, Holly, Undecided) above a free-text
field. They were removed. The chips guessed at five bears out of 42, which made the guide below
look optional and made four arbitrary bears look official. The scouting report is now the way
you find a bear; this module is only the place your choice is recorded.

**There is no dropdown, autocomplete, or validation against the bear list.** Any string is a
valid bear. Guests should be able to back a bear the Park Service never profiled, a cub with no
number, or a joke entry. Do not "improve" this with a picker.

## Anatomy

A bordered card: 2px `#1F3B2C`, 4px radius, `overflow: hidden`.

**Header bar** — `#1F3B2C` fill, 12px padding, label "YOUR BEAR" in 12px/600 with 0.14em
tracking, `#FBF4E4`.

**Body** — white, 14px padding, 14px vertical gap, holding two things in order:

1. **Status** — one of two states, never both.
   - *Declared:* a `#1F3B2C` panel, 4px radius, 14px padding, holding the bear in Archivo Black
     19px `#FBF4E4` as `TEAM {NAME}` uppercased, and a right-aligned "Undeclare" button —
     transparent fill, 1px `#3A5A48` border, `#C5D3C6` text, 44px min-height, hover fill `#16291F`.
   - *Undeclared:* a 15px/1.55 `#5C564C` line. Signed in: "Nothing declared yet. Scout the field
     below, or type any bear you like." Signed out: "Check in on the invite first, then pick a
     bear here."

2. **Entry row** — a text input and a SET button, 8px gap.
   - Input: flex-fill, `min-width: 0`, white, 1px `#DED3BC`, 4px radius, 15px/12px padding,
     **16px font** (anything smaller triggers iOS zoom on focus). Placeholder:
     `Type a bear (128, Holly, 856…)`.
   - Button: `#1F3B2C` fill, `#FBF4E4` text, 4px radius, 44px min-height, 0 16px padding,
     15px/700 with 0.06em tracking, label "SET". Hover `#2C5240`.

## Behavior

| Trigger | Result |
| --- | --- |
| SET with non-empty input | Trims, writes as the bear, clears the input |
| SET with empty input | No-op. No error state, no shake, no message |
| SET while signed out | Navigates to the invite to check in first |
| Undeclare | Clears the bear. No confirmation |
| Profile CTA in the guide | Writes the same field — see below |

**Write target:** the `bear` field on the current guest's record in `fbw2026.rsvps.v1`
(`{ guests: [...], meId }`). The Roster tab reads the same field. There is one bear per guest and
no history — setting a new one overwrites the old silently.

**The profile CTA is the other writer.** Each bear profile in the guide has a full-width button
that writes to this exact field. Its label depends on current state: "Back Otis" when nothing is
declared, "Change your bear to Otis" when a different bear is declared, "You're backing Otis —
tap to undo" when it is already this bear. That third state is a toggle — it clears the field.
Whatever the shared state mechanism is in the target codebase, both writers and the Roster read
must sit on it; the prototype re-reads `localStorage` on mount, which is not a pattern to copy.

**Value shape:** the stored string is whatever the guest typed, or — when set from a profile —
the bear's nickname if it has one, otherwise `#` plus the number (`Otis`, `#747`). Display
uppercases it for the TEAM panel; storage keeps the original casing.

## States to build

1. Signed out, no bear — prompt points to the invite; SET routes there.
2. Signed in, no bear — prompt points down to the field.
3. Signed in, bear declared — TEAM panel plus Undeclare; the entry row stays visible so a guest
   can overwrite without undeclaring first.

There is no loading state, no error state, and no success toast. The TEAM panel appearing is the
confirmation.
