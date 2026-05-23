import { createAnthropicClient, streamResponse } from '@forgeailab/anvil-anthropic';

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

export { streamResponse };

export default anthropic;
