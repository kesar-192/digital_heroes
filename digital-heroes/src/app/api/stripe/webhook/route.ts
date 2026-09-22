import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import {
  upsertSubscription,
  markSubscriptionCanceled,
  recordCharityContributionFromInvoice,
  recordDonationFromCheckoutSession,
} from "@/lib/stripe/webhook-handlers";

// Stripe needs the raw body to verify the signature — this route must never
// run through any JSON body-parsing middleware.
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await markSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;

      case "checkout.session.completed":
        await recordDonationFromCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;

      case "invoice.paid":
        await recordCharityContributionFromInvoice(event.data.object as Stripe.Invoice);
        break;

      // Unhandled events are expected and fine to ignore — Stripe sends many
      // more event types than this app needs to act on.
      default:
        break;
    }
  } catch (err) {
    // Returning 500 tells Stripe to retry delivery; every handler above is
    // written to be safely re-runnable (upsert / unique-constraint no-ops).
    console.error(`Error handling Stripe event ${event.type}`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
