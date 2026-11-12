import { requireAdmin } from "@/lib/guard";
import MusicAdmin from "@/components/MusicAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Music · Fault Finders admin" };

export default async function Page() {
  await requireAdmin();
  return <MusicAdmin />;
}
