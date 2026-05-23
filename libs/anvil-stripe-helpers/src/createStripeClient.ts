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
