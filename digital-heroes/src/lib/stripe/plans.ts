export type PlanInterval = "month" | "year";

export const PLANS: Record<PlanInterval, { priceId: string; label: string; blurb: string }> = {
  month: {
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    label: "Monthly",
    blurb: "Cancel any time.",
  },
  year: {
    priceId: process.env.STRIPE_PRICE_YEARLY!,
    label: "Yearly",
    blurb: "2 months free vs. paying monthly.",
  },
};

export function planIntervalFromPriceId(priceId: string): PlanInterval | null {
  if (priceId === PLANS.month.priceId) return "month";
  if (priceId === PLANS.year.priceId) return "year";
  return null;
}
