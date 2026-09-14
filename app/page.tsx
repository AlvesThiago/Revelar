import Link from "next/link";
import { CameraMockup } from "@/components/camera-mockup";
import { LoveBackdrop } from "@/components/love-backdrop";
import { PolaroidCard } from "@/components/polaroid-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

const STEPS = [
  {
    n: "01",
    title: "Escolha as fotos",
    text: "Até 12 memórias. Cada uma vira uma polaroid com filtro retrô e a frase que só vocês entendem.",
  },
  {
    n: "02",
    title: "Escreva as cartas",
    text: "Título, data de início e a trilha que toca quando a pessoa abre o envelope.",
  },
  {
    n: "03",
    title: "Compartilhe o link",
    text: "Um endereço só de vocês, com QR code e um clique para o WhatsApp.",
  },
];

export default function HomePage() {
  return (
    <div className="relative flex min-h-full flex-col">
      <LoveBackdrop />
      <SiteHeader />
      <main className="relative z-10 flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="max-w-xl">
            <p className="love-stamp font-hand text-lg">feito com amor, sem feed</p>
            <p className="font-hand mt-4 text-3xl text-rose">uma carta que se revela ♥</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-graphite sm:text-5xl sm:leading-[1.1]">
              Transforme suas memórias em uma declaração inesquecível
            </h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              Monte um álbum instantâneo, escreva o que ficou na garganta e envie um
              link que abre como um envelope. Sem feed. Sem distração. Só vocês dois.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cadastrar"
                className={cn(buttonVariants({ size: "lg" }), "btn-love h-12 border-0 px-5")}
              >
                Criar nossa declaração
              </Link>
              <Link
                href="/nos/gabriel-e-amanda"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-5")}
              >
                Ver exemplo de casal
              </Link>
            </div>
          </div>
          <CameraMockup />
        </section>

        <section id="como-funciona" className="border-y border-[#f0cfc8]/80 bg-blush/50">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <article
                key={step.n}
                className={cn(
                  "neu-card paper-grain rounded-3xl p-6",
                  index === 1 && "lg:-rotate-1",
                  index === 2 && "lg:rotate-1"
                )}
              >
                <p className="font-hand text-3xl text-rose">{step.n}</p>
                <h2 className="mt-2 text-xl font-semibold text-graphite">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="memorias" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-hand text-2xl text-rose">demonstração viva</p>
              <h2 className="text-3xl font-semibold text-graphite">Gabriel & Amanda, um ano depois</h2>
            </div>
            <Link
              href="/nos/gabriel-e-amanda"
              className={cn(buttonVariants({ variant: "outline" }), "h-10")}
            >
              Abrir o álbum completo
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <PolaroidCard
              imageUrl="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=900&q=80"
              caption="quando o sol baixou"
              filter="sepia"
              rotate={-6}
            />
            <PolaroidCard
              imageUrl="https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=900&q=80"
              caption="nossas mãos já se conheciam"
              filter="bw"
              rotate={4}
            />
            <PolaroidCard
              imageUrl="https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=900&q=80"
              caption="ainda bem que insistimos"
              filter="vintage"
              rotate={-2}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
