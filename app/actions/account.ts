"use server";

import { and, eq, ne } from "drizzle-orm";
import { signOut, unstable_update } from "@/lib/auth";
import {
  normalizeEmail,
  normalizeName,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/auth-validation";
import { revalidateUserWorkspace } from "@/lib/cache";
import { hashPassword, verifyPasswordForAccount } from "@/lib/crypto";
import { db } from "@/lib/db";
import { declarations, payments, photos, replies, users } from "@/lib/schema";
import { RATE_LIMITED, clientKey, rateLimit } from "@/lib/security";
import { requireUser } from "@/lib/session";
import { deleteUpload } from "@/lib/storage";

export type AccountFormState = {
  error?: string;
  ok?: string;
};

async function limited(action: string, userId: string, limit: number) {
  const key = await clientKey();
  return rateLimit(`${action}:${userId}:${key}`, limit, 15 * 60 * 1000);
}

export async function updateProfileAction(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const user = await requireUser();
  if (!(await limited("account-profile", user.id, 10))) {
    return { error: RATE_LIMITED };
  }

  const name = normalizeName(String(formData.get("name") ?? ""));
  const nameError = validateName(name);
  if (nameError) return { error: nameError };

  await db.update(users).set({ name }).where(eq(users.id, user.id));
  await unstable_update({ user: { name } });
  revalidateUserWorkspace();
  return { ok: "Nome atualizado." };
}

export async function updateEmailAction(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const user = await requireUser();
  if (!(await limited("account-email", user.id, 5))) {
    return { error: RATE_LIMITED };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const emailError = validateEmail(email);
  if (emailError) return { error: emailError };

  const [row] = await db
    .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  if (!row) return { error: "Conta não encontrada." };
  if (!row.passwordHash) {
    return { error: "Contas do Google usam o e-mail da conta Google. Crie uma senha se quiser trocar o e-mail aqui." };
  }
  if (!password) return { error: "Confirme com a senha atual." };
  if (!verifyPasswordForAccount(password, row.passwordHash)) {
    return { error: "Senha atual incorreta." };
  }
  if (row.email === email) return { ok: "Este já é o e-mail da conta." };

  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, user.id)))
    .limit(1);
  if (taken) return { error: "Este e-mail já está em outra conta." };

  await db.update(users).set({ email }).where(eq(users.id, user.id));
  await unstable_update({ user: { email } });
  revalidateUserWorkspace();
  return { ok: "E-mail atualizado." };
}

export async function updatePasswordAction(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const user = await requireUser();
  if (!(await limited("account-password", user.id, 5))) {
    return { error: RATE_LIMITED };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("newPassword") ?? "");
  const passwordError = validatePassword(nextPassword);
  if (passwordError) return { error: passwordError };

  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  if (!row) return { error: "Conta não encontrada." };
  if (row.passwordHash) {
    if (!currentPassword) return { error: "Informe a senha atual." };
    if (!verifyPasswordForAccount(currentPassword, row.passwordHash)) {
      return { error: "Senha atual incorreta." };
    }
    if (verifyPasswordForAccount(nextPassword, row.passwordHash)) {
      return { error: "A nova senha precisa ser diferente da atual." };
    }
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(nextPassword) })
    .where(eq(users.id, user.id));
  revalidateUserWorkspace();
  return { ok: row.passwordHash ? "Senha atualizada." : "Senha criada. Agora você também pode entrar com e-mail." };
}

export async function deleteAccountAction(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const user = await requireUser();
  if (!(await limited("account-delete", user.id, 3))) {
    return { error: RATE_LIMITED };
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "")
    .trim()
    .toLowerCase();
  if (confirm !== "apagar") {
    return { error: 'Digite "apagar" para confirmar.' };
  }

  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  if (!row) return { error: "Conta não encontrada." };
  if (row.passwordHash) {
    if (!password) return { error: "Confirme com a senha atual." };
    if (!verifyPasswordForAccount(password, row.passwordHash)) {
      return { error: "Senha atual incorreta." };
    }
  }

  const albums = await db
    .select({ id: declarations.id, soundtrackUrl: declarations.soundtrackUrl, slug: declarations.slug })
    .from(declarations)
    .where(eq(declarations.userId, user.id));

  for (const album of albums) {
    const photoRows = await db
      .select({ imageUrl: photos.imageUrl })
      .from(photos)
      .where(eq(photos.declarationId, album.id));
    await db.delete(replies).where(eq(replies.declarationId, album.id));
    await db.delete(photos).where(eq(photos.declarationId, album.id));
    await db.delete(payments).where(eq(payments.declarationId, album.id));
    await db.delete(declarations).where(eq(declarations.id, album.id));
    for (const photo of photoRows) {
      await deleteUpload(photo.imageUrl);
    }
    await deleteUpload(album.soundtrackUrl);
  }

  await db.delete(users).where(eq(users.id, user.id));
  revalidateUserWorkspace();
  await signOut({ redirectTo: "/" });
  return {};
}

export async function signOutAction() {
  await requireUser();
  await signOut({ redirectTo: "/" });
}
