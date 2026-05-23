# @forgeailab/spark-stripe-helpers

Small Stripe runtime helpers for Spark payments packs.

## API

- `createStripeClient(secretKey, options?)`
- `createCheckoutSession(stripe, input)`
- `verifyWebhookSignature(stripe, input)`
- `createBillingPortalSession(stripe, input)`
