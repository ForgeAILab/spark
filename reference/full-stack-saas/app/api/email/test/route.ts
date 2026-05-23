import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { sendTransactional } from '@/lib/resend';

export const runtime = 'nodejs';

const emailRequestSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
  subject: z.string().min(1).default('Reference app transactional email'),
  text: z.string().min(1).optional(),
  html: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = emailRequestSchema.safeParse(await request.json().catch(() => undefined));

  if (!parsed.success) {
    return NextResponse.json({ error: 'to is required' }, { status: 400 });
  }

  const result = await sendTransactional({
    to: parsed.data.to,
    subject: parsed.data.subject,
    text: parsed.data.text ?? 'Reference app transactional email smoke route.',
    html: parsed.data.html,
  });

  return NextResponse.json({ id: result.data?.id ?? null });
}
