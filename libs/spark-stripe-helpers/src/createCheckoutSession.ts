import Stripe from 'stripe';

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

export async function createCheckoutSession(
  stripe: Stripe,
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

  const session = await stripe.checkout.sessions.create({
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
