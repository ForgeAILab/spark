import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

async function hasProcessedStripeEvent(_eventId: string): Promise<boolean> {
  // Replace with a durable lookup in the app database before going live.
  return false;
}

async function markStripeEventProcessed(_eventId: string): Promise<void> {
  // Replace with an atomic insert keyed by Stripe event id before going live.
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  console.log("Stripe checkout completed", {
    customer: session.customer,
    subscription: session.subscription,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  console.log("Stripe subscription updated", {
    customer: subscription.customer,
    status: subscription.status,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log("Stripe subscription deleted", {
    customer: subscription.customer,
    status: subscription.status,
  });
}

async function dispatchStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? "",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (await hasProcessedStripeEvent(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await dispatchStripeEvent(event);
  await markStripeEventProcessed(event.id);

  return NextResponse.json({ received: true });
}
