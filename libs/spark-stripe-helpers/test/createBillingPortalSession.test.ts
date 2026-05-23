import { describe, expect, test } from 'bun:test';
import type Stripe from 'stripe';
import { createBillingPortalSession } from '../src/index.ts';

describe('createBillingPortalSession', () => {
  test('returns the billing portal URL', async () => {
    let createParams: Stripe.BillingPortal.SessionCreateParams | undefined;
    const stripe = {
      billingPortal: {
        sessions: {
          create: async (params: Stripe.BillingPortal.SessionCreateParams) => {
            createParams = params;
            return {
              id: 'bps_test_reference',
              url: 'https://billing.stripe.test/session',
            };
          },
        },
      },
    } as unknown as Stripe;

    const session = await createBillingPortalSession(stripe, {
      customerId: 'cus_reference',
      returnUrl: 'http://localhost:3000/billing',
    });

    expect(session).toEqual({
      url: 'https://billing.stripe.test/session',
    });
    expect(createParams).toEqual({
      customer: 'cus_reference',
      return_url: 'http://localhost:3000/billing',
    });
  });
});
