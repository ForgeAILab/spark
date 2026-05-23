import { expect, test } from '@playwright/test';

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test.describe('public landing', () => {
  test('renders the landing with a sign-in link', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /anvil reference app/i }),
    ).toBeVisible();
    await expect(page.getByText(/proves the hybrid pack stack composes/i)).toBeVisible();

    const signIn = page.getByRole('link', { name: /sign in/i });
    await expect(signIn).toBeVisible();
    await expect(signIn).toHaveAttribute('href', '/login');
  });
});

test.describe('login page', () => {
  test('renders the login form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /create one/i })).toBeVisible();
  });
});

test.describe('sign up and create post flow', () => {
  test('signs up, sees greeting, creates a post', async ({ page }) => {
    const suffix = uniqueSuffix();
    const name = `Tester ${suffix}`;
    const email = `tester+${suffix}@example.com`;
    const password = 'correct-horse-battery-staple';
    const title = `Hello from ${suffix}`;
    const body = `This is the body for run ${suffix}.`;

    // Land on /login, switch to signup mode.
    await page.goto('/login?mode=signup');

    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();

    await page.locator('input[name="name"]').fill(name);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);

    await Promise.all([
      page.waitForURL('**/home', { timeout: 30_000 }),
      page.getByRole('button', { name: /create account/i }).click(),
    ]);

    // Greeting renders the user's name.
    const greeting = page.getByTestId('greeting');
    await expect(greeting).toBeVisible();
    await expect(greeting).toHaveText(`Hello ${name}`);

    // Empty state visible initially.
    await expect(page.getByTestId('posts-empty')).toBeVisible();

    // Fill and submit the create-post form.
    await page.getByTestId('post-title-input').fill(title);
    await page.getByTestId('post-body-input').fill(body);
    await page.getByTestId('create-post-submit').click();

    // After server-action revalidate, the new post card appears.
    const card = page.getByTestId('post-card').first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByTestId('post-title')).toHaveText(title);
    await expect(card.getByTestId('post-body')).toHaveText(body);

    // Empty state is gone.
    await expect(page.getByTestId('posts-empty')).toHaveCount(0);
  });
});
