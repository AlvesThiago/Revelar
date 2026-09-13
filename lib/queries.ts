import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { declarations, photos, replies, users } from "@/lib/schema";
import { sanitizeMediaUrl } from "@/lib/safe-url";
import { firstNameFromCouple } from "@/lib/slug";
import type {
  DeclarationRecord,
  PhotoFilter,
  PhotoRecord,
  PublicDeclaration,
  ReplyRecord,
  RevealEffect,
  SoundtrackType,
  ViewMode,
  Wallpaper,
} from "@/lib/types";

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export function serializeDeclaration(
  row: typeof declarations.$inferSelect,
  photoRows: (typeof photos.$inferSelect)[],
  replyRows: (typeof replies.$inferSelect)[] = []
): DeclarationRecord {
  return {
    id: row.id,
    userId: row.userId,
    slug: row.slug,
    coupleName: row.coupleName,
    title: row.title,
    startDate: toIso(row.startDate),
    soundtrackUrl: sanitizeMediaUrl(row.soundtrackUrl),
    soundtrackType: row.soundtrackType as SoundtrackType,
    soundtrackName: row.soundtrackName,
    revealEffect: row.revealEffect as RevealEffect,
    wallpaper: row.wallpaper as Wallpaper,
    viewMode: row.viewMode as ViewMode,
    slideshowSeconds: row.slideshowSeconds,
    hasPassword: Boolean(row.passwordHash),
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastViewedAt: toIso(row.lastViewedAt),
    viewCount: row.viewCount,
    photos: photoRows
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(
        (photo): PhotoRecord => ({
          id: photo.id,
          declarationId: photo.declarationId,
          sortOrder: photo.sortOrder,
          imageUrl: sanitizeMediaUrl(photo.imageUrl),
          caption: photo.caption,
          filter: photo.filter as PhotoFilter,
        })
      ),
    replies: replyRows
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(
        (reply): ReplyRecord => ({
          id: reply.id,
          declarationId: reply.declarationId,
          message: reply.message,
          createdAt: reply.createdAt.toISOString(),
        })
      ),
  };
}

export async function getDeclarationById(id: string) {
  const [row] = await db
    .select()
    .from(declarations)
    .where(eq(declarations.id, id))
    .limit(1);
  if (!row) return null;
  const photoRows = await db
    .select()
    .from(photos)
    .where(eq(photos.declarationId, id))
    .orderBy(asc(photos.sortOrder));
  const replyRows = await db
    .select()
    .from(replies)
    .where(eq(replies.declarationId, id))
    .orderBy(desc(replies.createdAt));
  return serializeDeclaration(row, photoRows, replyRows);
}

export async function getDeclarationBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(declarations)
    .where(eq(declarations.slug, slug))
    .limit(1);
  if (!row) return null;
  const photoRows = await db
    .select()
    .from(photos)
    .where(eq(photos.declarationId, row.id))
    .orderBy(asc(photos.sortOrder));
  return { row, photos: photoRows };
}

export async function listDeclarationsForUser(userId: string) {
  const rows = await db
    .select()
    .from(declarations)
    .where(eq(declarations.userId, userId))
    .orderBy(desc(declarations.updatedAt));

  const result: DeclarationRecord[] = [];
  for (const row of rows) {
    const photoRows = await db
      .select()
      .from(photos)
      .where(eq(photos.declarationId, row.id))
      .orderBy(asc(photos.sortOrder));
    const replyRows = await db
      .select()
      .from(replies)
      .where(eq(replies.declarationId, row.id))
      .orderBy(desc(replies.createdAt));
    result.push(serializeDeclaration(row, photoRows, replyRows));
  }
  return result;
}

export function toPublicDeclaration(
  record: DeclarationRecord,
  ownerName?: string
): PublicDeclaration {
  const { userId, replies, ...rest } = record;
  void userId;
  void replies;
  return {
    ...rest,
    replyToName: ownerName || firstNameFromCouple(record.coupleName),
  };
}

export async function getOwnerName(userId: string) {
  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user?.name ?? "";
}
