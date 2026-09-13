import Link from "next/link";
import { createDeclarationAction } from "@/app/actions/declarations";
import { SiteHeader } from "@/components/site-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { PolaroidCard } from "@/components/polaroid-card";
import { formatLastSeen } from "@/lib/dates";
import { listDeclarationsForUser } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { ensureSeeded } from "@/lib/seed";
import { cn } from "@/lib/utils";

export const metadata = { title: "Painel" };

export default async function DashboardPage() {
  const user = await requireUser();
  await ensureSeeded();
  const items = await listDeclarationsForUser(user.id);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-hand text-2xl text-rose">olá, {user.name?.split(" ")[0]}</p>
            <h1 className="text-3xl font-semibold text-graphite">Suas declarações</h1>
          </div>
          <form action={createDeclarationAction}>
            <Button type="submit" className="h-11 bg-graphite text-cream">
              Nova declaração
            </Button>
          </form>
        </div>

        {items.length === 0 ? (
          <div className="neu-card mt-10 rounded-3xl px-6 py-16 text-center">
            <p className="font-hand text-3xl text-rose">o álbum ainda está em branco</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Comece com o nome de vocês e a primeira foto. O resto do estúdio espera por você.
            </p>
          </div>
        ) : (
          <ul className="mt-10 grid gap-6 md:grid-cols-2">
            {items.map((item) => (
              <li key={item.id} className="neu-card overflow-hidden rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {item.published ? "No ar" : "Rascunho"}
                    </p>
                    <h2 className="text-xl font-semibold text-graphite">
                      {item.coupleName || "Sem nome ainda"}
                    </h2>
                    <p className="font-hand text-xl text-rose">{item.title || "sem título"}</p>
                  </div>
                  {item.photos[0] ? (
                    <PolaroidCard
                      imageUrl={item.photos[0].imageUrl}
                      caption=""
                      filter={item.photos[0].filter}
                      size="sm"
                      rotate={6}
                      interactive={false}
                      className="w-[110px] pb-2"
                    />
                  ) : null}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{formatLastSeen(item.lastViewedAt)}</p>
                <p className="text-sm text-muted-foreground">
                  {item.viewCount} {item.viewCount === 1 ? "visita" : "visitas"}
                  {item.replies.length
                    ? ` · ${item.replies.length} ${item.replies.length === 1 ? "resposta" : "respostas"}`
                    : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/dashboard/${item.id}`} className={cn(buttonVariants(), "bg-graphite text-cream")}>
                    Continuar no estúdio
                  </Link>
                  {item.published ? (
                    <>
                      <Link href={`/nos/${item.slug}`} className={cn(buttonVariants({ variant: "outline" }))}>
                        Ver link
                      </Link>
                      <Link
                        href={`/dashboard/${item.id}?passo=4`}
                        className={cn(buttonVariants({ variant: "outline" }))}
                      >
                        Compartilhar
                      </Link>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
