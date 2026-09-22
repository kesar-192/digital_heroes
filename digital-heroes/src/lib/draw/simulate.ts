import { drawRandomNumbers } from "./random";
import { drawWeightedNumbers } from "./algorithmic";
import { countMatches, tierForMatchCount } from "./match";
import { computePoolTotalMinor, computeTierPools, settleTier, type PlatformSettings } from "./prize-pool";
import type { DrawType, DrawSimulationResult, EligibleSubscriber, MatchTier } from "./types";

export type SimulateDrawInput = {
  drawType: DrawType;
  eligibleSubscribers: EligibleSubscriber[]; // must have exactly 5 scores to enter
  activeSubscriptions: { amountMinor: number; interval: "month" | "year" }[];
  jackpotCarriedInMinor: number;
  settings: PlatformSettings;
  /** Injectable for deterministic tests; defaults to the real generators. */
  numberGenerator?: (scores: number[][]) => number[];
};

export function simulateDraw(input: SimulateDrawInput): DrawSimulationResult {
  const { drawType, eligibleSubscribers, activeSubscriptions, jackpotCarriedInMinor, settings } = input;

  const allScores = eligibleSubscribers.map((s) => s.scores);
  const winningNumbers =
    input.numberGenerator?.(allScores) ??
    (drawType === "algorithmic" ? drawWeightedNumbers(allScores) : drawRandomNumbers());

  const poolTotalMinor = computePoolTotalMinor(activeSubscriptions, settings.prizePoolPercent);
  const tierPools = computeTierPools(poolTotalMinor, jackpotCarriedInMinor, settings);

  const matchedByUser = eligibleSubscribers.map((s) => {
    const matchedCount = countMatches(winningNumbers, s.scores);
    return { userId: s.userId, scores: s.scores, matchedCount, tier: tierForMatchCount(matchedCount) };
  });

  const winnerCounts: Record<MatchTier, number> = {
    match_5: matchedByUser.filter((m) => m.tier === "match_5").length,
    match_4: matchedByUser.filter((m) => m.tier === "match_4").length,
    match_3: matchedByUser.filter((m) => m.tier === "match_3").length,
  };

  const tiers = {
    match_5: settleTier(tierPools.match_5, winnerCounts.match_5),
    match_4: settleTier(tierPools.match_4, winnerCounts.match_4),
    match_3: settleTier(tierPools.match_3, winnerCounts.match_3),
  };

  // Jackpot rolls over only when match_5 had no winners this cycle.
  const jackpotRolledOverMinor = winnerCounts.match_5 === 0 ? tierPools.match_5 : 0;

  const entries = matchedByUser.map((m) => ({
    userId: m.userId,
    scoresSnapshot: m.scores,
    matchedCount: m.matchedCount,
    tier: m.tier,
    prizeMinor: m.tier ? tiers[m.tier].prizePerWinnerMinor : 0,
  }));

  return {
    drawType,
    winningNumbers,
    activeSubscriberCount: eligibleSubscribers.length,
    poolTotalMinor,
    jackpotCarriedInMinor,
    jackpotRolledOverMinor,
    tiers,
    entries,
  };
}
