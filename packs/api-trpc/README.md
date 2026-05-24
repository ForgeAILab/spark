# api-trpc

`api-trpc` adds a typed RPC layer using tRPC v11, React Query, SuperJSON, Zod, and a Hono fetch app. It provides the exclusive `data-api` capability and expects a database pack to already be installed.

Installed files:

- `server/trpc.ts` creates the shared tRPC builder.
- `server/router.ts` exports `appRouter`, `AppRouter`, the Hono `app`, and `fetchHandler`.
- `lib/trpc-client.ts` exports the React client helpers.

## Next App Router

Create `app/api/trpc/[trpc]/route.ts` and re-export handlers from the Hono app:

```ts
import { app } from "@/server/router";

export const GET = app.fetch;
export const POST = app.fetch;
```

The pack router handles `/api/trpc/*` for this direct Next mount and `/trpc/*` for runtimes that mount it at the app root.

## Vite Dev Server

Create `server/dev.ts` as a Hono + Node server entry that imports the shared app:

```ts
import { serve } from "@hono/node-server";

import { app } from "./router";

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT ?? 3001),
});
```

Point the client at the dev API with `NEXT_PUBLIC_TRPC_URL=http://localhost:3001/trpc` when the frontend and API run on separate ports.

## Cloudflare Workers

Create `worker.ts` and export the Hono fetch handler:

```ts
import { app } from "./server/router";

export default {
  fetch: app.fetch,
};
```

## Client Usage

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { createTRPCClient, trpc } from "@/lib/trpc-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

export function Hello() {
  const hello = trpc.hello.useQuery({ name: "world" });

  return <p>{hello.data?.greeting}</p>;
}
```
