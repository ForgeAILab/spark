import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createBillingPortalSession } from '@/lib/stripe';

export const runtime = 'nodejs';

const portalRequestSchema = z.object({
  customerId: z.string().min(1),
  returnUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = portalRequestSchema.safeParse(await request.json().catch(() => undefined));

  if (!parsed.success) {
    return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
  }

  const portal = await createBillingPortalSession({
    customerId: parsed.data.customerId,
    returnUrl: parsed.data.returnUrl ?? `${request.nextUrl.origin}/billing`,
  });

  return NextResponse.json({ portalUrl: portal.url });
}
