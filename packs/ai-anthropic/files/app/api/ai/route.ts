import { anthropic, streamResponse, type AnthropicChatMessage } from '@/lib/anthropic';
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_MODEL = 'claude-sonnet-4-5';
const DEFAULT_MAX_TOKENS = 1_024;
const HARD_MAX_TOKENS = 4_096;

type ChatRequest = {
  messages?: unknown;
  system?: string;
  model?: string;
  maxTokens?: number;
};

function normalizeMessages(value: unknown): AnthropicChatMessage[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const messages: AnthropicChatMessage[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) return undefined;
    const role = 'role' in entry ? entry.role : undefined;
    const content = 'content' in entry ? entry.content : undefined;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return undefined;
    messages.push({ role, content });
  }
  return messages.length > 0 ? messages : undefined;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ChatRequest;
  const messages = normalizeMessages(body.messages);

  if (!messages) {
    return NextResponse.json(
      { error: 'messages must be a non-empty array of user/assistant strings' },
      { status: 400 },
    );
  }

  const maxTokens = Math.min(Math.max(1, body.maxTokens ?? DEFAULT_MAX_TOKENS), HARD_MAX_TOKENS);

  const stream = streamResponse(anthropic, {
    model: body.model ?? DEFAULT_MODEL,
    max_tokens: maxTokens,
    system: body.system,
    messages,
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
