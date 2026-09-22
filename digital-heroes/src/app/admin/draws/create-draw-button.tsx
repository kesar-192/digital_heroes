"use client";

import { useTransition } from "react";
import { createNextDraw } from "@/actions/draws";

export function CreateDrawButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => createNextDraw())}
      disabled={pending}
      className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-50"
    >
      {pending ? "Creating…" : "New draw"}
    </button>
  );
}
