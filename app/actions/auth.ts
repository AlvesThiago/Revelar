"use server";

import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import {
  normalizeEmail,
  normalizeName,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/auth-validation";
import { hashPassword, newId } from "@/lib/crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { RATE_LIMITED, clientKey, rateLimit } from "@/lib/security";
import { ensureSeeded } from "@/lib/seed";

export type AuthFormState = {
  error?: string;
};

function unavailableError(): AuthFormState {
  return {
    error: "Não foi possível criar a conta agora. Tente de novo em instantes.",
  };
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const key = await clientKey();
  if (!rateLimit(`register:${key}`, 5, 15 * 60 * 1000)) {
    return { error: RATE_LIMITED };
  }

  const name = normalizeName(String(formData.get("name") ?? ""));
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  const nameError = validateName(name);
  if (nameError) return { error: nameError };

  const emailError = validateEmail(email);
  if (emailError) return { error: emailError };

  if (!rateLimit(`register-email:${email}`, 3, 15 * 60 * 1000)) {
    return { error: RATE_LIMITED };
  }

  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  try {
    await ensureSeeded();
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) return { error: "Este e-mail já tem uma conta. Entre para continuar." };

    await db.insert(users).values({
      id: newId(),
      name,
      email,
      passwordHash: hashPassword(password),
    });
  } catch (error) {
    if (error instanceof AuthError) throw error;
    console.error("registerAction");
    return unavailableError();
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Conta criada, mas o login falhou. Tente entrar." };
    }
    throw error;
  }

  return {};
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const key = await clientKey();
  if (!rateLimit(`login:${key}`, 8, 15 * 60 * 1000)) {
    return { error: RATE_LIMITED };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (validateEmail(email) || !password) {
    return { error: "E-mail ou senha incorretos." };
  }

  if (!rateLimit(`login-email:${email}`, 8, 15 * 60 * 1000)) {
    return { error: RATE_LIMITED };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha incorretos." };
    }
    throw error;
  }

  return {};
}
