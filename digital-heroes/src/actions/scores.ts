"use server";

import { revalidatePath } from "next/cache";
import { scoreSchema } from "@/lib/scores/rules";
import { requireActiveSubscriber } from "@/lib/auth/guards";

export type ScoreActionState = { error?: string; fieldErrors?: Record<string, string> } | null;

export async function addScore(_prev: ScoreActionState, formData: FormData): Promise<ScoreActionState> {
  const parsed = scoreSchema.safeParse({
    scoreDate: formData.get("scoreDate"),
    value: formData.get("value"),
  });
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  const { supabase, profile } = await requireActiveSubscriber();

  const { error } = await supabase
    .from("scores")
    .insert({ user_id: profile.id, score_date: parsed.data.scoreDate, value: parsed.data.value });

  if (error) {
    // 23505 = unique_violation on (user_id, score_date) — the PRD requires
    // duplicate dates to be edited rather than inserted again.
    if (error.code === "23505") {
      return { error: "You already have a score for that date — edit it instead of adding a new one." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/scores");
  return null;
}

export async function updateScore(
  scoreId: string,
  _prev: ScoreActionState,
  formData: FormData
): Promise<ScoreActionState> {
  const parsed = scoreSchema.safeParse({
    scoreDate: formData.get("scoreDate"),
    value: formData.get("value"),
  });
  if (!parsed.success) return fieldErrorsFrom(parsed.error);

  const { supabase, profile } = await requireActiveSubscriber();

  const { error } = await supabase
    .from("scores")
    .update({ score_date: parsed.data.scoreDate, value: parsed.data.value })
    .eq("id", scoreId)
    .eq("user_id", profile.id); // belt-and-braces alongside RLS

  if (error) {
    if (error.code === "23505") {
      return { error: "Another entry already uses that date." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/scores");
  return null;
}

export async function deleteScore(scoreId: string) {
  const { supabase, profile } = await requireActiveSubscriber();

  const { error } = await supabase.from("scores").delete().eq("id", scoreId).eq("user_id", profile.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/scores");
}

function fieldErrorsFrom(error: import("zod").ZodError): ScoreActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[String(issue.path[0])] = issue.message;
  return { fieldErrors };
}
