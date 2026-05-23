import { describe, expect, test } from 'bun:test';
import type Stripe from 'stripe';
import { createCheckoutSession } from '../src/index.ts';

describe('createCheckoutSession', () => {
  test('returns checkout URL and session id', async () => {
    let createParams: Stripe.Checkout.SessionCreateParams | undefined;
    const stripe = {
      checkout: {
        sessions: {
          create: async (params: Stripe.Checkout.SessionCreateParams) => {
            createParams = params;
            return {
              id: 'cs_test_reference',
              url: 'https://checkout.stripe.test/session',
            };
          },
        },
      },
    } as unknown as Stripe;

    const session = await createCheckoutSession(stripe, {
      priceId: 'price_reference',
      customerEmail: 'buyer@example.com',
      successUrl: 'http://localhost:3000/billing/success',
      cancelUrl: 'http://localhost:3000/billing',
    });

    expect(session).toEqual({
      url: 'https://checkout.stripe.test/session',
      sessionId: 'cs_test_reference',
    });
    expect(createParams?.line_items).toEqual([{ price: 'price_reference', quantity: 1 }]);
    expect(createParams?.customer_email).toBe('buyer@example.com');
  });
});
