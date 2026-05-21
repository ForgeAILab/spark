import { getOpenAIClient, OPENAI_CHAT_MODEL, type OpenAIChatMessage } from "../../../lib/openai";

export const runtime = "nodejs";

type ChatRequest = {
  messages?: OpenAIChatMessage[];
  prompt?: string;
};

function normalizeMessages(body: ChatRequest): OpenAIChatMessage[] {
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    return body.messages;
  }

  if (body.prompt) {
    return [{ role: "user", content: body.prompt }];
  }

  throw new Error("Request body must include messages or prompt.");
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as ChatRequest;
  const messages = normalizeMessages(body);

  const stream = await getOpenAIClient().chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    messages,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
