import { describe, expect, test } from 'bun:test';
import Stripe from 'stripe';
import { verifyWebhookSignature } from '../src/index.ts';

describe('verifyWebhookSignature', () => {
  test('returns the signed Stripe event', async () => {
    const stripe = new Stripe('sk_test_reference');
    const secret = 'whsec_reference';
    const payload = JSON.stringify({
      id: 'evt_test_reference',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_reference',
          object: 'checkout.session',
        },
      },
    });
    const signatureHeader = await stripe.webhooks.generateTestHeaderStringAsync({
      payload,
      secret,
    });

    const event = await verifyWebhookSignature(stripe, {
      payload,
      signatureHeader,
      secret,
    });

    expect(event.type).toBe('checkout.session.completed');
    expect((event.data.object as Stripe.Checkout.Session).id).toBe('cs_test_reference');
  });
});
