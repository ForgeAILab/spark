# Vite React Template

This template provides a client-first Vite scaffold for Spark apps that do not need SSR. It includes React 19, TypeScript, wouter routing, Tailwind CSS v4 through the Vite plugin, and a minimal Hono API entrypoint for local Bun development or Cloudflare Workers deployment.

Choose `vite-react` over `nextjs` when the app is a client-side SPA, needs static asset output, should deploy cleanly to Cloudflare Workers, and does not need server-rendered routes or framework-managed SSR.

The `bun dev:api` script requires installing a `data-api` provider (e.g. `spark add api-trpc`).
