"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { signup, type ActionState } from "@/actions/auth";

type Charity = { id: string; name: string; tagline: string | null };

export function SignupForm({ charities }: { charities: Charity[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(signup, null);
  const [charityPercent, setCharityPercent] = useState(10);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <Field label="Full name" name="fullName" error={state?.fieldErrors?.fullName}>
        <input name="fullName" type="text" required className={inputClass} />
      </Field>

      <Field label="Email" name="email" error={state?.fieldErrors?.email}>
        <input name="email" type="email" required className={inputClass} />
      </Field>

      <Field label="Password" name="password" error={state?.fieldErrors?.password}>
        <input name="password" type="password" minLength={8} required className={inputClass} />
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-white/80">Choose a charity</legend>
        <div className="mt-2 grid gap-2">
          {charities.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-3 has-[:checked]:border-emerald-400/70 has-[:checked]:bg-emerald-400/5"
            >
              <input
                type="radio"
                name="charityId"
                value={c.id}
                required
                className="mt-1 accent-emerald-400"
              />
              <span>
                <span className="block text-sm font-medium text-white">{c.name}</span>
                {c.tagline && <span className="block text-xs text-white/50">{c.tagline}</span>}
              </span>
            </label>
          ))}
        </div>
        {state?.fieldErrors?.charityId && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.charityId}</p>
        )}
      </fieldset>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="charityPercent" className="text-sm font-medium text-white/80">
            Contribution
          </label>
          <motion.span
            key={charityPercent}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            className="text-sm font-semibold text-emerald-400"
          >
            {charityPercent}%
          </motion.span>
        </div>
        <input
          id="charityPercent"
          name="charityPercent"
          type="range"
          min={10}
          max={100}
          step={5}
          value={charityPercent}
          onChange={(e) => setCharityPercent(Number(e.target.value))}
          className="mt-2 w-full accent-emerald-400"
        />
        <p className="mt-1 text-xs text-white/40">10% minimum — increase it any time.</p>
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/70";

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-white/80">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
