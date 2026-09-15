import { startCheckoutAction } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";

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
  const message =
    hint === "erro"
      ? "O pagamento não foi concluído. Você pode tentar de novo."
      : hint === "pendente"
        ? "O pagamento ainda está em análise. Assim que cair, o link é liberado."
        : hint === "ok"
          ? "Estamos confirmando o pagamento com o Mercado Pago..."
          : hint === "limite"
            ? "Muitas tentativas. Espere um pouco e tente de novo."
            : hint === "config"
              ? "O checkout ainda não está configurado neste ambiente."
              : null;

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
        {!enabled && !message ? (
          <p className="text-sm text-rose">
            O checkout ainda não está configurado neste ambiente.
          </p>
        ) : null}
        {message ? <p className="text-sm text-rose">{message}</p> : null}
        <form action={startCheckoutAction}>
          <input type="hidden" name="declarationId" value={declarationId} />
          <Button
            type="submit"
            disabled={!enabled}
            className="btn-love h-11 w-full border-0 sm:w-auto"
          >
            Pagar com Mercado Pago
          </Button>
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
