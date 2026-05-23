import type Stripe from 'stripe';

export type VerifyWebhookSignatureInput = {
  payload: string | Buffer;
  signatureHeader: string;
  secret: string;
};

export function verifyWebhookSignature(
  stripe: Stripe,
  { payload, signatureHeader, secret }: VerifyWebhookSignatureInput,
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEventAsync(payload, signatureHeader, secret);
}
