import { stripe } from "@/lib/stripe";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

type CheckoutRequest = {
  priceId?: string;
  customerId?: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
};

function isMetadata(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as CheckoutRequest;

  if (!body.priceId) {
    return NextResponse.json({ error: "priceId is required" }, { status: 400 });
  }

  if (!body.customerId && !body.customerEmail) {
    return NextResponse.json(
      { error: "customerId or customerEmail is required" },
      { status: 400 },
    );
  }

  const origin = request.nextUrl.origin;
  const metadata = isMetadata(body.metadata) ? body.metadata : undefined;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: body.customerId,
    customer_email: body.customerId ? undefined : body.customerEmail,
    line_items: [
      {
        price: body.priceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    success_url: body.successUrl ?? `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: body.cancelUrl ?? `${origin}/billing`,
    metadata,
  });

  return NextResponse.json({ id: session.id, url: session.url });
}
