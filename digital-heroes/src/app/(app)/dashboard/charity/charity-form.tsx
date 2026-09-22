"use client";

import { useActionState, useState } from "react";
import { updateCharitySelection, type ProfileActionState } from "@/actions/profile";

type Charity = { id: string; name: string; tagline: string | null };

export function CharityForm({
  charities,
  currentCharityId,
  currentPercent,
}: {
  charities: Charity[];
  currentCharityId: string | null;
  currentPercent: number;
}) {
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(
    updateCharitySelection,
    null
  );
  const [percent, setPercent] = useState(currentPercent);

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div className="grid gap-2">
        {charities.map((c) => (
          <label
            key={c.id}
            className="flex items-start gap-3 rounded-xl border border-white/10 p-3 has-[:checked]:border-emerald-400/70 has-[:checked]:bg-emerald-400/5"
          >
            <input
              type="radio"
              name="charityId"
              value={c.id}
              defaultChecked={c.id === currentCharityId}
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

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="charityPercent" className="text-sm font-medium text-white/80">
            Contribution
          </label>
          <span className="text-sm font-semibold text-emerald-400">{percent}%</span>
        </div>
        <input
          id="charityPercent"
          name="charityPercent"
          type="range"
          min={10}
          max={100}
          step={5}
          value={percent}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="mt-2 w-full accent-emerald-400"
        />
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
