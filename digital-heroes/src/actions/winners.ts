"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin, AuthError } from "@/lib/auth/guards";

export type WinnerActionState = { error?: string } | null;

/** Subscriber uploads proof for one of their own winning draw entries. */
export async function uploadWinnerProof(
  drawEntryId: string,
  _prev: WinnerActionState,
  formData: FormData
): Promise<WinnerActionState> {
  const file = formData.get("proof");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a screenshot to upload." };
  if (!file.type.startsWith("image/")) return { error: "Upload an image file." };
  if (file.size > 8 * 1024 * 1024) return { error: "File is too large (8MB max)." };

  try {
    const { supabase, user } = await requireUser();

    const path = `${user.id}/${drawEntryId}-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("winner-proofs").upload(path, file, {
      contentType: file.type,
    });
    if (uploadError) return { error: uploadError.message };

    // RLS's wv_insert policy re-verifies draw_entry_id belongs to this user
    // AND actually won a tier — the upload above is not itself proof of
    // eligibility.
    const { error } = await supabase.from("winner_verifications").insert({
      draw_entry_id: drawEntryId,
      user_id: user.id,
      proof_path: path,
    });
    if (error) return { error: error.message };

    revalidatePath("/dashboard/winnings");
    return null;
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "Upload failed. Try again." };
  }
}

export async function reviewVerification(
  verificationId: string,
  decision: "approved" | "rejected",
  note?: string
) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("winner_verifications")
    .update({
      status: decision,
      review_note: note ?? null,
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", verificationId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/winners");
}

export async function markPayoutPaid(verificationId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("winner_verifications")
    .update({ payout_status: "paid", paid_at: new Date().toISOString() })
    .eq("id", verificationId)
    .eq("status", "approved"); // DB constraint backs this up too

  if (error) throw new Error(error.message);
  revalidatePath("/admin/winners");
}
