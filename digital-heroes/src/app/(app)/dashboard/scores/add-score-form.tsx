"use client";

import { useActionState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { addScore, type ScoreActionState } from "@/actions/scores";

export function AddScoreForm() {
  const [state, formAction, pending] = useActionState<ScoreActionState, FormData>(addScore, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) formRef.current?.reset(); // successful submit clears the form
  }, [state]);

  return (
    <motion.form
      ref={formRef}
      action={formAction}
      layout
      className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
    >
      <div>
        <label htmlFor="scoreDate" className="text-xs text-white/60">
          Date
        </label>
        <input
          id="scoreDate"
          name="scoreDate"
          type="date"
          required
          max={new Date().toISOString().slice(0, 10)}
          className="mt-1 block rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/70"
        />
      </div>

      <div>
        <label htmlFor="value" className="text-xs text-white/60">
          Stableford score
        </label>
        <input
          id="value"
          name="value"
          type="number"
          min={1}
          max={45}
          required
          className="mt-1 block w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/70"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add score"}
      </button>

      {state?.error && <p className="w-full text-xs text-red-400">{state.error}</p>}
      {state?.fieldErrors?.scoreDate && (
        <p className="w-full text-xs text-red-400">{state.fieldErrors.scoreDate}</p>
      )}
      {state?.fieldErrors?.value && (
        <p className="w-full text-xs text-red-400">{state.fieldErrors.value}</p>
      )}
    </motion.form>
  );
}
