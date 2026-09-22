import type { TierResult, MatchTier } from "./types";

export type PlatformSettings = {
  prizePoolPercent: number; // % of subscription revenue that funds the pool
  shareMatch5: number;
  shareMatch4: number;
  shareMatch3: number;
};

export type ActiveSubscription = { amountMinor: number; interval: "month" | "year" };

/**
 * This month's revenue that feeds the pool. Yearly plans are normalised to
 * a monthly equivalent (amount / 12) so a mix of monthly and yearly
 * subscribers contributes proportionally to one draw cycle rather than a
 * yearly subscriber dumping 12 months of value into a single month.
 */
export function computePoolTotalMinor(
  subscriptions: ActiveSubscription[],
  prizePoolPercent: number
): number {
  const monthlyRevenue = subscriptions.reduce((sum, s) => {
    const monthlyEquivalent = s.interval === "year" ? s.amountMinor / 12 : s.amountMinor;
    return sum + monthlyEquivalent;
  }, 0);

  return Math.round(monthlyRevenue * (prizePoolPercent / 100));
}

export function computeTierPools(
  poolTotalMinor: number,
  jackpotCarriedInMinor: number,
  settings: PlatformSettings
) {
  return {
    match_5: Math.round(poolTotalMinor * (settings.shareMatch5 / 100)) + jackpotCarriedInMinor,
    match_4: Math.round(poolTotalMinor * (settings.shareMatch4 / 100)),
    match_3: Math.round(poolTotalMinor * (settings.shareMatch3 / 100)),
  } satisfies Record<MatchTier, number>;
}

/**
 * Splits a tier's pool equally among its winners (integer division — any
 * remainder from rounding stays in the platform's float rather than being
 * distributed, which is standard lottery practice and avoids fractional
 * minor-unit payouts). Match-5 rolls over to the next draw only when it has
 * zero winners.
 */
export function settleTier(poolMinor: number, winnerCount: number): TierResult {
  const prizePerWinnerMinor = winnerCount > 0 ? Math.floor(poolMinor / winnerCount) : 0;
  return { poolMinor, winnerCount, prizePerWinnerMinor };
}
