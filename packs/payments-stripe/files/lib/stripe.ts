import Stripe from "stripe";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
  appInfo: {
    name: "app-skills payments-stripe",
  },
});

export function getStripePublishableKey(): string {
  return requireEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}
