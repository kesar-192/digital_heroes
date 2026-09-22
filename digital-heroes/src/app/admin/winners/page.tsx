import { requireAdmin } from "@/lib/auth/guards";
import { VerificationRow } from "./verification-row";

export const metadata = { title: "Winners · Admin · Digital Heroes" };

export default async function AdminWinnersPage() {
  const { supabase } = await requireAdmin();

  const { data: verifications } = await supabase
    .from("winner_verifications")
    .select(
      "id, status, payout_status, proof_path, created_at, profiles(email, full_name), draw_entries(tier, prize_minor)"
    )
    .order("created_at", { ascending: false });

  // Signed URLs for the private proof bucket — generated server-side since
  // the bucket is not public.
  const withUrls = await Promise.all(
    (verifications ?? []).map(async (v) => {
      const { data } = await supabase.storage.from("winner-proofs").createSignedUrl(v.proof_path, 3600);
      return { ...v, proofUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">Winner verification</h1>

      <ul className="mt-8 space-y-4">
        {withUrls.length === 0 && <li className="text-sm text-white/40">No submissions yet.</li>}
        {withUrls.map((v) => (
          <VerificationRow key={v.id} verification={v} />
        ))}
      </ul>
    </main>
  );
}
