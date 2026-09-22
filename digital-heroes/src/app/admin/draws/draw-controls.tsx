"use client";

import { useState, useTransition } from "react";
import { runSimulation, publishDraw } from "@/actions/draws";
import type { DrawType, DrawSimulationResult } from "@/lib/draw/types";

export function DrawControls({ drawId }: { drawId: string }) {
  const [drawType, setDrawType] = useState<DrawType>("random");
  const [result, setResult] = useState<DrawSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function simulate() {
    setError(null);
    startTransition(async () => {
      try {
        setResult(await runSimulation(drawId, drawType));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Simulation failed.");
      }
    });
  }

  function publish() {
    if (!confirm("Publish this draw? This is final and cannot be edited afterwards.")) return;
    setError(null);
    startTransition(async () => {
      try {
        await publishDraw(drawId, drawType);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Publish failed.");
      }
    });
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-3">
        <select
          value={drawType}
          onChange={(e) => setDrawType(e.target.value as DrawType)}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="random">Random</option>
          <option value="algorithmic">Algorithmic (score-weighted)</option>
        </select>
        <button
          onClick={simulate}
          disabled={pending}
          className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:border-white/30 disabled:opacity-50"
        >
          {pending ? "Working…" : "Simulate"}
        </button>
        <button
          onClick={publish}
          disabled={pending || !result}
          className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-50"
        >
          Publish
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {result && (
        <div className="rounded-lg bg-black/30 p-4 text-sm text-white/80">
          <p>
            Numbers: <span className="font-medium text-white">{result.winningNumbers.join(", ")}</span>
          </p>
          <p className="mt-1">Eligible subscribers: {result.activeSubscriberCount}</p>
          <p className="mt-1">Pool total: £{(result.poolTotalMinor / 100).toFixed(2)}</p>
          <ul className="mt-2 space-y-1 text-xs text-white/60">
            {(["match_5", "match_4", "match_3"] as const).map((tier) => (
              <li key={tier}>
                {tier.replace("match_", "")}-match: {result.tiers[tier].winnerCount} winner(s) · £
                {(result.tiers[tier].prizePerWinnerMinor / 100).toFixed(2)} each
              </li>
            ))}
          </ul>
          {result.jackpotRolledOverMinor > 0 && (
            <p className="mt-2 text-amber-400">
              Jackpot rolls over: £{(result.jackpotRolledOverMinor / 100).toFixed(2)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
