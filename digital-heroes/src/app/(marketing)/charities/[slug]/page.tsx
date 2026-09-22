import { notFound } from "next/navigation";
import { getCharityBySlug } from "@/lib/charities/queries";
import { DonateButton } from "./donate-button";

type CharityEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
};

export default async function CharityProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const charity = await getCharityBySlug(slug);
  if (!charity) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-white">{charity.name}</h1>
      {charity.tagline && <p className="mt-2 text-lg text-emerald-400">{charity.tagline}</p>}
      {charity.description && <p className="mt-6 text-white/70">{charity.description}</p>}

      <div className="mt-8">
        <DonateButton charityId={charity.id} charityName={charity.name} />
      </div>

      {charity.events.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-medium text-white">Upcoming events</h2>
          <ul className="mt-4 space-y-3">
            {charity.events.map((event: CharityEvent) => (
              <li key={event.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">{event.title}</p>
                <p className="text-xs text-white/50">
                  {new Date(event.starts_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
                {event.description && (
                  <p className="mt-2 text-sm text-white/60">{event.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
