'use client';

import type { ReactNode } from 'react';
import type { ZeroOptions } from '@rocicorp/zero';
import { ZeroProvider as RocicorpZeroProvider } from '@rocicorp/zero/react';
import type { ZeroClient } from './createZeroClient';

type ZeroProviderWithClientProps = {
  children: ReactNode;
  client: ZeroClient;
};

type ZeroProviderWithOptionsProps = ZeroOptions & {
  children: ReactNode;
  client?: never;
};

export type ZeroProviderProps = ZeroProviderWithClientProps | ZeroProviderWithOptionsProps;

// Note on reconnect behavior: Zero's internal run-loop reconnects with backoff
// when a WebSocket drops, and wakes from the `document.visibilitychange` event.
// We deliberately do NOT force-remount on `window.online` events here — that
// triggers `zero.close()` on the old client, which aborts any in-flight
// optimistic mutation with `Mutator error: Zero was explicitly closed`.
// Consumers who need faster reconnect after a long offline window should
// `key` the provider on their own application-level signal (e.g. a fresh JWT)
// rather than reacting to network events.
export function ZeroProvider(props: ZeroProviderProps) {
  const { children } = props;

  if ('client' in props && props.client) {
    return <RocicorpZeroProvider zero={props.client}>{children}</RocicorpZeroProvider>;
  }

  const { children: _children, client: _client, ...options } = props as ZeroProviderWithOptionsProps;
  return <RocicorpZeroProvider {...options}>{children}</RocicorpZeroProvider>;
}
