import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-[#ead9d0]/70 bg-[#fffdf9]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-hand text-3xl leading-none text-graphite">
          revelar
        </Link>
        <nav className="flex items-center gap-2">
          {session?.user ? (
            <>
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
                className={cn(
                  buttonVariants(),
                  "bg-graphite text-cream hover:bg-graphite/90"
                )}
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
