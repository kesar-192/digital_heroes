"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CheckoutButton({ interval }: { interval: "month" | "year" }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function startCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/pricing`);
        return;
      }

      const { url, error } = await res.json();
      if (url) window.location.href = url;
      else alert(error ?? "Could not start checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={startCheckout}
      disabled={loading}
      className="mt-4 w-full rounded-xl bg-emerald-400 py-2.5 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-50"
    >
      {loading ? "Redirecting…" : "Subscribe"}
    </button>
  );
}
