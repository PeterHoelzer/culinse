import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Missing env var: STRIPE_SECRET_KEY. Add it to .env.local and Vercel environment variables."
    );
  }
  if (!_stripe) {
    _stripe = new Stripe(key, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

export function getStripePriceId(): string {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error(
      "Missing env var: STRIPE_PRICE_ID. Add it to .env.local and Vercel environment variables."
    );
  }
  return priceId;
}

/** @deprecated Use getStripePriceId() instead */
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID!;
