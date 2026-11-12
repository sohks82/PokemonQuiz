import { requireAdmin } from "@/lib/guard";
import SessionAdmin from "@/components/SessionAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Class session · Fault Finders admin" };

export default async function Page({ params }) {
  await requireAdmin();
  const { id } = await params;
  return <SessionAdmin id={Number(id)} />;
}
