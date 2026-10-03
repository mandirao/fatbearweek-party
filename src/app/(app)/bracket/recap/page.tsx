import type { Metadata } from "next";
import Link from "next/link";
import { getLoaded } from "@/lib/bracket/server";
import { buildFinalBoard, buildRecap, type RecapMatch } from "@/lib/bracket/view";
import { Poster } from "@/components/bracket/phone/FinishedBoard";

export const metadata: Metadata = { title: "Bracket Night Recap · Fat Bear Week Party" };

const up = (s: string) => s.toUpperCase();
const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (a: number, b: number) => `${(a / (a + b || 1)) * 100}%`;

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 px-4 py-6 border-t-[3px] border-arcade-red">
      <div className="flex flex-col gap-1">
        <span className="font-pixel text-[12px] text-gold">{eyebrow}</span>
        <h2 className="m-0 font-pixel font-normal text-[22px] leading-none text-arcade-cream">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Bar({ a, b }: { a: number; b: number }) {
  return (
    <div className="flex h-3 border-2 border-arcade-cream">
      <span className="bg-gold" style={{ width: pct(a, b) }} />
      <span className="flex-1 bg-teal" />
    </div>
  );
}

function MatchRow({ m, note }: { m: RecapMatch; note?: string }) {
  return (
    <div className="flex flex-col gap-1.5 bg-night border-2 border-teal px-3 py-2.5">
      <div className="flex justify-between gap-2 font-pixel text-[11px] text-ice">
        <span>{up(m.round)}</span>
        {note && <span className="text-gold">{note}</span>}
      </div>
      <div className="flex justify-between font-pixel text-[12px]">
        <span>
          {up(m.a.short)} {m.party[0]}
        </span>
        <span>
          {m.party[1]} {up(m.b.short)}
        </span>
      </div>
      <Bar a={m.party[0]} b={m.party[1]} />
      <span className="text-[13.5px] text-ice">
        Party: {m.partyWinner ? m.partyWinner.label : "split"} · Katmai: {m.winner.label} ({fmt(Math.max(...m.katmai))}–
        {fmt(Math.min(...m.katmai))})
      </span>
    </div>
  );
}

export default async function RecapPage() {
  const { snap } = await getLoaded();
  // Everything in a finished game is locked before the finish, so that's the cut-off.
  const now = snap.game.finishedAt ?? 0;
  const r = buildRecap(snap, now);
  const final = buildFinalBoard(snap, now);

  if (!r || !final)
    return (
      <div className="flex-1 bg-deep px-[18px] py-8 flex flex-col gap-3 font-game text-arcade-cream">
        <span className="font-pixel text-[12px] text-gold">BRACKET NIGHT</span>
        <span className="font-pixel text-[26px] leading-[1.05]">RECAP COMING SOON</span>
        <span className="text-[15px] leading-[1.5] text-ice">The recap shows up here once the Final is decided.</span>
      </div>
    );

  const flip = r.semisLeaders;

  return (
    <div className="flex-1 bg-deep flex flex-col font-game text-arcade-cream">
      <header className="px-4 pt-6 pb-5 flex flex-col gap-3 bg-night">
        <span className="font-pixel text-[12px] text-gold">FAT BEAR WEEK 2026 · FRI OCT 2</span>
        <h1 className="m-0 font-pixel font-normal text-[32px] leading-none">BRACKET NIGHT RECAP</h1>
        <div className="bg-arcade-red border-[3px] border-gold p-3.5 flex flex-col gap-1">
          <span className="font-pixel text-[13px] text-white">PARTY CHAMPION</span>
          <span className="font-pixel text-[30px] leading-none text-gold">{up(r.champion)}</span>
          <span className="text-[15px] text-white">
            {r.championScore} points. Read the room best of {r.players.length}.
          </span>
        </div>
        <span className="text-[15px] leading-[1.5]">
          <strong className="text-gold">{r.bearChampion.label}</strong> takes the Golden Salmon.
        </span>
      </header>

      <Poster final={final} />

      <Section eyebrow="BEFORE THE FINAL" title="THE WAGER FLIPPED IT">
        <p className="m-0 text-[15.5px] leading-[1.55]">
          {flip ? (
            <>
              <strong className="text-gold">{flip.names.join(" & ")}</strong> led after the Semis with {flip.score}{" "}
              points. {flip.names.length > 1 ? "They" : flip.names[0]} finished on {flip.finalScores.join(" and ")}
              .{" "}
            </>
          ) : null}
          {r.allIn.count} of {r.players.length} players went all in: {r.allIn.won} doubled up, {r.allIn.lost} went to
          zero.
        </p>
      </Section>

      <Section eyebrow="READ THE ROOM" title="FINAL LEADERBOARD">
        <div className="flex flex-col">
          <div
            className="grid gap-2 font-pixel text-[10px] text-ice pb-1.5"
            style={{ gridTemplateColumns: "minmax(0,1fr) 44px 52px 40px" }}
          >
            <span>PLAYER</span>
            <span className="text-right">SEMIS</span>
            <span className="text-right">BET</span>
            <span className="text-right">FINAL</span>
          </div>
          {r.players.map((p) => (
            <div
              key={p.name}
              className="grid gap-2 items-center py-2 border-t border-line text-[15px]"
              style={{
                gridTemplateColumns: "minmax(0,1fr) 44px 52px 40px",
                color: p.rank === 1 ? "#F7C21B" : undefined,
              }}
            >
              <span className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
                {p.rank}. {p.name}
              </span>
              <span className="text-right text-ice">{p.afterSemis}</span>
              <span
                className="text-right font-pixel text-[11px]"
                style={{ color: p.wagerDelta > 0 ? "#7FC4DA" : p.wagerDelta < 0 ? "#E3262E" : "#5E7A8C" }}
              >
                {p.wagerDelta > 0 ? `+${p.wagerDelta}` : p.wagerDelta < 0 ? `−${-p.wagerDelta}` : p.bet ? "KEPT" : "—"}
              </span>
              <span className="text-right font-pixel text-gold">{p.score}</span>
            </div>
          ))}
        </div>
        <span className="text-[13px] text-ice">
          Semis = points going into the Final Wager. Final adds the Final’s point and the bet.
        </span>
      </Section>

      {r.tiebreaker && (
        <Section eyebrow="TIE FOR FIRST" title="TIEBREAKER">
          <span className="text-[15px]">
            Backpack’s party votes, all night: <strong className="text-gold">{r.tiebreaker.answer}</strong>
          </span>
          {r.tiebreaker.rows.map((t, i) => (
            <div
              key={t.name}
              className="flex justify-between text-[15px]"
              style={{ color: i === 0 ? "#F7C21B" : undefined }}
            >
              <span>{t.name}</span>
              <span className="font-pixel text-[12px]">
                {t.guess == null ? "NO GUESS" : `${t.guess} · OFF BY ${t.off}`}
              </span>
            </div>
          ))}
        </Section>
      )}

      {r.superlatives.length > 0 && (
        <Section eyebrow="AWARDS" title="SUPERLATIVES">
          {r.superlatives.map((s) => (
            <div key={s.title} className="border-2 border-teal px-3 py-2.5 flex flex-col gap-1">
              <span className="font-pixel text-[11px] text-ice">{s.title}</span>
              <span className="font-pixel text-[18px] text-gold">{up(s.name)}</span>
              <span className="text-[14px] leading-[1.45]">{s.detail}</span>
            </div>
          ))}
        </Section>
      )}

      {r.busters.length > 0 && (
        <Section eyebrow={`${r.busters.length} TIMES THE PARTY DISAGREED WITH KATMAI`} title="BRACKET BUSTERS">
          {r.busters.map((m) => (
            <MatchRow key={m.id} m={m} note="BUSTED" />
          ))}
        </Section>
      )}

      <Section eyebrow="THE ROOM" title="CLOSEST & MOST LOPSIDED">
        {r.closest.map((m) => (
          <MatchRow key={`c${m.id}`} m={m} note={m.margin === 0 ? "SPLIT ROOM" : `WON BY ${m.margin}`} />
        ))}
        {r.lopsided.map((m) => (
          <MatchRow key={`l${m.id}`} m={m} note={`WON BY ${m.margin}`} />
        ))}
      </Section>

      {r.quotes.length > 0 && (
        <Section
          eyebrow={r.quotes.length === 1 ? "THE ONLY TRASH TALK OF THE NIGHT" : "TRASH TALK"}
          title="QUOTE OF THE NIGHT"
        >
          {r.quotes.map((q, i) => (
            <figure key={i} className="m-0 border-l-4 border-arcade-red bg-night px-3 py-3 flex flex-col gap-1.5">
              <blockquote className="m-0 text-[19px] leading-[1.35] font-semibold text-white">“{q.text}”</blockquote>
              <figcaption className="font-pixel text-[11px] text-gold">
                {up(q.who)} → {up(q.bear)} · {up(q.match)}
              </figcaption>
            </figure>
          ))}
        </Section>
      )}

      <Section eyebrow="ALL 15" title="MATCH BY MATCH">
        {r.matches.map((m) => (
          <MatchRow key={m.id} m={m} note={m.busted ? "BUSTED" : undefined} />
        ))}
      </Section>

      <div className="px-4 pb-10 pt-2">
        <Link
          href="/bracket"
          className="flex items-center justify-center min-h-[54px] border-[3px] border-gold bg-gold text-night no-underline font-pixel text-[15px] hover:text-night"
        >
          ◀ BACK TO THE BRACKET
        </Link>
      </div>
    </div>
  );
}
