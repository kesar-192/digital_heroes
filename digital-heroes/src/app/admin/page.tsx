import { requireAdmin } from "@/lib/auth/guards";

export const metadata = { title: "Admin · Digital Heroes" };

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();
  const { data: stats } = await supabase.rpc("admin_dashboard_stats");

  const cards = [
    { label: "Total users", value: stats?.total_users ?? 0 },
    { label: "Active subscribers", value: stats?.active_subscribers ?? 0 },
    { label: "Total prize pool", value: `£${((stats?.total_prize_pool_minor ?? 0) / 100).toFixed(2)}` },
    { label: "Charity total raised", value: `£${((stats?.charity_total_minor ?? 0) / 100).toFixed(2)}` },
    { label: "Draws published", value: stats?.draws_published ?? 0 },
    { label: "Pending verifications", value: stats?.pending_verifications ?? 0 },
    { label: "Pending payouts", value: stats?.pending_payouts ?? 0 },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">Overview</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs text-white/50">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{c.value}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
