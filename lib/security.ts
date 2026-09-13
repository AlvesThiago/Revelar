import { createHmac, timingSafeEqual } from "crypto";
import { unlink } from "fs/promises";
import path from "path";
import { headers } from "next/headers";
import { safeUploadFilename } from "@/lib/safe-url";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function signingSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("Configuração de autenticação incompleta.");
  }
  return secret;
}

export function unlockCookieName(slug: string) {
  return `revelar_unlock_${slug}`;
}

export function signUnlockToken(slug: string, passwordHash: string) {
  return createHmac("sha256", signingSecret())
    .update(`unlock:${slug}:${passwordHash}`)
    .digest("hex");
}

export function verifyUnlockToken(
  slug: string,
  passwordHash: string,
  token: string | undefined
) {
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) return false;
  const expected = signUnlockToken(slug, passwordHash);
  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(token, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function unlockCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function clientKey() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || requestHeaders.get("x-real-ip") || "local";
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || now >= current.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export const RATE_LIMITED = "Muitas tentativas. Espere um pouco e tente de novo.";

export function detectImageKind(buffer: Buffer): "jpg" | "png" | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  return null;
}

export function isMp3Buffer(buffer: Buffer) {
  if (buffer.length < 3) return false;
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true;
  return buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
}

function looksLikeMarkup(buffer: Buffer) {
  const head = buffer.subarray(0, 256).toString("utf8").toLowerCase();
  return (
    head.includes("<svg") ||
    head.includes("<html") ||
    head.includes("<script") ||
    head.includes("<?xml")
  );
}

export function assertSafeImage(buffer: Buffer) {
  if (looksLikeMarkup(buffer)) return null;
  return detectImageKind(buffer);
}

export function assertSafeAudio(buffer: Buffer) {
  return isMp3Buffer(buffer) && !looksLikeMarkup(buffer);
}

export async function removePublicUpload(publicPath: string) {
  if (!publicPath.startsWith("/uploads/")) return;
  const filename = safeUploadFilename(publicPath.slice("/uploads/".length));
  if (!filename || filename !== publicPath.slice("/uploads/".length)) return;
  const root = path.resolve(process.cwd(), "public", "uploads");
  const full = path.resolve(root, filename);
  if (!full.startsWith(root + path.sep) && full !== root) return;
  await unlink(full).catch(() => undefined);
}
