import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  charityId: z.string().uuid(),
  amountMinor: z.number().int().min(100), // e.g. minimum £1 / $1 donation
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid donation request." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(); // donations are allowed signed-out (guest donor)

  const { data: charity } = await supabase
    .from("charities")
    .select("id, name")
    .eq("id", parsed.data.charityId)
    .eq("is_active", true)
    .single();
  if (!charity) return NextResponse.json({ error: "Charity not found." }, { status: 404 });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "gbp",
          unit_amount: parsed.data.amountMinor,
          product_data: { name: `Donation to ${charity.name}` },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/charities/${parsed.data.charityId}?donated=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/charities/${parsed.data.charityId}`,
    metadata: {
      type: "donation",
      charity_id: charity.id,
      supabase_user_id: user?.id ?? "",
    },
  });

  return NextResponse.json({ url: session.url });
}
