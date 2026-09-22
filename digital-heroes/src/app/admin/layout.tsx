import Link from "next/link";
import { logout } from "@/actions/auth";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/draws", label: "Draws" },
  { href: "/admin/charities", label: "Charities" },
  { href: "/admin/winners", label: "Winners" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl gap-8 px-6 py-6">
      <aside className="w-40 shrink-0">
        <p className="text-xs font-semibold tracking-wide text-white/40">ADMIN</p>
        <nav className="mt-6 flex flex-col gap-1 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-white/70 hover:bg-white/5 hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-8">
          <button className="px-3 text-xs text-white/40 hover:text-white/70">Sign out</button>
        </form>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
