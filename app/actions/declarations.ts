"use server";

import { and, eq } from "drizzle-orm";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashPassword, newId, verifyPassword } from "@/lib/crypto";
import { db } from "@/lib/db";
import { declarations, photos, replies } from "@/lib/schema";
import {
  getDeclarationById,
  getDeclarationBySlug,
  getOwnerName,
  listDeclarationsForUser,
  serializeDeclaration,
  toPublicDeclaration,
} from "@/lib/queries";
import {
  RATE_LIMITED,
  assertSafeAudio,
  assertSafeImage,
  clientKey,
  rateLimit,
  removePublicUpload,
  signUnlockToken,
  unlockCookieName,
  unlockCookieOptions,
  verifyUnlockToken,
} from "@/lib/security";
import {
  parsePhotoFilter,
  parseRevealEffect,
  parseSoundtrackType,
  parseViewMode,
  parseWallpaper,
  sanitizeMediaUrl,
  sanitizeText,
  validateAlbumPassword,
} from "@/lib/safe-url";
import { requireUser } from "@/lib/session";
import { slugifyCoupleName } from "@/lib/slug";
import { ensureSeeded } from "@/lib/seed";
import type {
  PhotoFilter,
  RevealEffect,
  SoundtrackType,
  ViewMode,
  Wallpaper,
} from "@/lib/types";

async function uniqueSlug(base: string, ignoreId?: string) {
  const root = slugifyCoupleName(base);
  let candidate = root;
  let n = 2;
  while (true) {
    const found = await getDeclarationBySlug(candidate);
    if (!found || found.row.id === ignoreId) return candidate;
    candidate = `${root}-${n}`;
    n += 1;
  }
}

async function isUnlocked(slug: string, passwordHash: string | null) {
  if (!passwordHash) return true;
  const cookieStore = await cookies();
  return verifyUnlockToken(
    slug,
    passwordHash,
    cookieStore.get(unlockCookieName(slug))?.value
  );
}

export async function createDeclarationAction() {
  const user = await requireUser();
  await ensureSeeded();
  const id = newId();
  const slug = await uniqueSlug(`rascunho-${id.slice(0, 6)}`);

  await db.insert(declarations).values({
    id,
    userId: user.id,
    slug,
    coupleName: "",
    title: "",
  });

  redirect(`/dashboard/${id}`);
}

export async function getMyDeclarationsAction() {
  const user = await requireUser();
  await ensureSeeded();
  return listDeclarationsForUser(user.id);
}

export async function getEditorDeclarationAction(id: string) {
  const user = await requireUser();
  const record = await getDeclarationById(id);
  if (!record || record.userId !== user.id) return null;
  return record;
}

export type DeclarationDraft = {
  coupleName: string;
  title: string;
  startDate: string;
  soundtrackUrl: string;
  soundtrackType: SoundtrackType;
  soundtrackName: string;
  revealEffect: RevealEffect;
  wallpaper: Wallpaper;
  viewMode: ViewMode;
  slideshowSeconds: number;
  password: string;
  clearPassword?: boolean;
};

export async function saveDeclarationAction(id: string, draft: DeclarationDraft) {
  const user = await requireUser();
  const current = await getDeclarationById(id);
  if (!current || current.userId !== user.id) {
    return { error: "Declaração não encontrada." };
  }

  if (draft.password.trim()) {
    const passwordError = validateAlbumPassword(draft.password.trim());
    if (passwordError) return { error: passwordError };
  }

  const slugSource = draft.coupleName || current.slug;
  const slug = await uniqueSlug(slugSource, id);
  const startDate = draft.startDate ? new Date(draft.startDate) : null;
  const soundtrackUrl = sanitizeMediaUrl(draft.soundtrackUrl);

  const patch: Partial<typeof declarations.$inferInsert> = {
    coupleName: sanitizeText(draft.coupleName, 80),
    title: sanitizeText(draft.title, 120),
    startDate: startDate && !Number.isNaN(startDate.getTime()) ? startDate : null,
    soundtrackUrl,
    soundtrackType: parseSoundtrackType(draft.soundtrackType),
    soundtrackName: sanitizeText(draft.soundtrackName, 120),
    revealEffect: parseRevealEffect(draft.revealEffect),
    wallpaper: parseWallpaper(draft.wallpaper),
    viewMode: parseViewMode(draft.viewMode),
    slideshowSeconds: Math.min(20, Math.max(3, draft.slideshowSeconds || 5)),
    slug,
    updatedAt: new Date(),
  };

  if (draft.clearPassword) {
    patch.passwordHash = null;
  } else if (draft.password.trim()) {
    patch.passwordHash = hashPassword(draft.password.trim());
  }

  await db.update(declarations).set(patch).where(eq(declarations.id, id));
  return { ok: true, slug };
}

export async function uploadPhotoAction(formData: FormData) {
  const user = await requireUser();
  const declarationId = String(formData.get("declarationId") ?? "");
  const current = await getDeclarationById(declarationId);
  if (!current || current.userId !== user.id) {
    return { error: "Declaração não encontrada." };
  }
  if (current.photos.length >= 12) {
    return { error: "Você já usou as 12 polaroids deste álbum." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Envie uma foto para revelar." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { error: "A foto precisa ter menos de 8 MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = assertSafeImage(buffer);
  if (!kind) {
    return { error: "Envie uma foto JPG ou PNG válida." };
  }

  const filename = `${declarationId}-${newId()}.${kind}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  const photoId = newId();
  await db.insert(photos).values({
    id: photoId,
    declarationId,
    sortOrder: current.photos.length,
    imageUrl: `/uploads/${filename}`,
    caption: "",
    filter: "natural",
  });

  await db
    .update(declarations)
    .set({ updatedAt: new Date() })
    .where(eq(declarations.id, declarationId));

  revalidatePath(`/dashboard/${declarationId}`);
  return { ok: true, id: photoId, imageUrl: `/uploads/${filename}` };
}

export async function updatePhotoAction(
  photoId: string,
  data: { caption?: string; filter?: PhotoFilter }
) {
  const user = await requireUser();
  const [photo] = await db.select().from(photos).where(eq(photos.id, photoId)).limit(1);
  if (!photo) return { error: "Foto não encontrada." };
  const current = await getDeclarationById(photo.declarationId);
  if (!current || current.userId !== user.id) return { error: "Sem permissão." };

  const filter = parsePhotoFilter(data.filter) ?? photo.filter;

  await db
    .update(photos)
    .set({
      caption:
        data.caption === undefined ? photo.caption : sanitizeText(data.caption, 280),
      filter,
    })
    .where(eq(photos.id, photoId));

  revalidatePath(`/dashboard/${current.id}`);
  return { ok: true };
}

export async function deletePhotoAction(photoId: string) {
  const user = await requireUser();
  const [photo] = await db.select().from(photos).where(eq(photos.id, photoId)).limit(1);
  if (!photo) return { error: "Foto não encontrada." };
  const current = await getDeclarationById(photo.declarationId);
  if (!current || current.userId !== user.id) return { error: "Sem permissão." };

  await db.delete(photos).where(eq(photos.id, photoId));
  await removePublicUpload(photo.imageUrl);
  const remaining = current.photos.filter((item) => item.id !== photoId);
  for (const [index, item] of remaining.entries()) {
    await db.update(photos).set({ sortOrder: index }).where(eq(photos.id, item.id));
  }

  revalidatePath(`/dashboard/${current.id}`);
  return { ok: true };
}

export async function reorderPhotosAction(declarationId: string, orderedIds: string[]) {
  const user = await requireUser();
  const current = await getDeclarationById(declarationId);
  if (!current || current.userId !== user.id) return { error: "Sem permissão." };

  const allowed = new Set(current.photos.map((item) => item.id));
  const uniqueIds = orderedIds.filter((id, index, list) => allowed.has(id) && list.indexOf(id) === index);

  for (const [index, id] of uniqueIds.entries()) {
    await db
      .update(photos)
      .set({ sortOrder: index })
      .where(and(eq(photos.id, id), eq(photos.declarationId, declarationId)));
  }

  revalidatePath(`/dashboard/${declarationId}`);
  return { ok: true };
}

export async function publishDeclarationAction(id: string) {
  const user = await requireUser();
  const current = await getDeclarationById(id);
  if (!current || current.userId !== user.id) return { error: "Não encontrada." };
  if (!current.coupleName.trim() || !current.title.trim()) {
    return { error: "Preencha o nome do casal e o título antes de publicar." };
  }
  if (current.photos.length === 0) {
    return { error: "Revele pelo menos uma foto para publicar." };
  }

  const slug = await uniqueSlug(current.coupleName, id);
  await db
    .update(declarations)
    .set({ published: true, slug, updatedAt: new Date() })
    .where(eq(declarations.id, id));

  revalidatePath("/dashboard");
  revalidatePath(`/nos/${slug}`);
  return { ok: true, slug };
}

export async function unpublishDeclarationAction(id: string) {
  const user = await requireUser();
  const current = await getDeclarationById(id);
  if (!current || current.userId !== user.id) return { error: "Não encontrada." };
  await db
    .update(declarations)
    .set({ published: false, updatedAt: new Date() })
    .where(eq(declarations.id, id));
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function getPublicDeclarationAction(slug: string) {
  await ensureSeeded();
  const found = await getDeclarationBySlug(slug);
  if (!found || !found.row.published) return { status: "missing" as const };

  if (!(await isUnlocked(found.row.slug, found.row.passwordHash))) {
    return {
      status: "locked" as const,
      coupleName: found.row.coupleName,
      title: found.row.title,
      wallpaper: found.row.wallpaper as Wallpaper,
    };
  }

  const ownerName = await getOwnerName(found.row.userId);
  const record = serializeDeclaration(found.row, found.photos);
  return {
    status: "ok" as const,
    declaration: toPublicDeclaration(record, ownerName),
  };
}

export async function unlockDeclarationAction(slug: string, password: string) {
  const key = await clientKey();
  if (!rateLimit(`unlock:${key}:${slug}`, 8, 15 * 60 * 1000)) {
    return { error: RATE_LIMITED };
  }

  const found = await getDeclarationBySlug(slug);
  if (!found || !found.row.published || !found.row.passwordHash) {
    return { error: "Não foi possível abrir este envelope." };
  }
  if (!verifyPassword(password, found.row.passwordHash)) {
    return { error: "Senha incorreta." };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    unlockCookieName(found.row.slug),
    signUnlockToken(found.row.slug, found.row.passwordHash),
    unlockCookieOptions()
  );

  return { ok: true };
}

export async function recordViewAction(slug: string) {
  const found = await getDeclarationBySlug(slug);
  if (!found || !found.row.published) return;
  if (!(await isUnlocked(found.row.slug, found.row.passwordHash))) return;

  await db
    .update(declarations)
    .set({
      lastViewedAt: new Date(),
      viewCount: found.row.viewCount + 1,
    })
    .where(eq(declarations.id, found.row.id));
}

export async function sendReplyAction(slug: string, message: string) {
  const key = await clientKey();
  if (!rateLimit(`reply:${key}:${slug}`, 5, 10 * 60 * 1000)) {
    return { error: RATE_LIMITED };
  }

  const found = await getDeclarationBySlug(slug);
  if (!found || !found.row.published) return { error: "Declaração não encontrada." };
  if (!(await isUnlocked(found.row.slug, found.row.passwordHash))) {
    return { error: "Desbloqueie o envelope para responder." };
  }

  const text = sanitizeText(message, 500);
  if (text.length < 2) return { error: "Escreva algumas palavras." };

  await db.insert(replies).values({
    id: newId(),
    declarationId: found.row.id,
    message: text,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function uploadSoundtrackAction(formData: FormData) {
  const user = await requireUser();
  const declarationId = String(formData.get("declarationId") ?? "");
  const current = await getDeclarationById(declarationId);
  if (!current || current.userId !== user.id) return { error: "Não encontrada." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Envie um MP3." };
  if (file.size > 12 * 1024 * 1024) return { error: "O áudio precisa ter menos de 12 MB." };

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!assertSafeAudio(buffer)) {
    return { error: "Envie um arquivo MP3 válido." };
  }

  const filename = `${declarationId}-${newId()}.mp3`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  await removePublicUpload(current.soundtrackUrl);

  const safeName = sanitizeText(file.name.replace(/[/\\]/g, ""), 120) || "trilha.mp3";

  await db
    .update(declarations)
    .set({
      soundtrackUrl: `/uploads/${filename}`,
      soundtrackType: "upload",
      soundtrackName: safeName,
      updatedAt: new Date(),
    })
    .where(eq(declarations.id, declarationId));

  revalidatePath(`/dashboard/${declarationId}`);
  return { ok: true, url: `/uploads/${filename}`, name: safeName };
}
