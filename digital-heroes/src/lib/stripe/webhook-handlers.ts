import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { planIntervalFromPriceId } from "@/lib/stripe/plans";

/**
 * Every handler here runs AFTER signature verification in the route handler
 * and uses the admin (service-role) client, since these writes must succeed
 * regardless of RLS — they originate from Stripe, not from a logged-in
 * browser session.
 */

function subscriptionStatusFromStripe(
  status: Stripe.Subscription.Status
): "incomplete" | "trialing" | "active" | "past_due" | "canceled" {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

export async function upsertSubscription(subscription: Stripe.Subscription) {
  const supabase = createAdminClient();
  const userId = subscription.metadata.supabase_user_id;
  if (!userId) {
    console.error("Subscription webhook missing supabase_user_id metadata", subscription.id);
    return;
  }

  const item = subscription.items.data[0];
  if (!item) {
    console.error("Subscription webhook missing subscription item", subscription.id);
    return;
  }
  const interval = planIntervalFromPriceId(item.price.id);
  if (!interval) {
    console.error("Unrecognised Stripe price on subscription", item.price.id);
    return;
  }

  // Link the Stripe customer to the profile the first time we see it —
  // idempotent, safe to run on every event.
  await supabase
    .from("profiles")
    .update({ stripe_customer_id: subscription.customer as string })
    .eq("id", userId)
    .is("stripe_customer_id", null);

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: item.price.id,
      plan_interval: interval,
      status: subscriptionStatusFromStripe(subscription.status),
      amount_minor: item.price.unit_amount ?? 0,
      currency: item.price.currency,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    },
    { onConflict: "stripe_subscription_id" }
  );

  if (error) console.error("Failed to upsert subscription", subscription.id, error);
}

export async function markSubscriptionCanceled(subscription: Stripe.Subscription) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id);

  if (error) console.error("Failed to mark subscription canceled", subscription.id, error);
}

/**
 * On each successful invoice payment, splits off the subscriber's charity
 * percentage into the contributions ledger. `stripe_reference` (the invoice
 * id) is unique in the DB, so a retried webhook delivery is a harmless
 * no-op rather than a double-counted donation.
 */
/**
 * Standalone donations (checkout mode "payment", not a subscription) are
 * recorded here rather than in invoice.paid, since they never generate an
 * invoice. `stripe_reference` (the Checkout Session id) makes this idempotent
 * against webhook redelivery, same as the subscription contribution path.
 */
export async function recordDonationFromCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.type !== "donation" || session.mode !== "payment") return;
  const supabase = createAdminClient();

  const charityId = session.metadata.charity_id;
  const userId = session.metadata.supabase_user_id || null;
  if (!charityId || !session.amount_total) return;

  const { error } = await supabase.from("charity_contributions").insert({
    user_id: userId,
    charity_id: charityId,
    source: "donation",
    amount_minor: session.amount_total,
    currency: session.currency ?? "gbp",
    stripe_reference: session.id,
  });

  if (error && error.code !== "23505") {
    console.error("Failed to record donation", session.id, error);
  }
}

export async function recordCharityContributionFromInvoice(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return; // one-off invoice, not a subscription renewal
  const supabase = createAdminClient();

  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();
  if (!sub) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("charity_id, charity_percent")
    .eq("id", sub.user_id)
    .single();
  if (!profile?.charity_id) return;

  const amountMinor = Math.round((invoice.amount_paid * profile.charity_percent) / 100);
  if (amountMinor <= 0) return;

  const { error } = await supabase.from("charity_contributions").insert({
    user_id: sub.user_id,
    charity_id: profile.charity_id,
    source: "subscription",
    amount_minor: amountMinor,
    currency: invoice.currency,
    stripe_reference: invoice.id,
  });

  // Unique-violation on stripe_reference means we've already recorded this
  // invoice (Stripe redelivered the event) — safe to ignore.
  if (error && error.code !== "23505") {
    console.error("Failed to record charity contribution", invoice.id, error);
  }
}
