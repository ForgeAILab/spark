import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { anthropic, streamResponse } from '@/lib/anthropic';

export const runtime = 'nodejs';

const DEFAULT_MODEL = 'claude-sonnet-4-5';
const DEFAULT_MAX_TOKENS = 1024;

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1),
      }),
    )
    .min(1),
  system: z.string().optional(),
  model: z.string().optional(),
  maxTokens: z.number().int().positive().max(4096).optional(),
});

type ChatMessage = Anthropic.Messages.MessageParam;

export async function POST(request: NextRequest) {
  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => undefined));

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'messages must be a non-empty array of user/assistant strings' },
      { status: 400 },
    );
  }

  const stream = streamResponse(anthropic, {
    model: parsed.data.model ?? DEFAULT_MODEL,
    max_tokens: parsed.data.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: parsed.data.system,
    messages: parsed.data.messages as ChatMessage[],
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
