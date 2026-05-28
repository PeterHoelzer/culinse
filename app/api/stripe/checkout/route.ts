import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, is_pro")
    .eq("id", user.id)
    .single();

  // Already Pro — redirect to portal
  if (profile?.is_pro) {
    return NextResponse.json({ url: "/profile" });
  }

  let customerId = profile?.stripe_customer_id;
  const stripe = getStripe();

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    // Save customer ID
    await supabase
      .from("profiles")
      .upsert({ id: user.id, stripe_customer_id: customerId });
  }

  // Determine which plan was requested (default: monthly)
  const body = await req.json().catch(() => ({}));
  const plan = body?.plan === "annual" ? "annual" : "monthly";

  const { getStripePriceId, getStripeAnnualPriceId } = await import("@/lib/stripe");
  const priceId = plan === "annual" ? getStripeAnnualPriceId() : getStripePriceId();

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
  return NextResponse.json({ url: session.url });
}
