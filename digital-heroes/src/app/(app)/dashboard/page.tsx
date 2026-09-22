import Link from "next/link";
import { requireProfile } from "@/lib/auth/guards";

export default async function DashboardPage() {
  const { supabase, profile } = await requireProfile();

  const [{ data: subscription }, { data: charity }, { data: entries }, { data: verifications }] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("status, plan_interval, current_period_end, cancel_at_period_end")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      profile.charity_id
        ? supabase.from("charities").select("name").eq("id", profile.charity_id).single()
        : Promise.resolve({ data: null }),
      supabase
        .from("draw_entries")
        .select("id, draw_id, matched_count, tier, prize_minor, draws(period, status)")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("winner_verifications")
        .select("payout_status, draw_entry_id")
        .eq("user_id", profile.id),
    ]);

  const totalWonMinor = (entries ?? []).reduce((sum, e) => sum + (e.prize_minor ?? 0), 0);
  const pendingPayout = (verifications ?? []).some((v) => v.payout_status === "pending");

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">Your dashboard</h1>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-medium text-white/60">Subscription</h2>
        {subscription ? (
          <>
            <p className="mt-1 text-lg text-white">
              {subscription.status === "active" || subscription.status === "trialing"
                ? "Active"
                : subscription.status === "past_due"
                  ? "Payment overdue"
                  : "Inactive"}{" "}
              <span className="text-sm text-white/40">· {subscription.plan_interval}ly</span>
            </p>
            <p className="mt-1 text-xs text-white/40">
              {subscription.cancel_at_period_end ? "Ends" : "Renews"} on{" "}
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          </>
        ) : (
          <p className="mt-1 text-white/50">
            No subscription yet —{" "}
            <Link href="/pricing" className="text-emerald-400 hover:underline">
              view plans
            </Link>
            .
          </p>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-medium text-white/60">Charity</h2>
        <p className="mt-1 text-lg text-white">{charity?.name ?? "Not selected"}</p>
        <p className="mt-1 text-xs text-white/40">{profile.charity_percent}% of your subscription</p>
        <Link href="/dashboard/charity" className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
          Change →
        </Link>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-medium text-white/60">Participation</h2>
        <p className="mt-1 text-lg text-white">{entries?.length ?? 0} draws entered</p>
        <Link href="/dashboard/scores" className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
          Enter this month&apos;s scores →
        </Link>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-medium text-white/60">Winnings</h2>
        <p className="mt-1 text-lg text-white">£{(totalWonMinor / 100).toFixed(2)} total won</p>
        {pendingPayout && <p className="mt-1 text-xs text-amber-400">Payout pending on one or more wins</p>}
        <Link href="/dashboard/winnings" className="mt-2 inline-block text-sm text-emerald-400 hover:underline">
          View winnings →
        </Link>
      </section>
    </main>
  );
}
