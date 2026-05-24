# deploy-cloudflare

Cloudflare Workers deploy target for Spark projects that can run on the edge.

## Runtime Requirement

This pack requires a template that provides the `edge-runtime` template capability. Use it with `vite-react` after Batch 2E, or with any future edge-capable template that declares `edge-runtime`.

## Wire to api-trpc

The shipped `worker.ts` is a standalone health-check stub. After installing `api-trpc`, replace the stub fetch handler with a re-export of the Hono router fetch handler:

```ts
import { app } from './server/router'

export default { fetch: app.fetch }
```

## Cloudflare Setup

Log in locally before deploying:

```sh
bunx wrangler login
bunx wrangler deploy --dry-run
```

If `storage-s3` is also installed and you want Cloudflare R2, create an R2 bucket in the Cloudflare dashboard or with `wrangler r2 bucket create <bucket-name>`. Set `S3_ENDPOINT` in `.env.local` to the account-specific R2 S3-compatible endpoint, and configure the matching access key, secret key, bucket, and region values used by `storage-s3`.
