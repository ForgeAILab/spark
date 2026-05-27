'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ZeroOptions } from '@rocicorp/zero';
import { ZeroProvider as RocicorpZeroProvider } from '@rocicorp/zero/react';
import { createZeroOptions } from '@/lib/zero/client';
import type { AuthData } from '@/lib/zero/mutators';

type ZeroProviderProps = {
  authData: AuthData | undefined;
  children: ReactNode;
};

export function ZeroProvider({ authData, children }: ZeroProviderProps) {
  const [token, setToken] = useState<string>();

  useEffect(() => {
    if (!authData) {
      setToken(undefined);
      return;
    }

    let isCancelled = false;

    async function loadToken() {
      try {
        const response = await fetch('/api/zero/token');
        if (!response.ok) throw new Error('Unable to load Zero token');
        const data = (await response.json()) as { token?: string };
        if (!isCancelled) setToken(data.token);
      } catch {
        if (!isCancelled) setToken(undefined);
      }
    }

    void loadToken();

    return () => {
      isCancelled = true;
    };
  }, [authData]);

  // Let `ZeroProvider` own the Zero instance's lifecycle: it (re)creates the
  // client when `userID`/`auth` change. We treat the user as authenticated only
  // once both the session and its JWT are in hand, so there is exactly one
  // logged-out -> logged-in transition and no `anon` client group churn (which
  // otherwise desyncs the CVR and triggers ClientNotFound reload loops).
  // Pass `userID` as soon as the session is known (even before the JWT loads),
  // so there is a single, stable Zero client / client group from first paint;
  // only the `auth` token is deferred until the fetch resolves, and ZeroProvider
  // applies it to that same client. Spinning up a throwaway logged-out ("anon")
  // client first and swapping to an authed one churns the client group, which
  // desyncs the CVR — leaving the live query empty (the optimistic insert is
  // rebased away after the server ack with no synced row to replace it).
  const zeroOptions = useMemo(
    () => createZeroOptions(authData ? { authData, authToken: token } : {}),
    [authData, token],
  );

  return (
    <RocicorpZeroProvider {...(zeroOptions as unknown as ZeroOptions)}>
      {children}
    </RocicorpZeroProvider>
  );
}
