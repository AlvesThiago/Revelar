import { cache } from "react";
import { cookies } from "next/headers";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { declarations, photos, replies, users } from "@/lib/schema";
import { audioPublicUrl, photoPublicUrl, sanitizeMediaUrl } from "@/lib/safe-url";
import { firstNameFromCouple } from "@/lib/slug";
import type {
  DeclarationRecord,
  PhotoFilter,
  PhotoRecord,
  PublicDeclaration,
  ReplyNotification,
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
    soundtrackUrl: sanitizeMediaUrl(audioPublicUrl(row.id, row.soundtrackUrl)),
    soundtrackType: row.soundtrackType as SoundtrackType,
    soundtrackName: row.soundtrackName,
    revealEffect: row.revealEffect as RevealEffect,
    wallpaper: row.wallpaper as Wallpaper,
    viewMode: row.viewMode as ViewMode,
    slideshowSeconds: row.slideshowSeconds,
    hasPassword: Boolean(row.passwordHash),
    published: row.published,
    paid: Boolean(row.paidAt),
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
          imageUrl: sanitizeMediaUrl(photoPublicUrl(photo.id, photo.imageUrl)),
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

export const getDeclarationById = cache(async function getDeclarationById(id: string) {
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
});

export const getDeclarationBySlug = cache(async function getDeclarationBySlug(slug: string) {
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
});

export const listDeclarationsForUser = cache(async function listDeclarationsForUser(userId: string) {
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
});

export function toPublicDeclaration(
  record: DeclarationRecord,
  ownerName?: string
): PublicDeclaration {
  const { userId, replies, paid, ...rest } = record;
  void userId;
  void replies;
  void paid;
  return {
    ...rest,
    replyToName: ownerName || firstNameFromCouple(record.coupleName),
  };
}

export const listReplyNotifications = cache(async function listReplyNotifications(
  userId: string
): Promise<ReplyNotification[]> {
  const rows = await db
    .select({
      id: replies.id,
      message: replies.message,
      createdAt: replies.createdAt,
      declarationId: declarations.id,
      coupleName: declarations.coupleName,
      title: declarations.title,
    })
    .from(replies)
    .innerJoin(declarations, eq(replies.declarationId, declarations.id))
    .where(eq(declarations.userId, userId))
    .orderBy(desc(replies.createdAt))
    .limit(80);

  return rows.map((row) => ({
    id: row.id,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    readAt: null,
    declarationId: row.declarationId,
    coupleName: row.coupleName,
    title: row.title,
  }));
});

export const REPLIES_SEEN_COOKIE = "revelar_replies_seen";

export function markReplyReadState(
  items: ReplyNotification[],
  seenAt: string | null
): ReplyNotification[] {
  return items.map((item) => ({
    ...item,
    readAt: seenAt && item.createdAt <= seenAt ? seenAt : null,
  }));
}

export const getInboxForUser = cache(async function getInboxForUser(userId: string) {
  const cookieStore = await cookies();
  const seen = cookieStore.get(REPLIES_SEEN_COOKIE)?.value ?? null;
  return markReplyReadState(await listReplyNotifications(userId), seen);
});

export const getOwnerName = cache(async function getOwnerName(userId: string) {
  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user?.name ?? "";
});

export type AccountSummary = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  albums: number;
  published: number;
  views: number;
  hasPassword: boolean;
  googleLinked: boolean;
};

export const getAccountForUser = cache(async function getAccountForUser(
  userId: string
): Promise<AccountSummary | null> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      passwordHash: users.passwordHash,
      googleId: users.googleId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return null;

  const [stats] = await db
    .select({
      albums: count(),
      published: sql<number>`coalesce(sum(case when ${declarations.published} then 1 else 0 end), 0)`,
      views: sql<number>`coalesce(sum(${declarations.viewCount}), 0)`,
    })
    .from(declarations)
    .where(eq(declarations.userId, userId));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    albums: Number(stats?.albums ?? 0),
    published: Number(stats?.published ?? 0),
    views: Number(stats?.views ?? 0),
    hasPassword: Boolean(user.passwordHash),
    googleLinked: Boolean(user.googleId),
  };
});
