import {
  createStripeClient,
  createCheckoutSession as createStripeCheckoutSession,
  createBillingPortalSession as createStripeBillingPortalSession,
  verifyWebhookSignature as verifyStripeWebhookSignature,
} from '@forgeailab/anvil-stripe-helpers';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const stripe = createStripeClient(requireEnv('STRIPE_SECRET_KEY'), {
  appInfo: { name: 'anvil payments-stripe' },
});

export function getStripePublishableKey(): string {
  return requireEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

export type CheckoutInput = {
  origin: string;
  priceId: string;
  customerEmail?: string;
  customerId?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
};

export async function createCheckoutSession(input: CheckoutInput) {
  return createStripeCheckoutSession(stripe, {
    priceId: input.priceId,
    customerId: input.customerId,
    customerEmail: input.customerEmail,
    successUrl:
      input.successUrl ?? `${input.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: input.cancelUrl ?? `${input.origin}/billing`,
    metadata: input.metadata,
  });
}

export type PortalInput = { customerId: string; returnUrl: string };

export async function createBillingPortalSession(input: PortalInput) {
  return createStripeBillingPortalSession(stripe, input);
}

export type WebhookInput = { payload: string; signature: string; secret?: string };

export function verifyWebhookSignature(input: WebhookInput) {
  return verifyStripeWebhookSignature(stripe, {
    payload: input.payload,
    signatureHeader: input.signature,
    secret: input.secret ?? requireEnv('STRIPE_WEBHOOK_SECRET'),
  });
}
