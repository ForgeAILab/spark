import type Stripe from 'stripe';

export type CreateBillingPortalSessionInput = {
  customerId: string;
  returnUrl: string;
};

export async function createBillingPortalSession(
  stripe: Stripe,
  { customerId, returnUrl }: CreateBillingPortalSessionInput,
): Promise<{ url: string }> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return {
    url: session.url,
  };
}
