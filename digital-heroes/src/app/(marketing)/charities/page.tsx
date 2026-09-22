import Link from "next/link";
import { searchCharities } from "@/lib/charities/queries";

export const metadata = { title: "Charities · Digital Heroes" };

export default async function CharityDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const charities = await searchCharities(q);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-white">Charities</h1>
      <p className="mt-2 text-white/60">Every subscription sends part of its fee to one of these.</p>

      <form className="mt-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search charities…"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/70"
        />
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {charities.length === 0 && <p className="text-sm text-white/40">No charities match that search.</p>}
        {charities.map((c) => (
          <Link
            key={c.id}
            href={`/charities/${c.slug}`}
            className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/50"
          >
            {c.is_featured && (
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">
                Featured
              </span>
            )}
            <h2 className="mt-1 text-lg font-medium text-white">{c.name}</h2>
            {c.tagline && <p className="mt-1 text-sm text-white/50">{c.tagline}</p>}
          </Link>
        ))}
      </div>
    </main>
  );
}
