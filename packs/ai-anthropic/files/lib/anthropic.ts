import Anthropic from '@anthropic-ai/sdk';

export function createAnthropicClient(
  apiKey: string,
  options?: ConstructorParameters<typeof Anthropic>[0],
): Anthropic {
  return new Anthropic({ apiKey, ...options });
}

const encoder = new TextEncoder();

function isContentBlockDeltaEvent(event: unknown): event is { type: 'content_block_delta' } {
  return (
    typeof event === 'object' &&
    event !== null &&
    (event as { type?: unknown }).type === 'content_block_delta'
  );
}

function encodeSse(payload: unknown) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export function streamResponse(
  client: Anthropic,
  params: Parameters<Anthropic['messages']['stream']>[0],
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client.messages.stream(params);

        for await (const event of stream) {
          if (isContentBlockDeltaEvent(event)) {
            controller.enqueue(encodeSse(event));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const anthropic = createAnthropicClient(requireEnv('ANTHROPIC_API_KEY'));

export type AnthropicChatMessage = Anthropic.Messages.MessageParam;
