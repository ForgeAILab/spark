import { describe, expect, test } from 'bun:test';
import type Anthropic from '@anthropic-ai/sdk';
import { streamResponse } from '../src/streamResponse';

async function readChunks(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      return chunks;
    }

    chunks.push(decoder.decode(value));
  }
}

describe('streamResponse', () => {
  test('encodes content block deltas as SSE chunks and terminates', async () => {
    const mockClient = {
      messages: {
        stream: () => ({
          async *[Symbol.asyncIterator]() {
            yield {
              type: 'content_block_delta',
              index: 0,
              delta: { type: 'text_delta', text: 'Hello' },
            };
            yield {
              type: 'content_block_delta',
              index: 0,
              delta: { type: 'text_delta', text: ' world' },
            };
          },
        }),
      },
    } as unknown as Anthropic;

    const chunks = await readChunks(
      streamResponse(mockClient, {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [],
      }),
    );

    expect(chunks[0].startsWith('data: ')).toBe(true);
    expect(chunks[0]).toContain('content_block_delta');
    expect(chunks.at(-1)).toBe('data: [DONE]\n\n');
  });
});
