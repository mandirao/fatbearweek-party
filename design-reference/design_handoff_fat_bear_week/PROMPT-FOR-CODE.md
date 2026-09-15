# Prompt for Claude Code

Paste this as your opening message, with this folder attached.

---

Build the Fat Bear Week party app from the design package in this folder.

It's a private invite for a house party on **October 2, 2026** — guests get a texted link, RSVP,
claim a potluck dish, and pick a bear to back in Katmai National Park's Fat Bear Week bracket.
About 25 guests. No accounts, no passwords, no email.

## Read these in order

1. `README.md` — the original product brief: identity model, tabs, roster, potluck.
2. `UPDATE-2-multi-tab.md` — the four-tab navigation that replaced the single-screen flow.
3. `UPDATE-3-bear-guide.md` — the bear guide, both screens, in full detail.
4. `YOUR-BEAR-MODULE.md` — the allegiance module. Small, and easy to get wrong.
5. `CONTENT-AND-ASSETS.md` — the data model, image paths, provenance, licensing.
6. `UPDATE-4-changes.md` — the most recent deltas. Where the earlier docs conflict, this wins.

`UPDATE-2026-09.md` is superseded; read it only for history.

## What's in here

- Four `.dc.html` files — **the designs**. Open them in a browser; they run. These are the
  reference, not the shippable app.
- `bears-data.json` — 42 bear records. The real content, not a fixture.
- `photos/` — 91 JPEGs. All referenced paths resolve against this folder.
- `support.js` — runtime for the prototype only. **Ignore it entirely.** Don't read it, don't
  copy patterns from it, don't ship it.

The designs are HTML because that's how they were designed, not a suggestion about stack.
Use whatever the target codebase uses. If there is no target codebase, pick something boring
and server-rendered.

## Build this

**Four tabs**, persistent, in this order: Invite · Roster · Potluck · Bears. A fifth, Bracket,
is locked until September 18 and shows a "locked" panel — the real bracket is out of scope.

**Identity without auth.** A visitor picks their name from the guest list on arrival. That choice
persists. A "Signed in as {Name} — Not you?" banner lets them switch. Signed-out visitors can
browse the potluck and the bear guide but can't claim or declare anything; attempting either
routes them to the Invite tab to check in.

**RSVP** writes yes/no/maybe plus a plus-one count onto the guest's record. Landing after RSVP is
the Roster, not a redirect loop.

**Potluck** is 20 named dishes, one claim per person. Tap to claim, tap to release. A sticky
status bar shows what you're bringing, or how many dishes are still open. Enforce one dish per
person server-side, not just in the UI.

**Bears** is the guide plus the Your Bear module. 42 profiles, filters, search, four content
tiers with different visual weight, and a per-bear profile page. All of it is specified in
`UPDATE-3-bear-guide.md`; follow it closely, including the tier sort and the quiet treatment for
historic bears.

## The data layer

The prototype fakes persistence in `localStorage` under `fbw2026.rsvps.v1` and
`fbw2026.potluck.v1`, re-read on mount. **Don't copy that.** Guests share this app; state has to
be shared too.

What needs to be real:

- A guest record: name, RSVP status, plus-ones, claimed dish, backed bear.
- One dish per guest, enforced atomically. Two people tapping the same dish at once should not
  both get it.
- The backed bear is a single free-text field with two writers — the SET button in Your Bear, and
  the CTA on every bear profile. Both write the same field; the Roster reads it. There is no
  history and no confirmation.
- Bear content is static. Ship `bears-data.json` and the photos as assets; they don't need a
  database, and they don't change between deploys.

## Things that will bite you

- **Image paths in `bears-data.json` are document-relative** (`photos/p19_1.jpg`). Two more are
  hardcoded in the page's briefings. `CONTENT-AND-ASSETS.md` explains how to rewrite the prefix.
  This is the most likely thing to break silently.
- **Don't add a bear picker.** The bear field accepts any string on purpose — a guest can back an
  unprofiled cub or a joke entry. No autocomplete, no validation against the 42.
- **Don't delete the empty-state branches** in the bear profile (number-watermark hero, `NO PHOTO
  YET` tile, missing-ebook-page panel). They're unreachable with today's data and deliberately
  kept for bears added later.
- **Uppercase + letterspacing is chrome only** — tab labels, section eyebrows, card headers.
  Never body text or data. This was a real bug once.
- **Rust (`#C2522E`) means "this is yours."** The declared bear panel, the active back-CTA, the
  claimed-dish accent. Don't spend it on decoration.
- **Bear text is verbatim National Park Service copy.** Don't rewrite, summarize, or "improve" it,
  and keep the credit line on every profile. Two different credit lines — see `UPDATE-4-changes.md`.
- **No spoilers.** No links to live Fat Bear Week results or current standings anywhere in the app.
  This was an explicit product decision.

## Where to be careful about scope

Mobile-first, one column, max 440px content width. Most guests open this once on a phone from a
text message. 44px minimum tap targets, 16px minimum on inputs (smaller zooms iOS on focus).

Don't add features. No comments, no photo uploads, no chat, no notifications, no admin panel.
If something seems missing, it was probably cut on purpose — ask before building it.

Ask me before you start if anything in the docs contradicts itself.
