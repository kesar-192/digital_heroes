import { requireProfile } from "@/lib/auth/guards";
import { AddScoreForm } from "./add-score-form";
import { ScoreRow } from "./score-row";
import Link from "next/link";

export const metadata = { title: "Your scores · Digital Heroes" };

export default async function ScoresPage() {
  const { supabase, profile } = await requireProfile();

  const [{ data: scores }, { data: isActive }] = await Promise.all([
    supabase
      .from("scores")
      .select("id, score_date, value")
      .eq("user_id", profile.id)
      .order("score_date", { ascending: false }),
    supabase.rpc("has_active_subscription", { p_user: profile.id }),
  ]);

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">Your scores</h1>
      <p className="mt-1 text-sm text-white/60">
        Your latest 5 Stableford rounds. A new entry replaces the oldest automatically.
      </p>

      {!isActive ? (
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-white/70">
            Score entry is available to active subscribers.
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-block rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
          >
            View plans
          </Link>
        </div>
      ) : (
        <>
          <AddScoreForm />

          <ul className="mt-8 space-y-3">
            {scores?.length ? (
              scores.map((s) => <ScoreRow key={s.id} score={s} />)
            ) : (
              <li className="text-sm text-white/40">No scores yet — add your first round above.</li>
            )}
          </ul>
        </>
      )}
    </main>
  );
}
