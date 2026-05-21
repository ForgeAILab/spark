"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import { getPostHogClient } from "../lib/posthog/client";

type PostHogProviderProps = {
  children: ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    getPostHogClient();
  }, []);

  return <Provider client={posthog}>{children}</Provider>;
}
