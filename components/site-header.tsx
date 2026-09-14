import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { ReplyInbox } from "@/components/dashboard/reply-inbox";
import { Button, buttonVariants } from "@/components/ui/button";
import { getInboxForUser } from "@/lib/queries";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const session = await auth();
  const replies = session?.user?.id ? await getInboxForUser(session.user.id) : [];

  return (
    <header className="sticky top-0 z-40 border-b border-[#f0cfc8]/70 bg-[#fff7f2]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-hand text-3xl leading-none text-graphite">
          revelar <span className="text-rose">♥</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {session?.user ? (
            <>
              <ReplyInbox items={replies} />
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost" }))}>
                Painel
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="outline">
                  Sair
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/entrar" className={cn(buttonVariants({ variant: "ghost" }))}>
                Entrar
              </Link>
              <Link
                href="/cadastrar"
                className={cn(buttonVariants(), "btn-love border-0")}
              >
                Criar nossa declaração
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
