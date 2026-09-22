import { requireProfile } from "@/lib/auth/guards";
import { ProofUploadForm } from "./proof-upload-form";

export const metadata = { title: "Winnings · Digital Heroes" };

export default async function WinningsPage() {
  const { supabase, profile } = await requireProfile();

  const { data: winningEntries } = await supabase
    .from("draw_entries")
    .select(
      "id, tier, prize_minor, draws(period), winner_verifications(status, payout_status, review_note)"
    )
    .eq("user_id", profile.id)
    .not("tier", "is", null)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">Winnings</h1>

      <ul className="mt-8 space-y-4">
        {!winningEntries?.length && <li className="text-sm text-white/40">No wins yet — good luck next draw!</li>}

        {winningEntries?.map((entry) => {
          const verification = entry.winner_verifications?.[0];
          return (
            <li key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">
                    {entry.tier?.replace("match_", "")}-number match ·{" "}
                    {new Date(entry.draws?.[0]?.period as string).toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-emerald-400">£{((entry.prize_minor ?? 0) / 100).toFixed(2)}</p>
                </div>
                <StatusBadge
                  status={verification?.status}
                  payoutStatus={verification?.payout_status}
                />
              </div>

              {!verification && <ProofUploadForm drawEntryId={entry.id} />}
              {verification?.status === "rejected" && (
                <div>
                  <p className="mt-2 text-xs text-red-400">
                    {verification.review_note ?? "Rejected — please re-submit your proof."}
                  </p>
                  <ProofUploadForm drawEntryId={entry.id} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function StatusBadge({
  status,
  payoutStatus,
}: {
  status?: string;
  payoutStatus?: string;
}) {
  if (!status) return <span className="text-xs text-white/40">Proof needed</span>;
  if (status === "pending") return <span className="text-xs text-amber-400">Under review</span>;
  if (status === "rejected") return <span className="text-xs text-red-400">Rejected</span>;
  return (
    <span className="text-xs text-emerald-400">
      Approved · {payoutStatus === "paid" ? "Paid" : "Payout pending"}
    </span>
  );
}
