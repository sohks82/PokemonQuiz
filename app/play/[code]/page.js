import Game from "@/components/Game";

export const dynamic = "force-dynamic";

export default async function PlayPage({ params }) {
  const { code } = await params;
  return <Game code={String(code).toUpperCase()} />;
}
