import { eq } from "drizzle-orm";
import {
  normalizeEmail,
  normalizeName,
  validateEmail,
  validateName,
} from "@/lib/auth-validation";
import { newId } from "@/lib/crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { ensureSeeded } from "@/lib/seed";

export function isGoogleAuthEnabled() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

function displayName(profileName: string | undefined, email: string) {
  const fromProfile = normalizeName(profileName ?? "");
  if (!validateName(fromProfile)) return fromProfile.slice(0, 80);
  const local = normalizeName(
    (email.split("@")[0] ?? "").replace(/[._-]+/g, " ")
  );
  if (!validateName(local)) return local.slice(0, 80);
  return "Você";
}

function isGoogleEmailVerified(profile: unknown) {
  if (!profile || typeof profile !== "object") return true;
  const verified = (profile as { email_verified?: boolean | string }).email_verified;
  if (verified === undefined) return true;
  return verified === true || verified === "true";
}

export async function linkOrCreateGoogleUser(input: {
  googleId: string;
  email?: string | null;
  name?: string | null;
  profile: unknown;
}): Promise<{ id: string; name: string; email: string } | null> {
  if (!input.googleId || !isGoogleEmailVerified(input.profile)) return null;

  const email = normalizeEmail(input.email ?? "");
  if (validateEmail(email)) return null;

  await ensureSeeded();

  const [byGoogle] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.googleId, input.googleId))
    .limit(1);

  if (byGoogle) {
    if (byGoogle.email !== email) {
      const [taken] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!taken) {
        await db.update(users).set({ email }).where(eq(users.id, byGoogle.id));
        return { id: byGoogle.id, name: byGoogle.name, email };
      }
    }
    return { id: byGoogle.id, name: byGoogle.name, email: byGoogle.email };
  }

  const [byEmail] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      googleId: users.googleId,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (byEmail) {
    if (byEmail.googleId && byEmail.googleId !== input.googleId) return null;
    await db
      .update(users)
      .set({ googleId: input.googleId })
      .where(eq(users.id, byEmail.id));
    return { id: byEmail.id, name: byEmail.name, email: byEmail.email };
  }

  const name = displayName(input.name ?? undefined, email);
  const id = newId();
  await db.insert(users).values({
    id,
    name,
    email,
    googleId: input.googleId,
    passwordHash: null,
  });
  return { id, name, email };
}
