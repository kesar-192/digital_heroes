"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/guards";

const schema = z.object({
  charityId: z.string().uuid(),
  charityPercent: z.coerce.number().min(10).max(100),
});

export type ProfileActionState = { error?: string } | null;

export async function updateCharitySelection(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const parsed = schema.safeParse({
    charityId: formData.get("charityId"),
    charityPercent: formData.get("charityPercent"),
  });
  if (!parsed.success) return { error: "Choose a charity and a valid percentage." };

  const { supabase, profile } = await requireProfile();

  const { error } = await supabase
    .from("profiles")
    .update({ charity_id: parsed.data.charityId, charity_percent: parsed.data.charityPercent })
    .eq("id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/charity");
  revalidatePath("/dashboard");
  return null;
}
