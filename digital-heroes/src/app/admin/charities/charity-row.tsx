"use client";

import { useTransition } from "react";
import { toggleCharityActive, setFeaturedCharity } from "@/actions/charities";

type Charity = { id: string; name: string; is_active: boolean; is_featured: boolean };

export function CharityRow({ charity }: { charity: Charity }) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">{charity.name}</p>
        <p className="text-xs text-white/40">
          {charity.is_active ? "Active" : "Inactive"}
          {charity.is_featured ? " · Featured" : ""}
        </p>
      </div>
      <div className="flex gap-2">
        {!charity.is_featured && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => setFeaturedCharity(charity.id))}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:border-white/30"
          >
            Feature
          </button>
        )}
        <button
          disabled={pending}
          onClick={() => startTransition(() => toggleCharityActive(charity.id, !charity.is_active))}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:border-white/30"
        >
          {charity.is_active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </li>
  );
}
