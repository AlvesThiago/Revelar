import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { declarations } from "@/lib/schema";
import { parseDataUrl } from "@/lib/storage";
import { unlockCookieName, verifyUnlockToken } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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

  return new Response(new Uint8Array(data.bytes), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
