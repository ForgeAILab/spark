'use client';

import { createZeroClient as createSparkZeroClient } from '@forgeailab/spark-sync-zero';
import type { ZeroOptions } from '@forgeailab/spark-sync-zero';
import { schema } from './schema';

const DEFAULT_ZERO_URL = 'http://localhost:4848';

export function createZeroOptions(): ZeroOptions {
  return {
    cacheURL: process.env.NEXT_PUBLIC_ZERO_URL ?? DEFAULT_ZERO_URL,
    schema,
  };
}

export function createZeroClient(options: ZeroOptions = createZeroOptions()) {
  return createSparkZeroClient(options);
}
