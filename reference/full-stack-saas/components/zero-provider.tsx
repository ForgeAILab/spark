'use client';

import { useEffect, useState, type ReactNode } from 'react';
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
  const [isLoadingToken, setIsLoadingToken] = useState(Boolean(authData));

  useEffect(() => {
    if (!authData) {
      setToken(undefined);
      setIsLoadingToken(false);
      return;
    }

    let isCancelled = false;
    setIsLoadingToken(true);

    async function loadToken() {
      try {
        const response = await fetch('/api/zero/token');
        if (!response.ok) throw new Error('Unable to load Zero token');
        const data = (await response.json()) as { token?: string };
        if (!isCancelled) setToken(data.token);
      } catch {
        if (!isCancelled) setToken(undefined);
      } finally {
        if (!isCancelled) setIsLoadingToken(false);
      }
    }

    void loadToken();

    return () => {
      isCancelled = true;
    };
  }, [authData]);

  // Always wrap with a provider so `useZero()` is safe to call. While the JWT
  // is loading we mount with no auth/mutators; once the token arrives we
  // remount via `key` so Zero re-initializes with the authenticated client.
  const zeroOptions = createZeroOptions(
    token ? { authToken: token, authData } : {},
  );

  return (
    <RocicorpZeroProvider
      key={token ?? 'anon'}
      {...(zeroOptions as unknown as ZeroOptions)}
    >
      {children}
    </RocicorpZeroProvider>
  );
}
