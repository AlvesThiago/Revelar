import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ReplyReader } from "@/components/dashboard/reply-inbox";
import { buttonVariants } from "@/components/ui/button";
import { formatWhen } from "@/lib/dates";
import { getInboxForUser } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Respostas" };

export default async function RepliesPage() {
  const user = await requireUser();
  const items = await getInboxForUser(user.id);

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.declarationId;
    acc[key] = acc[key] ? [...acc[key], item] : [item];
    return acc;
  }, {});

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <ReplyReader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <p className="font-hand text-2xl text-rose">caixa de entrada</p>
        <h1 className="text-3xl font-semibold text-graphite">Respostas recebidas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tudo o que alguém escreveu de volta nos seus álbuns.
        </p>

        {items.length === 0 ? (
          <div className="neu-card mt-10 rounded-3xl px-6 py-16 text-center">
            <p className="font-hand text-3xl text-rose">ainda está quieto por aqui</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Quando a pessoa abrir o link e responder, a mensagem aparece nesta página e no sino do topo.
            </p>
            <Link href="/dashboard" className={cn(buttonVariants(), "btn-love mt-6 border-0")}>
              Voltar ao painel
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {Object.values(grouped).map((group) => {
              const album = group[0];
              return (
                <section key={album.declarationId} className="neu-card rounded-3xl p-5 sm:p-6">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-graphite">
                        {album.coupleName || "Sem nome ainda"}
                      </h2>
                      <p className="font-hand text-xl text-rose">{album.title || "sem título"}</p>
                    </div>
                    <Link
                      href={`/dashboard/${album.declarationId}?passo=4`}
                      className={cn(buttonVariants({ variant: "outline" }))}
                    >
                      Abrir álbum
                    </Link>
                  </div>
                  <ul className="mt-5 space-y-3">
                    {group.map((reply) => (
                      <li key={reply.id} className="rounded-2xl bg-blush/60 px-4 py-3">
                        <p className="font-hand text-2xl leading-snug text-graphite">{reply.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatWhen(reply.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
