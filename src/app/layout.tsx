import type { Metadata } from "next";
import { Archivo, Archivo_Black, Chakra_Petch, Silkscreen } from "next/font/google";
import "./globals.css";
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

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Fat Bear Week Party",
  description: "RSVP for the Fat Bear Week draft-night party.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${archivoBlack.variable} ${silkscreen.variable} ${chakraPetch.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
