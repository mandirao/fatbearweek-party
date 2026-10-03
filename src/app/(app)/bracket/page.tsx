import { BracketPhone } from "@/components/bracket/phone/BracketPhone";

export default async function BracketPage({ searchParams }: PageProps<"/bracket">) {
  const { as } = await searchParams;
  return <BracketPhone key={typeof as === "string" ? as : "me"} asId={typeof as === "string" ? as : null} />;
}
