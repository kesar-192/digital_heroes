import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe/client";
import { PLANS, type PlanInterval } from "@/lib/stripe/plans";
import { requireProfile, AuthError } from "@/lib/auth/guards";

const bodySchema = z.object({
  interval: z.enum(["month", "year"] satisfies [PlanInterval, PlanInterval]),
});

export async function POST(request: Request) {
  try {
    const { profile } = await requireProfile();
    const { interval } = bodySchema.parse(await request.json());
    const plan = PLANS[interval];

    // Reuse the existing Stripe customer if we already created one, so a
    // user's billing history stays on a single customer across plan
    // changes instead of fragmenting on every checkout.
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name ?? undefined,
        metadata: { supabase_user_id: profile.id },
      });
      customerId = customer.id;
      // Not persisted to `profiles` here — the webhook's
      // customer.subscription.created handler is the single writer for
      // Stripe-derived fields, keeping one source of truth.
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?checkout=cancelled`,
      client_reference_id: profile.id,
      subscription_data: { metadata: { supabase_user_id: profile.id } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("checkout session error", err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
