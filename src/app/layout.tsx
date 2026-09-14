import type { Metadata } from "next";
import { Archivo, Archivo_Black } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Wordmark } from "@/components/Wordmark";
import { getMeId, isHost } from "@/lib/identity";
import { getGuest, checkinTagline } from "@/lib/guests";
import { switchUserAction } from "@/lib/actions";
import { SITE_URL } from "@/lib/party";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Fat Bear Week Party",
  description: "RSVP for the Fat Bear Week draft-night party.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const meId = await getMeId();
  const me = meId ? await getGuest(meId) : null;
  const hostFlag = await isHost();

  return (
    <html lang="en" className={`${archivo.variable} ${archivoBlack.variable}`}>
      <body>
        <div className="min-h-screen flex justify-center bg-spruce">
          <div className="w-full max-w-[440px] bg-cream min-h-screen flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.35)]">
            <div className="sticky top-0 z-10 bg-forest px-[18px] py-3 flex items-center justify-between gap-3">
              <Wordmark />
              <div className="flex gap-3.5 items-center">
                <Link
                  href="/roster"
                  className="font-sans font-semibold text-[11px] tracking-[0.14em] text-green-muted hover:text-cream"
                >
                  ROSTER
                </Link>
                {hostFlag && (
                  <Link
                    href="/host"
                    className="font-sans font-semibold text-[11px] tracking-[0.14em] text-green-muted hover:text-cream"
                  >
                    PRESS BOX
                  </Link>
                )}
              </div>
            </div>

            {me && (
              <div className="bg-tan border-b border-border-tan px-[18px] py-[9px] flex items-center justify-between gap-2.5">
                <span className="text-[12.5px] text-ink-muted">
                  Checked in as <strong className="text-forest">{me.name}</strong>
                  {checkinTagline(me)}
                </span>
                <form action={switchUserAction}>
                  <button className="text-[12.5px] text-river underline underline-offset-2 cursor-pointer bg-transparent border-none p-0">
                    Not you?
                  </button>
                </form>
              </div>
            )}

            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
