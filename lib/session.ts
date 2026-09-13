import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user?.id) redirect("/entrar");
  return user;
}
