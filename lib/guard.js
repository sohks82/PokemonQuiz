import { redirect } from "next/navigation";
import { isAdmin } from "./auth";

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
