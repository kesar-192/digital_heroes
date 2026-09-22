"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";

const charitySchema = z.object({
  name: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  tagline: z.string().trim().optional(),
  description: z.string().trim().optional(),
  websiteUrl: z.string().trim().url().optional().or(z.literal("")),
  isFeatured: z.boolean().optional(),
});

export type CharityActionState = { error?: string } | null;

export async function createCharity(
  _prev: CharityActionState,
  formData: FormData
): Promise<CharityActionState> {
  const parsed = charitySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    tagline: formData.get("tagline") || undefined,
    description: formData.get("description") || undefined,
    websiteUrl: formData.get("websiteUrl") || "",
    isFeatured: formData.get("isFeatured") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { supabase } = await requireAdmin();
  const { name, slug, tagline, description, websiteUrl, isFeatured } = parsed.data;

  const { error } = await supabase.from("charities").insert({
    name,
    slug,
    tagline: tagline ?? null,
    description: description ?? null,
    website_url: websiteUrl || null,
    is_featured: isFeatured ?? false,
  });

  if (error) return { error: error.code === "23505" ? "That slug is already in use." : error.message };

  revalidatePath("/admin/charities");
  revalidatePath("/charities");
  return null;
}

export async function toggleCharityActive(charityId: string, isActive: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("charities").update({ is_active: isActive }).eq("id", charityId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/charities");
  revalidatePath("/charities");
}

export async function setFeaturedCharity(charityId: string) {
  const { supabase } = await requireAdmin();

  // Only one spotlight charity at a time — clear the rest first.
  await supabase.from("charities").update({ is_featured: false }).neq("id", charityId);
  const { error } = await supabase.from("charities").update({ is_featured: true }).eq("id", charityId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/charities");
  revalidatePath("/");
}
