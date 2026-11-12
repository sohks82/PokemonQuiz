import { requireAdmin } from "@/lib/guard";
import QuestionsAdmin from "@/components/QuestionsAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Questions · Fault Finders admin" };

export default async function Page() {
  await requireAdmin();
  return <QuestionsAdmin />;
}
