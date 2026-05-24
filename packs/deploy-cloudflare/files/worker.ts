import type { ExecutionContext } from '@cloudflare/workers-types'

// TODO: after installing api-trpc, replace the stub fetch with:
// import { app } from './server/router'; export default { fetch: app.fetch };
export default {
  fetch(
    _request: Request,
    _env: unknown,
    _ctx: ExecutionContext,
  ): Response {
    return new Response('OK', { status: 200 })
  },
}
