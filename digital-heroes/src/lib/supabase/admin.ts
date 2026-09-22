import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role Supabase client. BYPASSES ROW LEVEL SECURITY.
 *
 * Only ever import this from trusted server code that has already verified
 * the caller (Stripe webhook signature, or an admin-guarded Server Action /
 * Route Handler). NEVER import this file from a Client Component, and never
 * call it before running the relevant guard in lib/auth/guards.ts.
 *
 * Used for: Stripe webhook writes to `subscriptions` / `charity_contributions`,
 * and the draw publish routine (writes `draw_entries` at scale).
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() must never be called from the browser.");
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
