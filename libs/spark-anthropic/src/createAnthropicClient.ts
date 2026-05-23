import Anthropic from '@anthropic-ai/sdk';

export function createAnthropicClient(
  apiKey: string,
  options?: ConstructorParameters<typeof Anthropic>[0],
): Anthropic {
  return new Anthropic({ apiKey, ...options });
}
