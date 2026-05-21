import { stripe } from "@/lib/stripe";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

type PortalRequest = {
  customerId?: string;
  returnUrl?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as PortalRequest;

  if (!body.customerId) {
    return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: body.customerId,
    return_url: body.returnUrl ?? `${request.nextUrl.origin}/billing`,
  });

  return NextResponse.redirect(session.url, 303);
}
