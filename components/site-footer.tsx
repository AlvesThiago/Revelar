import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export async function SiteFooter() {
  const session = await auth();
  const links = [
    { href: "/#como-funciona", label: "Como funciona" },
    { href: "/#memorias", label: "Memórias de exemplo" },
    { href: "/nos/gabriel-e-amanda", label: "Álbum de Gabriel & Amanda" },
    session?.user
      ? { href: "/dashboard", label: "Painel" }
      : { href: "/entrar", label: "Entrar" },
    ...(session?.user ? [{ href: "/dashboard/conta", label: "Conta" }] : []),
  ];
  return (
    <footer className="relative z-10 mt-auto border-t border-[#f0cfc8]/80 bg-[#fff4ef]/90">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.75fr_0.95fr] lg:py-14">
        <div>
          <Link href="/" className="font-hand text-4xl leading-none text-graphite">
            revellar <span className="text-rose">♥</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Polaroids digitais para quem guarda o que importa. Monte o envelope,
            escreva a carta e envie um link só de vocês.
          </p>
          <p className="font-hand mt-5 text-2xl text-rose">nós, para sempre</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose/80">
            Atalhos
          </p>
          <ul className="mt-4 space-y-2.5">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-graphite transition-colors hover:text-rose"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="neu-card paper-grain rounded-3xl p-5">
          <p className="font-hand text-2xl text-rose">
            {session?.user ? "continuar no estúdio" : "sua vez de revelar"}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {session?.user
              ? "Suas declarações estão no painel, prontas para editar ou enviar."
              : "Em alguns minutos o álbum está pronto para enviar no WhatsApp."}
          </p>
          <Link
            href={session?.user ? "/dashboard" : "/cadastrar"}
            className={cn(buttonVariants(), "btn-love mt-5 h-11 border-0")}
          >
            {session?.user ? "Abrir o painel" : "Criar nossa declaração"}
          </Link>
        </div>
      </div>

      <div className="border-t border-[#f0cfc8]/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
          <p>© 2026 Revellar · feito com amor, sem feed</p>
          <p className="font-hand text-base text-rose/80">guarde o que o feed esqueceria</p>
        </div>
      </div>
    </footer>
  );
}
