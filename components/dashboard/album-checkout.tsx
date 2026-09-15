"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { startCheckoutAction, type CheckoutState } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";

function PayButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="btn-love h-11 w-full border-0 sm:w-auto">
      {pending ? "Abrindo o Mercado Pago..." : "Pagar com Mercado Pago"}
    </Button>
  );
}

export function AlbumCheckout({
  declarationId,
  priceLabel,
  enabled,
  hint,
}: {
  declarationId: string;
  priceLabel: string;
  enabled: boolean;
  hint?: string;
}) {
  const [state, action] = useActionState(startCheckoutAction, {} as CheckoutState);

  useEffect(() => {
    if (state.url) window.location.assign(state.url);
  }, [state.url]);

  const message =
    state.error ||
    (hint === "erro"
      ? "O pagamento não foi concluído. Você pode tentar de novo."
      : hint === "pendente"
        ? "O pagamento ainda está em análise. Assim que cair, o link é liberado."
        : hint === "ok"
          ? "Estamos confirmando o pagamento com o Mercado Pago..."
          : hint === "limite"
            ? "Muitas tentativas. Espere um pouco e tente de novo."
            : hint === "config"
              ? "O checkout ainda não está configurado neste ambiente."
              : !enabled
                ? "Falta o Access Token do Mercado Pago na Vercel. Depois de colar, faça um novo deploy."
                : null);

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="neu-card space-y-4 rounded-3xl p-6">
        <p className="font-hand text-2xl text-rose">último passo</p>
        <h2 className="text-lg font-semibold">Liberar o álbum</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          O link exclusivo e o QR code só aparecem depois do pagamento. Você monta o
          álbum à vontade; a surpresa só vai para a pessoa quando esta etapa estiver
          paga.
        </p>
        <div className="rounded-2xl bg-blush/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose/80">
            Valor do álbum
          </p>
          <p className="mt-1 text-2xl font-semibold text-graphite">{priceLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            PIX ou cartão no Mercado Pago. Um pagamento libera este álbum para sempre.
          </p>
        </div>
        {message ? <p className="text-sm text-rose">{message}</p> : null}
        <form action={action}>
          <input type="hidden" name="declarationId" value={declarationId} />
          <PayButton />
        </form>
      </div>
      <div className="neu-card space-y-3 rounded-3xl p-6">
        <h2 className="text-lg font-semibold">O que você recebe</h2>
        <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
          <li>Link só de vocês, para abrir no celular.</li>
          <li>QR code com coração, para imprimir ou mandar na hora.</li>
          <li>Envio pelo WhatsApp e respostas de volta.</li>
        </ul>
      </div>
    </section>
  );
}
