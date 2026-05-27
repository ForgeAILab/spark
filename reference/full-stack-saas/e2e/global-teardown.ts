import { teardownE2EStack } from './stack';

export default async function globalTeardown(): Promise<void> {
  console.log('[e2e] tearing down postgres/zero-cache stack');
  teardownE2EStack();
}
