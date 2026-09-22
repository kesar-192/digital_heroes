import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Server-side Supabase instance (RLS-enforced, anon key). Use this in Server
 * Components, Server Actions, and Route Handlers — never the browser client.
 *
 * Must be created fresh per request (cookies() is request-scoped), so call
 * this function at the top of each Server Action / Route Handler rather than
 * hoisting a shared instance.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies (e.g. a
            // page render outside an Action/Route Handler). Safe to ignore —
            // middleware.ts refreshes the session on the next request.
          }
        },
      },
    }
  );
}
