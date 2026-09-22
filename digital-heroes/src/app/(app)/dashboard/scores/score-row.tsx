"use client";

import { useActionState, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateScore, deleteScore, type ScoreActionState } from "@/actions/scores";

type Score = { id: string; score_date: string; value: number };

export function ScoreRow({ score }: { score: Score }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateScore.bind(null, score.id);
  const [state, formAction, pending] = useActionState<ScoreActionState, FormData>(boundUpdate, null);

  if (editing) {
    return (
      <motion.li layout className="rounded-xl border border-emerald-400/40 bg-white/5 p-3">
        <form
          action={async (fd) => {
            await formAction(fd);
            setEditing(false);
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <input
            name="scoreDate"
            type="date"
            defaultValue={score.score_date}
            max={new Date().toISOString().slice(0, 10)}
            required
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          />
          <input
            name="value"
            type="number"
            min={1}
            max={45}
            defaultValue={score.value}
            required
            className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70"
          >
            Cancel
          </button>
          {state?.error && <p className="w-full text-xs text-red-400">{state.error}</p>}
        </form>
      </motion.li>
    );
  }

  return (
    <AnimatePresence>
      <motion.li
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
      >
        <div>
          <p className="text-sm font-medium text-white">{score.value} pts</p>
          <p className="text-xs text-white/50">{formatDate(score.score_date)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:border-white/30"
          >
            Edit
          </button>
          <form action={() => deleteScore(score.id)}>
            <button className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10">
              Delete
            </button>
          </form>
        </div>
      </motion.li>
    </AnimatePresence>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
