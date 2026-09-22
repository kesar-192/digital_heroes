import { createClient } from "@/lib/supabase/server";

/** Active charities for the signup picker / directory — public data, no auth needed. */
export async function getActiveCharities() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("charities")
    .select("id, name, slug, tagline, image_path")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("name");

  if (error) throw error;
  return data;
}

/** Directory listing with optional free-text search over name + description. */
export async function searchCharities(query?: string) {
  const supabase = await createClient();
  let builder = supabase
    .from("charities")
    .select("id, name, slug, tagline, image_path, is_featured")
    .eq("is_active", true);

  if (query?.trim()) {
    const term = query.trim().replace(/[%_]/g, "");
    builder = builder.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error } = await builder.order("is_featured", { ascending: false }).order("name");
  if (error) throw error;
  return data;
}

export async function getFeaturedCharity() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("charities")
    .select("id, name, slug, tagline, description, image_path")
    .eq("is_active", true)
    .eq("is_featured", true)
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getCharityBySlug(slug: string) {
  const supabase = await createClient();

  const { data: charity } = await supabase
    .from("charities")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (!charity) return null;

  const { data: events } = await supabase
    .from("charity_events")
    .select("id, title, description, location, starts_at")
    .eq("charity_id", charity.id)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at");

  return { ...charity, events: events ?? [] };
}

