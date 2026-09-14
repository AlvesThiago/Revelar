import type { NextAuthConfig } from "next-auth";

const isProd = process.env.NODE_ENV === "production";

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 12,
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
  pages: {
    signIn: "/entrar",
  },
  providers: [],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
        if (typeof user.name === "string") token.name = user.name;
        if (typeof user.email === "string") token.email = user.email;
      }
      if (trigger === "update" && session) {
        const next =
          session && typeof session === "object" && "user" in session && session.user
            ? session.user
            : session;
        if (next && typeof next === "object") {
          if ("name" in next && typeof next.name === "string") token.name = next.name;
          if ("email" in next && typeof next.email === "string") token.email = next.email;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      if (session.user && typeof token.name === "string") {
        session.user.name = token.name;
      }
      if (session.user && typeof token.email === "string") {
        session.user.email = token.email;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
