import OpenAI from "openai";

let client: OpenAI | undefined;

export type OpenAIChatMessage = {
  role: "developer" | "system" | "user" | "assistant";
  content: string;
};

export const OPENAI_CHAT_MODEL = "gpt-5.2";

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to use the OpenAI client.");
  }

  client ??= new OpenAI({ apiKey });
  return client;
}
