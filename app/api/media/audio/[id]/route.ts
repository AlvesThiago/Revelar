import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { isUuid } from "@/lib/crypto";
import { db } from "@/lib/db";
import { declarations } from "@/lib/schema";
import { parseDataUrl } from "@/lib/storage";
import { unlockCookieName, verifyUnlockToken } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!isUuid(id)) return new Response(null, { status: 404 });
  const [declaration] = await db
    .select()
    .from(declarations)
    .where(eq(declarations.id, id))
    .limit(1);
  if (!declaration) return new Response(null, { status: 404 });

  const session = await auth();
  const isOwner = session?.user?.id === declaration.userId;
  if (!isOwner) {
    if (!declaration.published) return new Response(null, { status: 404 });
    if (declaration.passwordHash) {
      const cookieStore = await cookies();
      const unlocked = verifyUnlockToken(
        declaration.slug,
        declaration.passwordHash,
        cookieStore.get(unlockCookieName(declaration.slug))?.value
      );
      if (!unlocked) return new Response(null, { status: 404 });
    }
  }

  const data = parseDataUrl(declaration.soundtrackUrl);
  if (!data || data.contentType !== "audio/mpeg") {
    return new Response(null, { status: 404 });
  }

  const bytes = data.bytes;
  const size = bytes.length;
  const range = request.headers.get("range");
  const common = {
    "Content-Type": "audio/mpeg",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Number(match[2]) : size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      return new Response(null, {
        status: 416,
        headers: { ...common, "Content-Range": `bytes */${size}` },
      });
    }
    const safeEnd = Math.min(end, size - 1);
    const chunk = bytes.subarray(start, safeEnd + 1);
    return new Response(new Uint8Array(chunk), {
      status: 206,
      headers: {
        ...common,
        "Content-Length": String(chunk.length),
        "Content-Range": `bytes ${start}-${safeEnd}/${size}`,
      },
    });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      ...common,
      "Content-Length": String(size),
    },
  });
}
