import { PostHog } from "posthog-node";

const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

let client: PostHog | undefined;

export function getPostHogServerClient(): PostHog | undefined {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!key) {
    return undefined;
  }

  client ??= new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST,
  });

  return client;
}

export async function shutdownPostHogServerClient(): Promise<void> {
  await client?.shutdown();
  client = undefined;
}
