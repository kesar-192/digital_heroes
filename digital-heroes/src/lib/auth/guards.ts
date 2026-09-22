import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export class AuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
  }
}

/**
 * These guards are the real security boundary for mutations. middleware.ts
 * stops page navigation, but Server Actions and Route Handlers can be
 * invoked directly, so every one of them must call the relevant guard below
 * before touching data — never rely on the client having hidden a button.
 * RLS is the last line of defense if a guard is ever missed.
 */

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new AuthError(401, "You must be signed in.");
  return { supabase, user };
}

export async function requireProfile(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  profile: Profile;
}> {
  const { supabase, user } = await requireUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) throw new AuthError(401, "Profile not found.");
  return { supabase, profile };
}

export async function requireAdmin() {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== "admin") throw new AuthError(403, "Admin access required.");
  return { supabase, profile };
}

/**
 * Checks real-time entitlement via the has_active_subscription() SQL
 * function (same source of truth as the RLS policies on `scores`), so this
 * can never drift from what the database will actually allow.
 */
export async function requireActiveSubscriber() {
  const { supabase, profile } = await requireProfile();

  const { data: isActive, error } = await supabase.rpc("has_active_subscription", {
    p_user: profile.id,
  });

  if (error || !isActive) {
    throw new AuthError(403, "An active subscription is required for this action.");
  }
  return { supabase, profile };
}
