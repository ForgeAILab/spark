"use client";

import posthog from "posthog-js";

const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

export function getPostHogClient(): typeof posthog {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST;
  const loaded = (posthog as typeof posthog & { __loaded?: boolean }).__loaded;

  if (typeof window !== "undefined" && key && !loaded) {
    posthog.init(key, {
      api_host: host,
      capture_pageview: false,
    });
  }

  return posthog;
}
