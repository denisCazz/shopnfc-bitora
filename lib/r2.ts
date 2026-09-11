import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

function getEnvOrThrow(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`${name} mancante`);
  return val;
}

export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://${process.env.R2_BUCKET_NAME || "bucket"}.${process.env.R2_ACCOUNT_ID || "account"}.r2.dev`;

let _r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!_r2Client) {
    const accountId = getEnvOrThrow("R2_ACCOUNT_ID");
    const accessKeyId = getEnvOrThrow("R2_ACCESS_KEY_ID");
    const secretAccessKey = getEnvOrThrow("R2_SECRET_ACCESS_KEY");
    _r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _r2Client;
}

function getBucket(): string {
  return getEnvOrThrow("R2_BUCKET_NAME");
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
}

export function getR2KeyFromUrl(url: string): string | null {
  if (!url.startsWith(R2_PUBLIC_URL)) return null;
  return url.replace(`${R2_PUBLIC_URL}/`, "");
}

export { getR2Client as r2Client, getBucket as r2Bucket };
