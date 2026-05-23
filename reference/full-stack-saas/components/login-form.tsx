'use client';

import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import { createAuthClient } from 'better-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const authClient = createAuthClient();

export function LoginForm() {
  const searchParams = useSearchParams();
  const isSignup = searchParams.get('mode') === 'signup';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(() => {
      const action = isSignup
        ? authClient.signUp.email({
            name,
            email,
            password,
            callbackURL: '/home',
          })
        : authClient.signIn.email({
            email,
            password,
            callbackURL: '/home',
          });

      void action
        .then((result) => {
          if (result.error) {
            setError(
              result.error.message ??
                (isSignup ? 'Unable to sign up with email.' : 'Unable to sign in with email.'),
            );
            return;
          }
          // Better Auth's callbackURL only applies to flows that issue a server
          // redirect (OAuth); for email/password sign-in we drive navigation here.
          window.location.assign('/home');
        })
        .catch((submitError: unknown) => {
          setError(
            submitError instanceof Error
              ? submitError.message
              : isSignup
                ? 'Unable to sign up.'
                : 'Unable to sign in.',
          );
        });
    });
  }

  function handleGitHubLogin() {
    setError(null);

    startTransition(() => {
      void authClient.signIn
        .social({
          provider: 'github',
          callbackURL: '/home',
        })
        .then((result) => {
          if (result.error) {
            setError(result.error.message ?? 'Unable to sign in with GitHub.');
          }
        })
        .catch((loginError: unknown) => {
          setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
        });
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isSignup ? 'Create an account' : 'Sign in'}</CardTitle>
        <CardDescription>
          {isSignup
            ? 'Sign up with email or GitHub to open the reference app.'
            : 'Use email or GitHub to open the reference app.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleEmailSubmit}>
          {isSignup ? (
            <label className="grid gap-2 text-sm font-medium">
              Name
              <input
                autoComplete="name"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                name="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Ada Lovelace"
                required
                type="text"
                value={name}
              />
            </label>
          ) : null}
          <label className="grid gap-2 text-sm font-medium">
            Email
            <input
              autoComplete="email"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Password
            <input
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              minLength={8}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <Button disabled={isPending} type="submit">
            <Mail aria-hidden="true" className="h-4 w-4" />
            {isSignup ? 'Create account' : 'Continue with Email'}
          </Button>
        </form>

        <div className="my-5 h-px bg-border" />

        <Button
          className="w-full"
          disabled={isPending}
          onClick={handleGitHubLogin}
          type="button"
          variant="outline"
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.39.97.01 1.95.14 2.86.39 2.18-1.49 3.14-1.18 3.14-1.18.62 1.57.23 2.73.11 3.02.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
          Continue with GitHub
        </Button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <Link className="text-primary hover:underline" href="/login">
                Sign in
              </Link>
            </>
          ) : (
            <>
              No account yet?{' '}
              <Link className="text-primary hover:underline" href="/login?mode=signup">
                Create one
              </Link>
            </>
          )}
        </p>

        {error ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
