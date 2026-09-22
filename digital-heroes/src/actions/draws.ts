"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { simulateDraw } from "@/lib/draw/simulate";
import type { DrawType } from "@/lib/draw/types";

/**
 * Pulls every input the pure engine needs, then calls it. Kept separate from
 * simulateDraw() itself so the engine stays DB-free and unit-testable while
 * this function is the (thin, easy-to-review) glue layer.
 */
async function gatherAndSimulate(drawId: string, drawType: DrawType) {
  const { supabase } = await requireAdmin();

  const [{ data: settingsRow }, { data: draw }] = await Promise.all([
    supabase.from("platform_settings").select("*").single(),
    supabase.from("draws").select("*").eq("id", drawId).single(),
  ]);
  if (!settingsRow) throw new Error("Platform settings not found.");
  if (!draw) throw new Error("Draw not found.");
  if (draw.status === "published") throw new Error("This draw is already published.");

  const { data: activeSubs } = await supabase
    .from("subscriptions")
    .select("user_id, amount_minor, plan_interval")
    .in("status", ["active", "trialing"])
    .gt("current_period_end", new Date().toISOString());

  const activeUserIds = (activeSubs ?? []).map((s) => s.user_id);

  // Eligible = active subscriber with exactly 5 scores recorded (their
  // "ticket"). Fewer than 5 means no draw entry this cycle — surfaced to
  // admins in the simulation summary, and worth stating as an assumption
  // in the README since the PRD doesn't specify a minimum.
  const { data: scoreRows } = await supabase
    .from("scores")
    .select("user_id, value")
    .in("user_id", activeUserIds.length ? activeUserIds : ["00000000-0000-0000-0000-000000000000"]);

  const scoresByUser = new Map<string, number[]>();
  for (const row of scoreRows ?? []) {
    const list = scoresByUser.get(row.user_id) ?? [];
    list.push(row.value);
    scoresByUser.set(row.user_id, list);
  }

  const eligibleSubscribers = activeUserIds
    .filter((id) => (scoresByUser.get(id)?.length ?? 0) === 5)
    .map((id) => ({ userId: id, scores: scoresByUser.get(id)! }));

  const result = simulateDraw({
    drawType,
    eligibleSubscribers,
    activeSubscriptions: (activeSubs ?? []).map((s) => ({
      amountMinor: s.amount_minor,
      interval: s.plan_interval as "month" | "year",
    })),
    jackpotCarriedInMinor: draw.jackpot_carried_in_minor,
    settings: {
      prizePoolPercent: settingsRow.prize_pool_percent,
      shareMatch5: settingsRow.share_match_5,
      shareMatch4: settingsRow.share_match_4,
      shareMatch3: settingsRow.share_match_3,
    },
  });

  return result;
}

export async function runSimulation(drawId: string, drawType: DrawType) {
  const { supabase, profile } = await requireAdmin();
  const result = await gatherAndSimulate(drawId, drawType);

  const { error } = await supabase.from("draw_simulations").insert({
    draw_id: drawId,
    draw_type: drawType,
    winning_numbers: result.winningNumbers,
    result,
    created_by: profile.id,
  });
  if (error) throw new Error(error.message);

  await supabase.from("draws").update({ status: "simulated", draw_type: drawType }).eq("id", drawId);

  revalidatePath("/admin/draws");
  return result;
}

export async function publishDraw(drawId: string, drawType: DrawType) {
  const { supabase } = await requireAdmin();
  const result = await gatherAndSimulate(drawId, drawType);

  const { error } = await supabase.rpc("publish_draw", {
    p_draw_id: drawId,
    p_winning_numbers: result.winningNumbers,
    p_active_subscriber_count: result.activeSubscriberCount,
    p_pool_total_minor: result.poolTotalMinor,
    p_jackpot_carried_in_minor: result.jackpotCarriedInMinor,
    p_pool_match_5_minor: result.tiers.match_5.poolMinor,
    p_pool_match_4_minor: result.tiers.match_4.poolMinor,
    p_pool_match_3_minor: result.tiers.match_3.poolMinor,
    p_jackpot_rolled_over_minor: result.jackpotRolledOverMinor,
    p_entries: result.entries.map((e) => ({
      user_id: e.userId,
      scores_snapshot: e.scoresSnapshot,
      matched_count: e.matchedCount,
      tier: e.tier ?? "",
      prize_minor: e.prizeMinor,
    })),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/draws");
  return result;
}

export async function createNextDraw() {
  const { supabase } = await requireAdmin();

  const now = new Date();
  const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);

  const { error } = await supabase.from("draws").insert({ period, status: "draft" });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/draws");
}
