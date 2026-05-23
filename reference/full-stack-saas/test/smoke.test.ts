import { beforeAll, expect, test } from 'bun:test';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { createAuth, getSession } from '@forgeailab/anvil-auth-better-auth';
import type Stripe from 'stripe';
import type { AnthropicClientLike } from '../lib/anthropic';
import type { StripeClientLike } from '../lib/stripe';

const envDefaults = {
  DATABASE_URL: 'postgres://anvil:anvil@localhost:5432/anvil',
  BETTER_AUTH_SECRET: 'reference-dev-secret-change-me-reference-dev-secret-change-me',
  BETTER_AUTH_URL: 'http://localhost:3000',
  GITHUB_CLIENT_ID: 'github-client-id',
  GITHUB_CLIENT_SECRET: 'github-client-secret',
  STRIPE_SECRET_KEY: 'sk_test_reference',
  STRIPE_WEBHOOK_SECRET: 'whsec_reference',
  STRIPE_PRICE_ID: 'price_reference',
  RESEND_API_KEY: 're_reference',
  RESEND_FROM_EMAIL: 'Reference App <onboarding@resend.dev>',
  ANTHROPIC_API_KEY: 'sk-ant-reference',
  ZERO_AUTH_SECRET: 'zero-reference-secret-change-me',
  NEXT_PUBLIC_ZERO_URL: 'http://localhost:4848',
};

function setReferenceEnv() {
  for (const [key, value] of Object.entries(envDefaults)) {
    process.env[key] = value;
  }
}

function createMemoryAuth() {
  return createAuth({
    adapter: memoryAdapter({
      user: [],
      session: [],
      account: [],
      verification: [],
    }),
    baseURL: envDefaults.BETTER_AUTH_URL,
    secret: envDefaults.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      github: {
        clientId: envDefaults.GITHUB_CLIENT_ID,
        clientSecret: envDefaults.GITHUB_CLIENT_SECRET,
      },
    },
  });
}

beforeAll(() => {
  setReferenceEnv();
});

test('Better Auth instance constructs without throwing', async () => {
  setReferenceEnv();

  expect(() => createMemoryAuth()).not.toThrow();
});

test('getSession returns null for an unauthenticated request', async () => {
  setReferenceEnv();
  const auth = createMemoryAuth();

  const session = await getSession(auth, new Request('http://localhost:3000'));

  expect(session).toBeNull();
});

test('Stripe createCheckoutSession returns a URL with a mocked SDK', async () => {
  setReferenceEnv();
  const { createCheckoutSession } = await import('../lib/stripe');

  const mockStripe = {
    checkout: {
      sessions: {
        create: async () => ({
          id: 'cs_test_reference',
          url: 'https://checkout.stripe.test/session',
        }),
      },
    },
    billingPortal: {
      sessions: {
        create: async () => ({
          id: 'bps_test_reference',
          url: 'https://billing.stripe.test/session',
        }),
      },
    },
    webhooks: {
      constructEvent: () =>
        ({
          id: 'evt_test_reference',
          type: 'checkout.session.completed',
        }) as Stripe.Event,
    },
  } satisfies StripeClientLike;

  const session = await createCheckoutSession(
    {
      origin: 'http://localhost:3000',
      customerEmail: 'buyer@example.com',
    },
    mockStripe,
  );

  expect(session.url).toBe('https://checkout.stripe.test/session');
});

test('Anthropic streaming helper yields SSE chunks with a mocked SDK', async () => {
  setReferenceEnv();
  const { streamChatSse } = await import('../lib/anthropic');

  async function* mockEvents() {
    yield {
      type: 'content_block_delta',
      delta: {
        type: 'text_delta',
        text: 'hello',
      },
    };
    yield {
      type: 'message_stop',
    };
  }

  const mockAnthropic = {
    messages: {
      create: async () => mockEvents(),
    },
  } satisfies AnthropicClientLike;

  const chunks: string[] = [];

  for await (const chunk of streamChatSse(
    {
      messages: [{ role: 'user', content: 'Say hello' }],
    },
    mockAnthropic,
  )) {
    chunks.push(chunk);
  }

  expect(chunks.join('')).toContain('"text":"hello"');
  expect(chunks.join('')).toContain('"type":"done"');
});

test('Zero schema exposes user and posts tables with matching columns', async () => {
  const { schema } = await import('../lib/zero/schema');

  expect(Object.keys(schema.tables)).toContain('user');
  expect(Object.keys(schema.tables)).toContain('posts');
  expect(schema.tables.posts).toBeDefined();
  expect(Object.keys(schema.tables.posts.columns)).toEqual(
    expect.arrayContaining(['id', 'user_id', 'title', 'body', 'created_at']),
  );
});
