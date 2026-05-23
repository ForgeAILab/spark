import { createHmac } from 'node:crypto';
import { headers as nextHeaders } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

const TOKEN_TTL_SECONDS = 60 * 60;

type ZeroTokenPayload = {
  sub: string;
  name?: string;
  email?: string;
  iat: number;
  exp: number;
};

function encodePart(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signJwt(payload: ZeroTokenPayload): string {
  const secret = process.env.ZERO_AUTH_SECRET;
  if (!secret) throw new Error('ZERO_AUTH_SECRET is required');

  const header = encodePart({ alg: 'HS256', typ: 'JWT' });
  const body = encodePart(payload);
  const data = `${header}.${body}`;
  const signature = createHmac('sha256', secret).update(data).digest('base64url');

  return `${data}.${signature}`;
}

export async function GET() {
  const session = await auth.api.getSession({
    headers: (await nextHeaders()) as unknown as Headers,
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: ZeroTokenPayload = {
    sub: session.user.id,
    name: session.user.name ?? undefined,
    email: session.user.email ?? undefined,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };

  return NextResponse.json({ token: signJwt(payload) });
}
