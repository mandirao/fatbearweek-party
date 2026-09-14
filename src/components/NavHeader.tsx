"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Wordmark";

const TABS = [
  { label: "INVITE", href: "/" },
  { label: "ROSTER", href: "/roster" },
  { label: "POTLUCK", href: "/potluck" },
  { label: "BEARS", href: "/bears" },
];

export function NavHeader({ hostFlag }: { hostFlag: boolean }) {
  const pathname = usePathname();

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
      <div className="flex border-t border-green-hover">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 min-h-[46px] flex items-center justify-center font-sans font-semibold text-xs tracking-[0.12em] border-b-[3px] ${
                active ? "text-cream border-salmon" : "text-green-muted border-transparent hover:text-cream"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
