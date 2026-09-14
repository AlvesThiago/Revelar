import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { authConfig } from "@/lib/auth.config";
import { verifyPasswordForAccount } from "@/lib/crypto";
import { db } from "@/lib/db";
import { isGoogleAuthEnabled, linkOrCreateGoogleUser } from "@/lib/google-account";
import { users } from "@/lib/schema";
import { ensureSeeded } from "@/lib/seed";

const googleEnabled = isGoogleAuthEnabled();

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        await ensureSeeded();
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !verifyPasswordForAccount(password, user.passwordHash)) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const linked = await linkOrCreateGoogleUser({
        googleId: account.providerAccountId,
        email: user.email,
        name: user.name,
        profile,
      });
      if (!linked) return false;
      user.id = linked.id;
      user.name = linked.name;
      user.email = linked.email;
      return true;
    },
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      if (params.account?.provider === "google" && params.user) {
        if (typeof params.user.id === "string") token.id = params.user.id;
        if (typeof params.user.name === "string") token.name = params.user.name;
        if (typeof params.user.email === "string") token.email = params.user.email;
      }
      return token;
    },
  },
});
