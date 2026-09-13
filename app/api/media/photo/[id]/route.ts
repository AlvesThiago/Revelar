import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { declarations, photos } from "@/lib/schema";
import { cookies } from "next/headers";
import { parseDataUrl } from "@/lib/storage";
import { unlockCookieName, verifyUnlockToken } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const [photo] = await db.select().from(photos).where(eq(photos.id, id)).limit(1);
  if (!photo) return new Response(null, { status: 404 });

  const [declaration] = await db
    .select()
    .from(declarations)
    .where(eq(declarations.id, photo.declarationId))
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

  const data = parseDataUrl(photo.imageUrl);
  if (!data || !data.contentType.startsWith("image/")) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(data.bytes), {
    headers: {
      "Content-Type": data.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
