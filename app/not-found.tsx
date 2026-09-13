import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 text-center">
      <p className="font-hand text-4xl text-rose">essa polaroid se perdeu</p>
      <h1 className="mt-2 text-2xl font-semibold text-graphite">Não encontramos esta declaração</h1>
      <Link href="/" className={cn(buttonVariants(), "mt-6 bg-graphite text-cream")}>
        Voltar ao início
      </Link>
    </div>
  );
}
