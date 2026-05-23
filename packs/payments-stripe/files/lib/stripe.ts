import Stripe from 'stripe';

type StripeClientOptions = ConstructorParameters<typeof Stripe>[1];

declare module 'stripe' {
  namespace Stripe {
    export type StripeConstructorOptions = StripeClientOptions;
  }
}

export function createStripeClient(
  secretKey: string,
  options?: Stripe.StripeConstructorOptions,
): Stripe {
  return new Stripe(secretKey, options);
}

type CheckoutSessionCreateParams = NonNullable<
  Parameters<Stripe['checkout']['sessions']['create']>[0]
>;

export type CreateCheckoutSessionInput = {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  mode?: CheckoutSessionCreateParams['mode'];
  metadata?: Record<string, string>;
};

async function createStripeCheckoutSession(
  stripeClient: Stripe,
  {
    priceId,
    customerId,
    customerEmail,
    successUrl,
    cancelUrl,
    mode = 'subscription',
    metadata,
  }: CreateCheckoutSessionInput,
): Promise<{ url: string; sessionId: string }> {
  if (!customerId && !customerEmail) {
    throw new Error('customerId or customerEmail is required');
  }

  const session = await stripeClient.checkout.sessions.create({
    mode,
    customer: customerId,
    customer_email: customerId ? undefined : customerEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }

  return {
    url: session.url,
    sessionId: session.id,
  };
}

export type VerifyWebhookSignatureInput = {
  payload: string | Buffer;
  signatureHeader: string;
  secret: string;
};

function verifyStripeWebhookSignature(
  stripeClient: Stripe,
  { payload, signatureHeader, secret }: VerifyWebhookSignatureInput,
): Promise<Stripe.Event> {
  return stripeClient.webhooks.constructEventAsync(payload, signatureHeader, secret);
}

export type CreateBillingPortalSessionInput = {
  customerId: string;
  returnUrl: string;
};

async function createStripeBillingPortalSession(
  stripeClient: Stripe,
  { customerId, returnUrl }: CreateBillingPortalSessionInput,
): Promise<{ url: string }> {
  const session = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return {
    url: session.url,
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const stripe = createStripeClient(requireEnv('STRIPE_SECRET_KEY'), {
  appInfo: { name: 'spark payments-stripe' },
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
