"use client";

import { useActionState } from "react";
import { uploadWinnerProof, type WinnerActionState } from "@/actions/winners";

export function ProofUploadForm({ drawEntryId }: { drawEntryId: string }) {
  const boundUpload = uploadWinnerProof.bind(null, drawEntryId);
  const [state, formAction, pending] = useActionState<WinnerActionState, FormData>(boundUpload, null);

  return (
    <form action={formAction} className="mt-3 flex items-center gap-3">
      <input
        type="file"
        name="proof"
        accept="image/*"
        required
        className="text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-white"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Submit proof"}
      </button>
      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
    </form>
  );
}
