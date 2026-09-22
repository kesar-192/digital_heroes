"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type ActionState } from "@/actions/auth";

export const runtime = "nodejs";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(login, null);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold text-white">Welcome back</h1>

      <form action={formAction} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-white/80">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/70"
          />
          {state?.fieldErrors?.email && (
            <p className="mt-1 text-xs text-red-400">{state.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-white/80">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/70"
          />
        </div>

        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        New here?{" "}
        <Link href="/signup" className="text-emerald-400 hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
