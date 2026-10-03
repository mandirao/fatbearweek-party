"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "./Wordmark";
import { useBracketStatus } from "./bracket/BracketStatus";
import { LockedSheet } from "./bracket/LockedSheet";

const TABS = [
  { label: "DETAILS", href: "/" },
  { label: "ROSTER", href: "/roster" },
  { label: "POTLUCK", href: "/potluck" },
  { label: "BEARS", href: "/bears" },
];

const tabBase =
  "min-h-[46px] flex items-center justify-center gap-[5px] font-sans font-semibold text-[10.5px] tracking-[0.05em] border-b-[3px] whitespace-nowrap no-underline";

function LockIcon() {
  return (
    <span className="relative w-[9px] h-[11px] inline-block" aria-hidden>
      <span className="absolute left-px top-0 w-[5px] h-[5px] border-[1.5px] border-[#6F8C7B] border-b-0 rounded-t" />
      <span className="absolute left-0 bottom-0 w-[9px] h-[6px] bg-[#6F8C7B] rounded-[1px]" />
    </span>
  );
}

function BracketTab({ active, onLocked }: { active: boolean; onLocked: () => void }) {
  const s = useBracketStatus();
  if (!s || s.tabLocked)
    // A real link so a tap before the page finishes loading still lands on the locked /bracket page.
    return (
      <Link
        href="/bracket"
        onClick={(e) => {
          e.preventDefault();
          onLocked();
        }}
        className={`${tabBase} text-[#6F8C7B] bg-[#243F31] border-transparent hover:text-[#6F8C7B]`}
      >
        <LockIcon />
        BRACKET
      </Link>
    );
  const live = s.onAir && !s.finishedAt;
  if (live)
    return (
      <Link href="/bracket" className={`${tabBase} font-bold text-night bg-gold hover:text-night border-arcade-red`}>
        <span className="w-[7px] h-[7px] rounded-full bg-arcade-red shadow-[0_0_0_3px_rgba(227,38,46,0.3)]" />
        BRACKET
      </Link>
    );
  return (
    <Link
      href="/bracket"
      className={`${tabBase} text-gold hover:text-gold ${active ? "border-salmon" : "border-transparent"}`}
    >
      BRACKET
    </Link>
  );
}

export function NavHeader({ hostFlag }: { hostFlag: boolean }) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState(false);

  return (
    <div className="sticky top-0 z-10 bg-forest flex flex-col">
      <div className="px-4 flex items-center justify-between gap-3">
        <Wordmark />
        <div className="flex items-center gap-3.5">
          <span className="font-semibold text-[11px] tracking-[0.14em] text-apricot whitespace-nowrap">
            KATMAI PLAYOFFS · 2026
          </span>
          {hostFlag && pathname === "/" && (
            <Link
              href="/host"
              className="min-h-11 inline-flex items-center font-sans font-semibold text-xs tracking-[0.14em] text-green-muted hover:text-cream"
            >
              PRESS BOX
            </Link>
          )}
        </div>
      </div>
      <div
        className="grid border-t border-green-hover"
        style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr)) minmax(0,1.25fr)" }}
      >
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${tabBase} ${
                active ? "text-cream border-salmon" : "text-green-muted border-transparent hover:text-cream"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
        <BracketTab active={pathname.startsWith("/bracket")} onLocked={() => setSheet(true)} />
      </div>
      {sheet && <LockedSheet onClose={() => setSheet(false)} />}
    </div>
  );
}
