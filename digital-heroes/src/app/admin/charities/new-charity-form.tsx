"use client";

import { useActionState, useRef, useEffect } from "react";
import { createCharity, type CharityActionState } from "@/actions/charities";

export function NewCharityForm() {
  const [state, formAction, pending] = useActionState<CharityActionState, FormData>(createCharity, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === null) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-6 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2"
    >
      <input name="name" placeholder="Name" required className={inputClass} />
      <input name="slug" placeholder="url-slug" required className={inputClass} />
      <input name="tagline" placeholder="Tagline" className={`sm:col-span-2 ${inputClass}`} />
      <textarea
        name="description"
        placeholder="Description"
        rows={3}
        className={`sm:col-span-2 ${inputClass}`}
      />
      <input name="websiteUrl" placeholder="Website URL (optional)" className={inputClass} />
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" name="isFeatured" className="accent-emerald-400" />
        Feature on homepage
      </label>

      {state?.error && <p className="text-sm text-red-400 sm:col-span-2">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-50 sm:col-span-2"
      >
        {pending ? "Adding…" : "Add charity"}
      </button>
    </form>
  );
}

const inputClass =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/70";
