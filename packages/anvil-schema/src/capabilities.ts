import { z } from 'zod';

export const PACK_CAPABILITY_VALUES = [
  'db',
  'db-pg',
  'auth',
  'payments',
  'email',
  'ui-kit',
  'local-runtime',
  'deploy-target',
  'e2e',
  'ai-sdk',
  'blob-storage',
  'analytics',
  'sync',
] as const;

export const TEMPLATE_CAPABILITY_VALUES = ['static', 'server', 'react', 'native', 'vue', 'svelte', 'mdx-content', 'edge-runtime'] as const;

export const PackCapability = z.enum(PACK_CAPABILITY_VALUES);
export type PackCapability = z.infer<typeof PackCapability>;

export const TemplateCapability = z.enum(TEMPLATE_CAPABILITY_VALUES);
export type TemplateCapability = z.infer<typeof TemplateCapability>;

const templateCapabilityLookup: ReadonlySet<string> = new Set(TEMPLATE_CAPABILITY_VALUES);
const capabilityOverlap = PACK_CAPABILITY_VALUES.filter((tag) => templateCapabilityLookup.has(tag));

if (capabilityOverlap.length > 0) {
  throw new Error(
    `PackCapability and TemplateCapability must not overlap: ${capabilityOverlap.join(', ')}`,
  );
}

export const EXCLUSIVE_CAPABILITIES: ReadonlySet<PackCapability> = new Set<PackCapability>([
  'db',
  'auth',
  'payments',
  'ui-kit',
  'sync',
]);

export const NON_EXCLUSIVE_CAPABILITIES: ReadonlySet<PackCapability> = new Set<PackCapability>([
  'ai-sdk',
  'analytics',
  'email',
  'blob-storage',
  'e2e',
  'deploy-target',
  'local-runtime',
]);
