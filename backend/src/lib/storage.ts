import { S3Client, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env";

export const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

export async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
    await s3.send(
      new PutBucketPolicyCommand({
        Bucket: env.S3_BUCKET,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${env.S3_BUCKET}/*`],
            },
          ],
        }),
      })
    );
  }
}

export function publicUrlFor(key: string): string {
  return `${env.S3_PUBLIC_URL}/${key}`;
}

export async function uploadObject(key: string, body: Buffer, contentType: string): Promise<string> {
  await s3.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: body, ContentType: contentType }));
  return publicUrlFor(key);
}
