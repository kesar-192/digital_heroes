"use client";

import { useState } from "react";

const PRESETS_MINOR = [500, 1000, 2500]; // £5 / £10 / £25

export function DonateButton({ charityId, charityName }: { charityId: string; charityName: string }) {
  const [loading, setLoading] = useState<number | null>(null);

  async function donate(amountMinor: number) {
    setLoading(amountMinor);
    try {
      const res = await fetch("/api/donations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ charityId, amountMinor }),
      });
      const { url, error } = await res.json();
      if (url) window.location.href = url;
      else alert(error ?? "Could not start checkout.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <p className="text-sm text-white/60">Donate directly to {charityName} — no subscription needed.</p>
      <div className="mt-3 flex gap-2">
        {PRESETS_MINOR.map((amount) => (
          <button
            key={amount}
            onClick={() => donate(amount)}
            disabled={loading !== null}
            className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-50"
          >
            {loading === amount ? "…" : `£${amount / 100}`}
          </button>
        ))}
      </div>
    </div>
  );
}
