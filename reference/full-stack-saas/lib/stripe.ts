import type Stripe from 'stripe';
import {
  createBillingPortalSession as createStripeBillingPortalSession,
  createCheckoutSession as createStripeCheckoutSession,
  createStripeClient,
  verifyWebhookSignature as verifyStripeWebhookSignature,
} from '@forgeailab/spark-stripe-helpers';

const DEFAULT_STRIPE_SECRET_KEY = 'sk_test_reference';

function env(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}

export type StripeClientLike = {
  checkout: {
    sessions: {
      create(params: Stripe.Checkout.SessionCreateParams): Promise<{
        id: string;
        url: string | null;
      }>;
    };
  };
  billingPortal: {
    sessions: {
      create(params: Stripe.BillingPortal.SessionCreateParams): Promise<{
        id: string;
        url: string;
      }>;
    };
  };
  webhooks: {
    constructEvent(payload: string | Buffer, signature: string, secret: string): Stripe.Event;
  };
};

export const stripe = createStripeClient(process.env.STRIPE_SECRET_KEY!, {
  appInfo: {
    name: '@forgeailab/reference-full-stack-saas',
  },
}) as unknown as StripeClientLike;

export type CheckoutInput = {
  origin: string;
  priceId?: string;
  customerId?: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
};

export async function createCheckoutSession(
  input: CheckoutInput,
  client: StripeClientLike = stripe,
) {
  const priceId = input.priceId ?? env('STRIPE_PRICE_ID', 'price_reference');
  const session = await createStripeCheckoutSession(client as unknown as Stripe, {
    priceId,
    customerId: input.customerId,
    customerEmail: input.customerEmail,
    successUrl:
      input.successUrl ?? `${input.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: input.cancelUrl ?? `${input.origin}/billing`,
    metadata: input.metadata,
  });

  return {
    id: session.sessionId,
    url: session.url,
  };
}

export type PortalInput = {
  customerId: string;
  returnUrl: string;
};

export async function createBillingPortalSession(
  input: PortalInput,
  client: StripeClientLike = stripe,
) {
  return createStripeBillingPortalSession(client as unknown as Stripe, {
    customerId: input.customerId,
    returnUrl: input.returnUrl,
  });
}

export type WebhookInput = {
  payload: string;
  signature: string;
  secret?: string;
};

export function verifyWebhookSignature(input: WebhookInput, client: StripeClientLike = stripe) {
  return verifyStripeWebhookSignature(client as unknown as Stripe, {
    payload: input.payload,
    signatureHeader: input.signature,
    secret: input.secret ?? env('STRIPE_WEBHOOK_SECRET', 'whsec_reference'),
  });
}
