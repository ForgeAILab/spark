import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "../server/router";

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        transformer: superjson,
        url: process.env.NEXT_PUBLIC_TRPC_URL ?? "/trpc",
      }),
    ],
  });
}
