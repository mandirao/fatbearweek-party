# Update 5: Bracket Night

Applies on top of everything in this folder. Where this doc conflicts with an earlier one, this wins
(see `PROMPT-FOR-CODE-BRACKET.md` for the three overrides).

## Overview

A live party game on **Friday, October 2, 2026**. About 8–25 players. Three views, on separate devices:

| View | Who | Device | How they get there |
| --- | --- | --- | --- |
| **Phone** | Every guest, the host too if they want to play | Their phone | Bracket tab in the app |
| **Press Box** (host remote) | Host (Mandi) | Host's phone | Secret host link, e.g. `/bracket/host?key=…` |
| **TV** | Everyone in the room | Laptop on the TV | `/bracket/tv` (read-only, no sign-in) |

The host steps the whole night forward. Phones and TV follow the server state in real time
(target: under 1 second from host tap to TV update).

**Scoring is "Read the Room."** You score by voting with the **party majority**, not by matching
Katmai's real result. The real results are public, so scoring against them would reward looking them
up. Katmai's count only decides which bear advances on the bracket.

## About the design files

`Bracket v3.dc.html` and `Bracket Access.dc.html` are **design references built in HTML**. They're
high-fidelity prototypes of the look and behavior, not production code. Rebuild them in this app's
existing stack and patterns. Ignore `support.js`. The prototype fakes other guests with a seeded random
function and stores everything in one browser's `localStorage`. **Don't copy that.** All game state
lives on the server.

Toolbar buttons above the prototype ("Rejoin", "Reset", party-size and tie props) are simulation
controls for the design review. The real equivalents are in Phase 6.

**Fidelity: high.** Match the colors, type and copy exactly (tokens at the end).

---

## Game model (shared by all phases)

### Data

- `official-results-2026.json`: all 15 matches, official vote counts, winners, rounds, dates.
  **Source of truth.** Checked against explore.org on Oct 2, 2026.
- The bear data for the 12 bracket bears (label, class, before/after photo URL, hook, ID marks, fishing
  notes) is in the `BEARS` constant inside `Bracket v3.dc.html`. Lift it into a static JSON.
  Photos are hot-linked from `https://media.explore.org/documents/`. If you can, download them into
  `photos/bracket/` so the game doesn't depend on explore.org staying up tonight.
- `photos/fbw-2026-blank-bracket.png`: the blank official bracket poster for the TV, 2184×1686.
  Slot coordinates for each bear medallion are the `P(x,y)` constants in the prototype (pixels on
  that image; convert to %).

### Bracket structure

- Matches 0–7 = Round 1 (pairings fixed in the JSON).
- 8 = winners of 0 & 1, 9 = 2 & 3, 10 = 4 & 5, 11 = 6 & 7 (Round 2).
- 12 = 8 & 9, 13 = 10 & 11 (Semifinal). 14 = 12 & 13 (Final).
- **The official Katmai winner advances**, regardless of the party vote. Because results are known
  ahead, every matchup is known ahead.
- Rounds: `Round 1` (8), `Round 2` (4), `Semifinal` (2), `Final` (1).

### Server-held state

```
game: {
  mode: 'rehearsal' | 'live'
  onAir: bool                      // Go Live toggle (Phase 5)
  round: 0..3
  phase: 'voting' | 'reveal' | 'wager' | 'tb' | 'tbDone'
  revealIdx: index within round    // which match is on the TV during reveal
  reveal: { [matchId]: 0|1|2 }     // 0 hidden, 1 party shown, 2 Katmai shown
  history: [snapshot…]             // for host Undo
  finishedAt: timestamp|null       // for the 48h champion banner
}
players: { id, name, isPlusOne, isBot, joinedAt, deviceToken }
votes:   { playerId, matchId, bearNum, at }      // one per player per match
talk:    { playerId, matchId, text, at, hidden } // trash talk
wagers:  { playerId, amount, lockedAt }
tbGuess: { playerId, value, lockedAt }
```

**Never send official counts to phones or the TV before that match's reveal level is 2.** The client
gets only what's been revealed.

### Scoring rules (exact)

- **Per match:** party majority = the bear with more party votes.
  - Your pick = majority → +1.
  - **Tie (split room)** → everyone who voted in that match gets +1.
  - Against the majority, or no vote → 0.
- Points count once the host reveals the party vote for that match (reveal ≥ 1).
- **Final Wager** (before the Final): bet 0 up to your score after the Semifinals. Resolves at the
  Final's party reveal: with the room → +bet, against → −bet, split room → keep it (0 change),
  **didn't vote in the Final → −bet**.
- **Tiebreaker:** if two or more players share first place after the Final's Katmai reveal, the host
  starts it. Only tied players answer: *"How many party votes did Backpack get tonight, across all four
  of his matches?"*. The answer is computed live: the sum of party votes for bear 89 in matches 5, 10,
  13, 14. Closest guess wins. **Equal distance → earliest `lockedAt` wins.** No guess = last.
  The answer comes from tonight's votes, so it can't be looked up and following the real bracket
  doesn't help.
- **Bracket buster:** party majority ≠ Katmai winner (not raised on a split room).

---

## Phase 1: Game engine + data (no UI)

**Build:** data files, server game state, all the rules above as pure functions, the host action API,
and a **bot player** helper. Bots are fake players with random votes, wagers and guesses, flagged
`isBot`, and used everywhere in rehearsal.

Host actions (server-side, all require the host key):

| Action | Valid when | Effect |
| --- | --- | --- |
| `lockRound` | `phase=voting` | → `reveal`, revealIdx 0. Votes for that round close. |
| `revealParty` | reveal, level 0 | level → 1 (scores + wager update) |
| `revealKatmai` | reveal, level 1 | level → 2 (winner advances on poster) |
| `nextMatch` | level 2, not last in round | revealIdx + 1 |
| `openRound` | last match at level 2, round 0–1 | round + 1, `voting` |
| `openWager` | Semis complete | round 3, `wager` |
| `openFinal` | `wager` | `voting` for match 14. Wagers lock. |
| `startTiebreaker` | Final at level 2 and first place tied | `tb` |
| `revealTiebreaker` | `tb` | `tbDone` |
| `undo` | history not empty | restores the previous snapshot of `game` (votes untouched) |

Every action except `undo` pushes a snapshot first. Reject invalid actions with a clear error. Never
silently skip.

**QA (you run it, then report):** an automated test (or a CLI script) that plays a whole game with
10 bots and prints round by round: party tallies, Katmai winner, busters, the scoreboard, wagers
resolved, and the tiebreaker. Include unit tests for: a 4–4 tie match, a player with no vote,
an all-in wager won and lost, a wager on a split Final, a 3-way tie for first, and two tiebreaker
guesses at equal distance. Also: `undo` after `revealKatmai` restores level 1.

**Stop here.**

---

## Phase 2: TV view + Press Box (no phones yet)

**Build:** `/bracket/tv` and `/bracket/host?key=…`, live-updated from the server. Use bots as the
voters for now (in rehearsal mode, bots vote automatically within ~10 s of a round opening).

**TV (1600×900 design, scale to fit 16:9, no scrolling):**
- Left 1166px: the blank bracket poster with medallions filling in at each Katmai reveal.
- Right column: what's happening now:
  - voting: "X/Y cards in" and per-player progress bars
  - reveal level 0: the matchup, waiting
  - level 1: the party bar (yellow vs blue split), or **"SPLIT ROOM · EVERY VOTE SCORES"** on a tie
  - level 2: the Katmai count and winner, plus the **BRACKET BUSTED** alert if busted
  - top 3 trash-talk lines for the match
  - leaderboard top 5, with "+N BET / −N BET" chips during the Final
- Match the prototype exactly for layout, copy and colors.

**Press Box (host phone):**
- Status line (e.g. `voting open · 6/9 cards in`), one big **primary button** whose label changes
  with state, and a **◀ Back a step** button (undo; dimmed when nothing to undo).
- Primary button labels, in order: `Lock round · 6/9 in` → `Reveal party vote` → `Reveal Katmai count`
  → `Next match →` → `Open Round 2` … → `Open the Final Wager` → `Lock bets · open the Final` → … →
  `Start tiebreaker · 2-way tie` → `Reveal tiebreaker answer` → `Party champion: {name}`.
- **Two-tap lock when cards are missing:** first tap arms it ("Tap again: lock with 3 missing"),
  second tap locks. If all cards are in, one tap.
- Debounce the primary button (ignore a second tap within 600 ms) so a double-tap can't skip a beat.
- Trash talk moderation: list of lines for the current match, each with a **Hide** button (hidden
  lines disappear from the TV within a second).

**QA:** open TV in one window and Press Box in another (or on your phone). With 10 bots, step through
all 15 matches to the champion. Check: poster fills in correctly; a tie shows SPLIT ROOM; Undo works
mid-reveal; the double-tap guard works; hiding a talk line removes it from the TV.

**Stop here.**

---

## Phase 3: Player phone

**Build:** the Bracket tab game screens from `Bracket v3.dc.html` (phone column).

- **Join ("Who are you?"):**
  - Signed-in guest → "READY TO PLAY?" confirm, one tap.
  - Otherwise pick a roster name or "+1 / not on the list" → type a name → in. (The "who brought you"
    step from the prototype is **cut**. Don't build it.)
  - Names already playing show **PLAYING** plus a **"That's me"** link. That goes to "BACK AGAIN?":
    the player record moves to this device (`deviceToken` swapped) and the host sees a notice in the
    Press Box with **Undo rejoin**.
  - Late joiners can join mid-round and vote on any match still open. Score starts at 0.
- **Voting:** one matchup at a time. Two bear tabs, large before/after photo (tap → fullscreen,
  auto-rotates to landscape where supported, "← EARLY SUMMER / LATE SUMMER →" labels), hook, ID
  marks, fishing notes, "Full bio on explore.org →". Vote button, then "LOCKED · NEXT ▶". Round dots
  at top (make the tap targets at least 44px tall). A round card summarizing all picks; votes are
  changeable until the host locks.
- **Trash talk:** after voting, one line per match (max 80 characters).
- **Reveal:** phone mirrors the TV beat: waiting → party result ("WITH THE ROOM · +1", "SPLIT ROOM,
  EVERYONE SCORES", "AGAINST THE ROOM · 0 PTS") → Katmai result.
- Header shows score.
- **Reconnect:** a refresh or dropped connection lands the player back exactly where the game is,
  with their votes intact (identity from `deviceToken` in a cookie/localStorage, state from the server).

**QA:** host on your phone, TV on the laptop, and **two or three player browsers** (one normal window,
one private window, one other phone), plus bots. Play Round 1 and Round 2. Check: join as a roster
name, as a +1, and "That's me" from a second browser; a late join mid-round; votes change until lock,
then freeze; refresh mid-reveal recovers; scores on phones match the TV leaderboard.

**Stop here.**

---

## Phase 4: Final Wager + Tiebreaker

**Build:** the wager and tiebreaker screens on phone and TV (search `showWager`, `showTb`, `tvWager`,
`tvTb` in the prototype for exact layout and copy).

- **Wager phone:** explainer box; big number with −/+; NONE / HALF / ALL IN; "LOCK IN N PTS"
  (changeable until the host opens the Final). Players with 0 points see "No points to bet yet. You
  can still vote in the Final."
- **Wager TV:** list of players with LOCKED / DECIDING… (**amounts never shown** until resolved);
  "N/M BETS LOCKED".
- **Tiebreaker phone (tied players only):** numeric input (`inputmode="numeric"`, digits only, 16px+),
  "LOCK GUESS". Non-tied players see "Tied for first. Watch the big screen."
- **Tiebreaker TV:** tied names, question, THINKING… / LOCKED per player; on reveal: the answer, each
  guess with "OFF BY N", and the **PARTY CHAMPION** card. Show "Same distance, so the first guess
  locked in wins." when it applies.
- If there's no tie after the Final, skip straight to the champion.

**QA:** in rehearsal, rig a tie (Phase 6 gives you a button; until then use a test script). Run Semis →
Wager → Final → Tiebreaker. Check: an all-in bet against the room drops to the right score; a split
Final keeps bets; a non-voter loses their bet; the TV never shows bet amounts early; equal-distance
guesses resolve by lock time.

**Stop here.**

---

## Phase 5: Bracket tab access (the rest of the app)

**Build:** the four states in `Bracket Access.dc.html`.

- **4a: Before the party:** BRACKET tab visible but locked. Tapping opens the "LOCKED UNTIL PARTY
  NIGHT · BRACKET NIGHT" info sheet (copy verbatim from the file).
- **4b: Host Go Live:** in the Press Box, status card ("9 checked in · 15 official results loaded")
  and **GO LIVE** button with a confirm sheet. **Going off air pauses the game** (phones show "Paused
  by the host", the TV shows the lobby); nothing is lost; going live again resumes.
- **4c: Live:** gold BRACKET tab plus the arcade live banner showing round progress. **Show the banner
  on all four tabs**, not just Invite, so guests browsing Bears or Potluck see "Round 2 is open."
- **4d: After the Final:** CHAMPION CROWNED banner for **48 hours** from `finishedAt`, dismissible.
  The Bracket tab keeps the finished poster, each guest's card and the final leaderboard.
- **Copy change on the Invite tab and calendar invite:** replace "Brackets lock at 9 PM" with
  **"Bracket night starts ~8 PM"**.
- Fix: the five tab labels must fit at 360px width without wrapping or truncation.

**QA:** on a phone, check all four states by toggling Go Live / off air from the Press Box; the banner
shows on every tab; at 360px wide all five tabs fit.

**Stop here.**

---

## Phase 6: Rehearsal mode + Reset (needed before tonight)

**Build:** a **Rehearsal panel** in the Press Box, only visible with the host key.

- **Mode badge** everywhere in rehearsal: a small "REHEARSAL" tag on TV, Press Box and phones so
  a test can't be mistaken for the real game.
- **Add bots:** add N bots (1–20), named "Bot 1…". Bots join, vote within ~10 s of a round opening,
  post an occasional trash-talk line, lock random wagers and tiebreaker guesses.
- **Force a tie for first** (rehearsal only): adjusts a bot's score so the tiebreaker triggers.
- **Jump to:** Round 2 / Semifinal / Final Wager / Final (fills earlier rounds with bot votes and
  marks them revealed), so I can re-test the ending without replaying from the start.
- **RESET BRACKET NIGHT** (hold 2 seconds to confirm): deletes all players, votes, talk, wagers,
  guesses and history; sets round 0, `voting`, off air, `mode: 'live'`, no bots. Phones drop back to
  the locked state. **Must not touch** guests, RSVPs, plus-ones, potluck claims or backed bears. Write
  a test that proves it.

### Full dress rehearsal (run this before handing back)

Then tell me how to run it myself. Devices: TV (laptop), Press Box (my phone), Player A (my phone in a
second browser), Player B (any other browser), plus 8 bots.

1. Mode = rehearsal. Add 8 bots. TV shows the lobby; phones show the locked tab with the info sheet.
2. Go Live. Banner appears on all tabs; Bracket tab turns gold.
3. Player A joins as a signed-in guest; Player B joins as a +1 by typing a name.
4. Round 1: A votes all 8; B votes 5. Lock → two-tap warning shows "3 missing"; lock anyway.
5. Reveal all 8 matches. Use **Back a step** once after a Katmai reveal, then redo it.
6. Hide one bot trash-talk line; confirm it disappears from the TV.
7. Close Player B's browser. Reopen in a new private window → "That's me" → B's score and votes are back.
8. Round 2 + Semis. Mid-Semis, a third browser joins late and votes.
9. Go off air for 30 seconds, then back on air. Nothing lost.
10. Final Wager: A bets ALL IN, B bets 0. Open the Final, vote, reveal. Check the bet chips and scores.
11. Force a tie (if there isn't one) → Tiebreaker → both guess → reveal → Party Champion.
12. Champion banner on every tab; Bracket tab shows final poster and leaderboard.
13. **RESET BRACKET NIGHT.** Confirm: bracket back to locked, no players, no bots, `mode: live`; RSVP
    list, potluck claims and backed bears unchanged.

---

## Design tokens (Bracket screens)

Arcade night palette (phone game, TV):

| Token | Hex | Use |
| --- | --- | --- |
| Night | `#081627` | Background |
| Deep panel | `#0E2238` | Sheets |
| Line | `#16304A` | Taken/disabled borders |
| Teal | `#1C6E8C` | Borders, buttons, bar B |
| Ice | `#7FC4DA` | Secondary text, labels |
| Cream | `#F3E6C4` | Body text |
| Gold | `#F7C21B` | Primary action, score, highlights, bar A |
| Red | `#E3262E` | Current item, BRACKET BUSTED, champion card |
| White | `#FFFFFF` | Headings on red |

Press Box and app chrome use the existing app palette: forest `#1F3B2C`, rust `#C2522E` (primary
host button), paper `#FBF4E4`, cream `#EFE6D2`, ink `#38352E`.

Type:
- **Silkscreen** 400/700: arcade labels, scores, buttons (11–60px; uppercase, chrome only)
- **Chakra Petch** 400–700: game body text (14–20px)
- **Archivo** / **Archivo Black**: existing app chrome and the Press Box
- All from Google Fonts. Inputs ≥ 16px. Tap targets ≥ 44px; primary game buttons are 60px tall.

Square corners in the arcade screens (0 radius, 2–3px borders). The Press Box keeps the app's 6px radius.

## Files

- `Bracket v3.dc.html`: game reference (phone, Press Box, TV, all phases)
- `Bracket Access.dc.html`: tab unlock states 4a–4d
- `official-results-2026.json`: 15 official results
- `photos/fbw-2026-blank-bracket.png`: TV poster
