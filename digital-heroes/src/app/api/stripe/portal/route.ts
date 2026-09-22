import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { requireProfile, AuthError } from "@/lib/auth/guards";

export async function POST() {
  try {
    const { profile } = await requireProfile();

    if (!profile.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account yet." }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("billing portal error", err);
    return NextResponse.json({ error: "Could not open billing portal." }, { status: 500 });
  }
}
