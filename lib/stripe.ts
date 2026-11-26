import Stripe from "stripe";

// Seit 25.11.2026 gibt es kein Pro-Angebot und keinen Kaufweg mehr. Stripe wird
// nur noch gebraucht, damit ein früher abgeschlossenes Abo weiterläuft, verwaltet
// und gekündigt werden kann (app/api/stripe/webhook, app/api/stripe/portal).

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Missing env var: STRIPE_SECRET_KEY. Add it to .env.local and to the server environment."
    );
  }
  if (!_stripe) {
    _stripe = new Stripe(key, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}
