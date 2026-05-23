import { createHmac, timingSafeEqual } from 'node:crypto';
import { handleMutateRequest, getMutation } from '@rocicorp/zero/server';
import { zeroDrizzle } from '@rocicorp/zero/server/adapters/drizzle';
import type { DrizzleDatabase } from '@rocicorp/zero/server/adapters/drizzle';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createMutators, type AuthData } from '@/lib/zero/mutators';
import { schema } from '@/lib/zero/schema';

export const runtime = 'nodejs';

type ZeroTokenPayload = AuthData & {
  iat: number;
  exp: number;
};

const zeroDb = zeroDrizzle(schema, db as unknown as DrizzleDatabase);

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function parseJsonPart<T>(part: string): T | undefined {
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as T;
  } catch {
    return undefined;
  }
}

function verifyJwt(token: string): AuthData | undefined {
  const secret = process.env.ZERO_AUTH_SECRET;
  if (!secret) throw new Error('ZERO_AUTH_SECRET is required');

  const [encodedHeader, encodedPayload, signature, ...extra] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature || extra.length > 0) return undefined;

  const header = parseJsonPart<{ alg?: string; typ?: string }>(encodedHeader);
  if (header?.alg !== 'HS256' || header.typ !== 'JWT') return undefined;

  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac('sha256', secret).update(data).digest('base64url');
  if (!safeEqual(signature, expectedSignature)) return undefined;

  const payload = parseJsonPart<Partial<ZeroTokenPayload>>(encodedPayload);
  const now = Math.floor(Date.now() / 1000);

  if (!payload || typeof payload.sub !== 'string' || !payload.sub) return undefined;
  if (typeof payload.exp !== 'number' || payload.exp <= now) return undefined;

  return {
    sub: payload.sub,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
}

function getBearerToken(headers: Headers): string | undefined {
  const authorization = headers.get('authorization');
  const [scheme, token] = authorization?.split(' ') ?? [];

  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
}

export async function POST(request: Request) {
  const token = getBearerToken(request.headers);
  const authData = token ? verifyJwt(token) : undefined;

  if (!authData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mutators = createMutators(authData);
  const response = await handleMutateRequest({
    dbProvider: zeroDb,
    request,
    userID: authData.sub,
    handler: async (transact) =>
      transact(async (tx, mutatorName, mutatorArgs) => {
        const mutator = getMutation(mutators, mutatorName);
        await mutator(tx, mutatorArgs, undefined);
      }),
  });

  return NextResponse.json(response);
}
