import Board from "@/components/Board";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leaderboard · Fault Finders" };

export default async function Page({ params }) {
  const { code } = await params;
  return <Board code={String(code).toUpperCase()} />;
}
