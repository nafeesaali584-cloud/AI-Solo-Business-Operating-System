import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID!;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export interface UploadResult {
  url: string;
  fileKey: string;
  provider: "R2" | "LOCAL";
  size: number;
}

export async function uploadWorkspaceFile(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<UploadResult> {
  const ext = path.extname(originalFilename) || "";
  const sanitizedBase = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  const uniqueKey = `${Date.now()}-${sanitizedBase}${ext}`;

  if (isR2Configured()) {
    const bucket = process.env.R2_BUCKET_NAME!;
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: uniqueKey,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    const publicUrl = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${uniqueKey}`
      : `/api/workspace/files/${uniqueKey}`;

    return {
      url: publicUrl,
      fileKey: uniqueKey,
      provider: "R2",
      size: buffer.length,
    };
  }

  // Fallback: local public/uploads/workspace/ directory
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "workspace");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, uniqueKey);
  await fs.promises.writeFile(filePath, buffer);

  return {
    url: `/uploads/workspace/${uniqueKey}`,
    fileKey: uniqueKey,
    provider: "LOCAL",
    size: buffer.length,
  };
}

export async function deleteWorkspaceFile(fileKey: string, provider?: string): Promise<void> {
  if (!fileKey) return;

  if (provider === "R2" && isR2Configured()) {
    try {
      const bucket = process.env.R2_BUCKET_NAME!;
      const client = getR2Client();
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: fileKey,
        })
      );
    } catch (err) {
      console.error("Failed to delete file from Cloudflare R2:", err);
    }
    return;
  }

  // Local filesystem cleanup
  try {
    const filePath = path.join(process.cwd(), "public", "uploads", "workspace", fileKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.error("Failed to delete local workspace file:", err);
  }
}
