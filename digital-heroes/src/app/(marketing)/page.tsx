import Link from "next/link";
import { getFeaturedCharity } from "@/lib/charities/queries";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const [featuredCharity, supabase] = await Promise.all([getFeaturedCharity(), createClient()]);
  const { data: impactTotalMinor } = await supabase.rpc("charity_impact_total");

  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <section>
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">
          Play your rounds. Fund what matters.
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
          A monthly draw built on your golf scores — with a charity behind every entry.
        </h1>
        <p className="mt-6 max-w-xl text-white/60">
          Subscribe, log your last 5 rounds, and you&apos;re entered into a monthly prize draw. A
          share of every subscription goes straight to a charity you choose.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/pricing"
            className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-black hover:bg-emerald-300"
          >
            Subscribe
          </Link>
          <Link
            href="/how-it-works"
            className="rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-white hover:border-white/30"
          >
            How it works
          </Link>
        </div>

        {typeof impactTotalMinor === "number" && impactTotalMinor > 0 && (
          <p className="mt-10 text-sm text-white/40">
            £{(impactTotalMinor / 100).toLocaleString()} raised for charity so far
          </p>
        )}
      </section>

      {featuredCharity && (
        <section className="mt-20 rounded-2xl border border-white/10 bg-white/5 p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">
            Charity spotlight
          </p>
          <h2 className="mt-2 text-xl font-medium text-white">{featuredCharity.name}</h2>
          {featuredCharity.tagline && (
            <p className="mt-1 text-white/60">{featuredCharity.tagline}</p>
          )}
          <Link
            href={`/charities/${featuredCharity.slug}`}
            className="mt-4 inline-block text-sm text-emerald-400 hover:underline"
          >
            Learn more →
          </Link>
        </section>
      )}
    </main>
  );
}
