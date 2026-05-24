# storage-s3

## What the pack provides

`storage-s3` provides the `blob-storage` capability with helpers for S3-compatible object storage. It works with AWS S3 by default, and with Cloudflare R2 or other compatible services when `S3_ENDPOINT` is set.

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
