import type { Metadata } from "next";
import { TvScreen } from "@/components/bracket/TvScreen";

export const metadata: Metadata = { title: "Bracket Night · TV" };

export default function BracketTvPage() {
  return <TvScreen />;
}
