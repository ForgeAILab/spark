import { setupE2EStack } from './stack';

export default async function globalSetup(): Promise<void> {
  await setupE2EStack();
}
