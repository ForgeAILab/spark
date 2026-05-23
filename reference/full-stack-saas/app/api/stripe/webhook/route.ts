import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  try {
    const event = await verifyWebhookSignature({ payload, signature });
    console.log('Stripe webhook received', { type: event.type });
    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Stripe signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
