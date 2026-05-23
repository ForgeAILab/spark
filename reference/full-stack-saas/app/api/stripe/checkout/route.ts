import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth-helpers';
import { createCheckoutSession } from '@/lib/stripe';

export const runtime = 'nodejs';

const metadataSchema = z.record(z.string(), z.string());
const checkoutRequestSchema = z.object({
  priceId: z.string().min(1).optional(),
  customerId: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  metadata: metadataSchema.optional(),
});

export async function POST(request: NextRequest) {
  const parsed = checkoutRequestSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid checkout request' }, { status: 400 });
  }

  const session = await getSession(request).catch(() => null);

  try {
    const checkout = await createCheckoutSession({
      origin: request.nextUrl.origin,
      priceId: parsed.data.priceId,
      customerId: parsed.data.customerId,
      customerEmail: parsed.data.customerEmail ?? session?.user.email,
      successUrl: parsed.data.successUrl,
      cancelUrl: parsed.data.cancelUrl,
      metadata: parsed.data.metadata,
    });

    return NextResponse.json({ id: checkout.id, sessionUrl: checkout.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create checkout session';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
