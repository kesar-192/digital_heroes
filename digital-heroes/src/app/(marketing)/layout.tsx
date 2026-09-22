import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-sm font-semibold tracking-wide text-white">
          DIGITAL HEROES
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white/60">
          <Link href="/charities" className="hover:text-white">
            Charities
          </Link>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          {user ? (
            <Link href="/dashboard" className="rounded-lg bg-white/10 px-3 py-1.5 text-white hover:bg-white/20">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="hover:text-white">
              Sign in
            </Link>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
