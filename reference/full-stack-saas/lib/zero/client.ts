'use client';

import { Zero } from '@rocicorp/zero';
import type { ZeroOptions } from '@rocicorp/zero';
import { schema } from '@/lib/zero/schema';
import { createMutators, type AuthData, type Mutators } from '@/lib/zero/mutators';

const DEFAULT_ZERO_URL = 'http://localhost:4848';

export type AppZeroOptions = ZeroOptions<typeof schema, Mutators>;

export type ZeroClientOptions = {
  authToken?: string | (() => Promise<string | undefined>);
  authData?: AuthData | undefined;
};

export function createZeroOptions(options: ZeroClientOptions = {}): AppZeroOptions {
  return {
    cacheURL: process.env.NEXT_PUBLIC_ZERO_URL ?? DEFAULT_ZERO_URL,
    schema,
    // Omit userID entirely for logged-out clients (per Zero's auth guidance);
    // passing a sentinel like 'anon' is deprecated and churns client groups.
    userID: options.authData?.sub,
    auth: typeof options.authToken === 'string' ? options.authToken : undefined,
    mutators: createMutators(options.authData),
  };
}

export function createZeroClient(options: AppZeroOptions = createZeroOptions()) {
  return new Zero(options);
}
