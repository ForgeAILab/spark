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
    constructEventAsync(
      payload: string | Buffer,
      signature: string,
      secret: string,
    ): Promise<Stripe.Event>;
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
