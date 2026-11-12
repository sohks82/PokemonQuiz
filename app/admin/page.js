import { requireAdmin } from "@/lib/guard";
import AdminHome from "@/components/AdminHome";

export const dynamic = "force-dynamic";
export const metadata = { title: "Classes · Fault Finders admin" };

export default async function Page() {
  await requireAdmin();
  return <AdminHome />;
}
