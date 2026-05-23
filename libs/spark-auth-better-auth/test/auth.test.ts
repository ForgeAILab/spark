import { describe, expect, test } from 'bun:test';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { createAuth, createAuthHandler, getSession } from '../src/index.ts';

const TEST_SECRET = 'testtesttesttesttesttesttesttest';

function createTestAuth() {
  return createAuth({
    adapter: memoryAdapter({
      user: [],
      session: [],
      account: [],
      verification: [],
    }),
    secret: TEST_SECRET,
  });
}

describe('createAuth', () => {
  test('returns a Better Auth instance with session API and handler', () => {
    const auth = createTestAuth();

    expect(typeof auth.api.getSession).toBe('function');
    expect(typeof auth.handler).toBe('function');
  });
});

describe('createAuthHandler', () => {
  test('returns Next.js App Router GET and POST handlers', () => {
    const handler = createAuthHandler(createTestAuth());

    expect(typeof handler.GET).toBe('function');
    expect(typeof handler.POST).toBe('function');
  });
});

describe('getSession', () => {
  test('returns null when no session cookie is present', async () => {
    const auth = createTestAuth();
    const request = new Request('http://localhost:3000/api/auth/session');

    await expect(getSession(auth, request)).resolves.toBeNull();
  });
});
