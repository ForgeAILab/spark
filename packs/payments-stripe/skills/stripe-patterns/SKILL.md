---
name: stripe-patterns
description: Build Stripe subscription flows with Checkout, Billing Portal, and signed webhooks. Use when implementing or reviewing billing behavior after the payments-stripe pack is installed.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Skill: stripe-patterns

## Goal

Ship a small, reliable subscription billing slice: Checkout creates the initial
subscription, Billing Portal handles plan and payment-method changes, and
webhooks update the app database as the billing source of truth changes.

## Recommended model

Opus 4.7 or GPT-5.5 for pricing and lifecycle decisions. Sonnet 4.6 or GPT-5
family executor for routine route and UI wiring.

## Inputs

Read these before changing billing code:

- `.ai/product-spec.md` for the monetization promise and non-goals
- `.ai/architecture.md` for the chosen auth and database providers
- `.ai/board.md` for the exact billing task and acceptance criteria
- `lib/stripe.ts` for shared Stripe client setup
- `app/api/webhooks/stripe/route.ts` for event handling

If the spec does not say what users buy or what paid access unlocks, stop and
ask. Do not invent pricing rules inside implementation.

## Subscription Model

- Treat Stripe as the source of truth for payment state.
- Treat the app database as a query cache for product access decisions.
- Store Stripe customer id on the app user or organization record.
- Store subscription id, price id, status, current period dates, and cancel flag.
- Grant access from database state, not from client-side checkout responses.
- Prefer Stripe Checkout for first purchase and Billing Portal for later changes.
- Keep product and price creation in the Stripe dashboard unless the board says
  the product catalog must be managed in-app.

## Webhook Rules

- Verify signatures with `STRIPE_WEBHOOK_SECRET` and the raw request body.
- Process webhooks idempotently by storing Stripe event ids in the database.
- Use an atomic insert or unique index for event id de-duplication.
- Acknowledge duplicate events with success, not an error.
- Update access on `checkout.session.completed`,
  `customer.subscription.updated`, and `customer.subscription.deleted`.
- Add invoice event handling only when the product spec needs grace periods,
  failed payment messaging, or invoice history.

## Checkout Rules

- Never accept price amounts from the browser.
- Accept only Stripe price ids that the server has allowlisted or loaded from
  trusted configuration.
- Create or reuse exactly one Stripe customer for each billable account.
- Send stable metadata, such as user id or organization id, on Checkout Sessions.
- Redirect only to same-origin success and cancel URLs unless explicitly needed.

## Customer Portal Rules

- Require an authenticated user before creating a portal session.
- Resolve the Stripe customer id from the database, not from request body trust.
- Use the portal for payment method changes, cancellations, and plan changes
  unless custom billing UX is required by the board.

## Common Pitfalls

- Do not mark a user paid immediately after `checkout.sessions.create`.
- Do not parse JSON before webhook signature verification.
- Do not skip webhook idempotency because Stripe retries events.
- Do not trust `customerEmail` as identity; it is only a checkout convenience.
- Do not create a new customer on every checkout attempt.
- Do not build custom plan management before Billing Portal is exhausted.

## Verification

Use Stripe CLI forwarding for local webhook tests:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Then create a Checkout Session, complete the test payment, and confirm the app
database changes only after the signed webhook is processed.
