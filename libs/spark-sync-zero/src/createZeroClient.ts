import { Zero } from '@rocicorp/zero';
import type { ZeroOptions } from '@rocicorp/zero';

export type { ZeroOptions } from '@rocicorp/zero';
export type CreateZeroClientOptions = ZeroOptions;
export type ZeroClient = InstanceType<typeof Zero>;

export function createZeroClient(options: CreateZeroClientOptions): ZeroClient {
  return new Zero(options);
}
