import type Anthropic from '@anthropic-ai/sdk';
import { createAnthropicClient, streamResponse } from '@forgeailab/anvil-anthropic';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const anthropic = createAnthropicClient(requireEnv('ANTHROPIC_API_KEY'));

export { streamResponse };
export type AnthropicChatMessage = Anthropic.Messages.MessageParam;
