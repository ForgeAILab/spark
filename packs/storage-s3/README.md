# storage-s3

## What the pack provides

`storage-s3` provides the `blob-storage` capability with helpers for S3-compatible object storage. It works with AWS S3 by default, and with Cloudflare R2 or other compatible services when `S3_ENDPOINT` is set.

## Local dev (MinIO)

The pack ships a MinIO service in `compose/minio.yml` plus an `include:` entry
in the root `docker-compose.yml`. After install:

```bash
docker compose up -d minio minio-bucket
```

MinIO listens on `:9000` (API) and `:9001` (console). The `minio-bucket`
sidecar creates `${S3_BUCKET}` on first boot and exits.

`.env.local` for local dev:

```env
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=app
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_REGION=auto
```

## AWS S3 setup

Set these environment variables:

```env
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=
```

## Cloudflare R2 setup

Set `S3_ENDPOINT` to your account endpoint and use the automatic region:

```env
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
```

## Server handler example

```ts
import { getPresignedUploadUrl } from "@/lib/s3";

export async function createUploadUrl(input: { key: string; contentType: string }) {
  return getPresignedUploadUrl({
    key: input.key,
    contentType: input.contentType,
  });
}
```
