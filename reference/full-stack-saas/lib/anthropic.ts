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

export const anthropic = createAnthropicClient(process.env.ANTHROPIC_API_KEY!);

export type AnthropicClientLike = {
  messages: {
    create: (params: Record<string, unknown>) => AsyncIterable<unknown> | Promise<AsyncIterable<unknown>>;
  };
};

function isTextDeltaEvent(event: unknown): event is {
  type: 'content_block_delta';
  delta: { type: 'text_delta'; text: string };
} {
  return (
    typeof event === 'object' &&
    event !== null &&
    (event as { type?: unknown }).type === 'content_block_delta' &&
    typeof (event as { delta?: { text?: unknown } }).delta?.text === 'string'
  );
}

export async function* streamChatSse(
  params: Record<string, unknown>,
  client: AnthropicClientLike = anthropic as unknown as AnthropicClientLike,
): AsyncGenerator<string> {
  const stream = await client.messages.create({
    ...params,
    stream: true,
  });

  for await (const event of stream) {
    if (isTextDeltaEvent(event)) {
      yield `data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`;
    }
  }

  yield `data: ${JSON.stringify({ type: 'done' })}\n\n`;
}

export default anthropic;
