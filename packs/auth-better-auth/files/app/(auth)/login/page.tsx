'use client';

import { useState, useTransition } from 'react';
import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient();
type SocialProvider = 'github' | 'google';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function signIn(provider: SocialProvider) {
    setError(null);
    startTransition(() => {
      void authClient.signIn
        .social({
          provider,
          callbackURL: '/',
        })
        .then((result) => {
          if (result.error) {
            setError(result.error.message ?? 'Unable to sign in.');
          }
        });
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">Continue with a configured OAuth provider.</p>
      </div>

      <div className="mt-8 grid gap-3">
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          disabled={isPending}
          onClick={() => signIn('github')}
          type="button"
        >
          Continue with GitHub
        </button>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          disabled={isPending}
          onClick={() => signIn('google')}
          type="button"
        >
          Continue with Google
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </main>
  );
}
