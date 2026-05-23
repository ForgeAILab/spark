'use client';

import type { ReactNode } from 'react';
import type { ZeroOptions } from '@rocicorp/zero';
import { ZeroProvider as RocicorpZeroProvider } from '@rocicorp/zero/react';

type ZeroProviderProps = ZeroOptions & {
  children: ReactNode;
};

export function ZeroProvider({ children, ...options }: ZeroProviderProps) {
  return <RocicorpZeroProvider {...options}>{children}</RocicorpZeroProvider>;
}
