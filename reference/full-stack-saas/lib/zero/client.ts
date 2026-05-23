'use client';

import { createZeroClient as createAnvilZeroClient } from '@forgeailab/anvil-sync-zero';
import type { ZeroOptions } from '@forgeailab/anvil-sync-zero';
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
    userID: options.authData?.sub ?? 'anon',
    auth: typeof options.authToken === 'string' ? options.authToken : undefined,
    mutators: createMutators(options.authData),
  };
}

export function createZeroClient(options: AppZeroOptions = createZeroOptions()) {
  return createAnvilZeroClient(options as unknown as ZeroOptions);
}
