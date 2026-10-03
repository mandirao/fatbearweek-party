import { NavHeader } from "@/components/NavHeader";
import { getMeId, isHost } from "@/lib/identity";
import { getGuest } from "@/lib/guests";
import { switchUserAction } from "@/lib/actions";
import { getBracketStatus } from "@/lib/bracket/server";
import { BracketStatusProvider } from "@/components/bracket/BracketStatus";
import { LiveBanner } from "@/components/bracket/LiveBanner";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const meId = await getMeId();
  const me = meId ? await getGuest(meId) : null;
  const hostFlag = await isHost();
  const bracketStatus = await getBracketStatus();

  return (
    <BracketStatusProvider initial={bracketStatus}>
      <div className="min-h-screen flex justify-center bg-spruce">
        <div className="w-full max-w-[440px] bg-cream min-h-screen flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.35)]">
          <NavHeader hostFlag={hostFlag} />
          <LiveBanner />

          {me && (
            <div className="bg-tan border-b border-border-tan px-5 flex items-center justify-between gap-2.5">
              <span className="min-h-11 inline-flex items-center text-sm text-ink-muted">
                Signed in as <strong className="text-forest">&nbsp;{me.name}</strong>
              </span>
              <form action={switchUserAction}>
                <button className="min-h-11 inline-flex items-center text-sm text-river underline underline-offset-2 cursor-pointer bg-transparent border-none p-0">
                  Not you?
                </button>
              </form>
            </div>
          )}

          {children}
        </div>
      </div>
    </BracketStatusProvider>
  );
}
