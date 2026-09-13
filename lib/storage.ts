import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { removePublicUpload } from "@/lib/security";

function isVercel() {
  return Boolean(process.env.VERCEL);
}

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function parseDataUrl(value: string) {
  const match = value.match(/^data:(image\/(?:jpeg|png)|audio\/mpeg);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  return {
    contentType: match[1],
    bytes: Buffer.from(match[2], "base64"),
  };
}

export async function saveUpload(input: {
  buffer: Buffer;
  filename: string;
  contentType: "image/jpeg" | "image/png" | "audio/mpeg";
  publicPath: string;
}): Promise<string> {
  if (hasBlobToken()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(input.filename, input.buffer, {
      access: "public",
      contentType: input.contentType,
    });
    return blob.url;
  }

  if (isVercel()) {
    return `data:${input.contentType};base64,${input.buffer.toString("base64")}`;
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, input.filename), input.buffer);
  return input.publicPath;
}

export async function deleteUpload(storedUrl: string) {
  if (!storedUrl) return;
  if (storedUrl.startsWith("data:")) return;
  if (storedUrl.includes("blob.vercel-storage.com") && hasBlobToken()) {
    const { del } = await import("@vercel/blob");
    await del(storedUrl).catch(() => undefined);
    return;
  }
  await removePublicUpload(storedUrl);
}
