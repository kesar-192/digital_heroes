import { CheckoutButton } from "./checkout-button";

export const metadata = { title: "Pricing · Digital Heroes" };

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-white">Plans</h1>
      <p className="mt-2 text-white/60">Cancel any time. A share of every payment goes to your charity.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Monthly</p>
          <p className="mt-2 text-3xl font-semibold text-white">£9.99</p>
          <p className="text-xs text-white/40">per month</p>
          <CheckoutButton interval="month" />
        </div>
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/5 p-6">
          <p className="text-sm text-emerald-400">Yearly</p>
          <p className="mt-2 text-3xl font-semibold text-white">£99.99</p>
          <p className="text-xs text-white/40">2 months free vs. monthly</p>
          <CheckoutButton interval="year" />
        </div>
      </div>
    </main>
  );
}
