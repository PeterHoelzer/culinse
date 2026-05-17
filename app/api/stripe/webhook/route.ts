import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Use service-role client so webhook can bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const getUserId = async (customerId: string): Promise<string | null> => {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();
    return data?.id ?? null;
  };

  // Helper: get period end from subscription items (new Stripe API)
  const getPeriodEnd = (sub: Stripe.Subscription): string | null => {
    const end = sub.items?.data?.[0]?.current_period_end;
    return end ? new Date(end * 1000).toISOString() : null;
  };

  switch (event.type) {
    // ── Payment succeeded → activate Pro ─────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      const userId = await getUserId(customerId);
      if (!userId) break;

      const sub = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items"],
      });
      const periodEnd = getPeriodEnd(sub as Stripe.Subscription);

      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        is_pro: true,
        pro_expires_at: periodEnd,
        updated_at: new Date().toISOString(),
      });
      break;
    }

    // ── Subscription renewed → update expiry ─────────────────────────────────
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      // `subscription` field exists at runtime but was removed from Stripe's typings in v17
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawSub = (invoice as any).subscription as string | Stripe.Subscription | null | undefined;
      const subscriptionId = typeof rawSub === "string" ? rawSub : rawSub?.id ?? null;
      if (!subscriptionId) break;

      const userId = await getUserId(customerId);
      if (!userId) break;

      const sub = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items"],
      });
      const periodEnd = getPeriodEnd(sub as Stripe.Subscription);

      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        is_pro: true,
        pro_expires_at: periodEnd,
        updated_at: new Date().toISOString(),
      });
      break;
    }

    // ── Subscription cancelled / expired → revoke Pro ─────────────────────────
    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const userId = await getUserId(customerId);
      if (!userId) break;

      const isActive = sub.status === "active" || sub.status === "trialing";
      const periodEnd = getPeriodEnd(sub);

      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        is_pro: isActive,
        pro_expires_at: isActive ? periodEnd : null,
        updated_at: new Date().toISOString(),
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
