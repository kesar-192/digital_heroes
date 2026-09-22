"use client";

import { useTransition } from "react";
import { reviewVerification, markPayoutPaid } from "@/actions/winners";

type Verification = {
  id: string;
  status: "pending" | "approved" | "rejected";
  payout_status: "pending" | "paid";
  proofUrl: string | null;
  profiles: { email: string; full_name: string | null }[];
  draw_entries: { tier: string | null; prize_minor: number }[];
};

export function VerificationRow({ verification: v }: { verification: Verification }) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">
            {v.profiles?.[0]?.full_name ?? v.profiles?.[0]?.email} — {v.draw_entries?.[0]?.tier?.replace("match_", "")}
            -match
          </p>
          <p className="text-xs text-white/50">£{((v.draw_entries?.[0]?.prize_minor ?? 0) / 100).toFixed(2)}</p>
          {v.proofUrl && (
            <a
              href={v.proofUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs text-emerald-400 hover:underline"
            >
              View proof →
            </a>
          )}
        </div>
        <span className="whitespace-nowrap rounded-full border border-white/15 px-2 py-0.5 text-xs uppercase text-white/60">
          {v.status}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        {v.status === "pending" && (
          <>
            <button
              disabled={pending}
              onClick={() => startTransition(() => reviewVerification(v.id, "approved"))}
              className="rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={pending}
              onClick={() => startTransition(() => reviewVerification(v.id, "rejected", "Proof unclear — please re-submit."))}
              className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
        {v.status === "approved" && v.payout_status === "pending" && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => markPayoutPaid(v.id))}
            className="rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
          >
            Mark paid
          </button>
        )}
        {v.status === "approved" && v.payout_status === "paid" && (
          <span className="text-xs text-emerald-400">Paid</span>
        )}
      </div>
    </li>
  );
}
