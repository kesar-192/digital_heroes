/** Every amount in the DB and Stripe payloads is integer minor units (pence). */
export function formatMinor(amountMinor: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amountMinor / 100);
}
