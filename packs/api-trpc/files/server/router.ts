import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { z } from "zod";

import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string() }).optional())
    .query(({ input }) => ({ greeting: `Hello, ${input?.name ?? "world"}!` })),
});

export type AppRouter = typeof appRouter;

export const app = new Hono();

app.all("/trpc/*", (c) =>
  fetchRequestHandler({
    endpoint: "/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () => ({}),
  }),
);

app.all("/api/trpc/*", (c) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () => ({}),
  }),
);

export const fetchHandler = app.fetch;
