# Prompt for Claude Code: Bracket Night

Paste this as your opening message, with this folder attached.

---

Add **Bracket Night** to the existing Fat Bear Week party app. The party is **tonight, October 2, 2026**.
Bracket Night is a live, host-run voting game: every guest votes on the same 15 Fat Bear Week 2026
matchups on their phone, one round at a time, while the TV shows the bracket filling in.

Read `UPDATE-5-bracket-night.md` in full before writing code. It is split into **six phases**.
Build **one phase at a time**. At the end of each phase, stop, tell me how to run its QA checklist,
and wait for my go-ahead before starting the next phase. Don't start a later phase early, even if it
looks easy.

The design references are `Bracket v3.dc.html` (the game: phone, host remote, TV) and
`Bracket Access.dc.html` (how the tab unlocks). Open them in a browser; they run. They're
single-device simulations. In the real app these three views run on separate devices and share one
game state on the server.

## Where this overrides the earlier docs

- **"No spoilers"** (PROMPT-FOR-CODE.md) still applies everywhere except the Bracket tab. The
  official results are now loaded into the game, hidden on the server, and shown only when the host
  reveals each match.
- **"No admin panel"**: the host remote (Press Box) is the one exception. It's reached via a secret
  host link, not a login.
- **"Bracket is locked until September 18"** is replaced. Bracket is locked until the host taps Go
  Live (Phase 5).

## Non-negotiable for tonight

When Phase 6 is done, I need to **rehearse the full game myself** as host, as a player and on the
big screen, using test bots in place of real guests. Then I need **one button to wipe the rehearsal**
so we start clean tonight. That reset must never touch RSVPs, potluck claims or backed bears.

Ask me before you start if anything contradicts itself.
