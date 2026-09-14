import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

function privateCache(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Vary", "Cookie");
  return response;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const signedIn = Boolean(req.auth?.user?.id);

  if (pathname.startsWith("/dashboard") && !signedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    return privateCache(NextResponse.redirect(url));
  }

  if (signedIn && (pathname === "/entrar" || pathname === "/cadastrar")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return privateCache(NextResponse.redirect(url));
  }

  return privateCache(NextResponse.next());
});

export const config = {
  matcher: ["/dashboard/:path*", "/entrar", "/cadastrar"],
};
