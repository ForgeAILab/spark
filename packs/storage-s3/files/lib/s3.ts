import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type PresignedUploadUrlInput = {
  key: string;
  contentType: string;
  expiresIn?: number;
};

type PresignedDownloadUrlInput = {
  key: string;
  expiresIn?: number;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getBucket(): string {
  return getRequiredEnv("S3_BUCKET");
}

export function getS3Client(): S3Client {
  getRequiredEnv("S3_BUCKET");

  const accessKeyId = getRequiredEnv("S3_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("S3_SECRET_ACCESS_KEY");
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "auto";

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    ...(endpoint
      ? {
          endpoint,
          forcePathStyle: true,
        }
      : {}),
  });
}

export async function getPresignedUploadUrl({
  key,
  contentType,
  expiresIn = 3600,
}: PresignedUploadUrlInput): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn });
}

export async function getPresignedDownloadUrl({
  key,
  expiresIn = 3600,
}: PresignedDownloadUrlInput): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn });
}
