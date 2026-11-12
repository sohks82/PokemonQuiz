"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Brand from "./Brand";
import { api } from "./api";

export default function AdminTop() {
  const router = useRouter();
  const path = usePathname() || "";
  const link = (href, label, active) => <Link className={"btn ghost" + (active ? " on" : "")} href={href} aria-current={active ? "page" : undefined}>{label}</Link>;
  return (
    <div className="topbar">
      <Brand sub="Teacher admin" href="/admin" />
      <nav className="nav" aria-label="Admin">
        {link("/admin", "Classes", path === "/admin" || path.startsWith("/admin/s/"))}
        {link("/admin/questions", "Questions", path.startsWith("/admin/questions"))}
        {link("/admin/music", "Music", path.startsWith("/admin/music"))}
        <button className="btn ghost" onClick={async () => { await api("/api/admin/logout", { method: "POST" }).catch(() => {}); router.replace("/admin/login"); router.refresh(); }}>Log out</button>
      </nav>
    </div>
  );
}
