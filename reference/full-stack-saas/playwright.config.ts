import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? 'list' : 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? 'file:./.data/e2e.db',
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ??
        'reference-dev-secret-change-me-reference-dev-secret-change-me',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? BASE_URL,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?? 'github-client-id',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ?? 'github-client-secret',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? 'sk_test_reference',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_reference',
      STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID ?? 'price_reference',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? 're_reference',
      RESEND_FROM_EMAIL:
        process.env.RESEND_FROM_EMAIL ?? 'Reference App <onboarding@resend.dev>',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? 'sk-ant-reference',
      ZERO_AUTH_SECRET: process.env.ZERO_AUTH_SECRET ?? 'zero-reference-secret-change-me',
      NEXT_PUBLIC_ZERO_URL: process.env.NEXT_PUBLIC_ZERO_URL ?? 'http://localhost:4848',
    },
  },
});
