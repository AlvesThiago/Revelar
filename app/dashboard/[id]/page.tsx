import { notFound } from "next/navigation";
import { syncCheckoutReturn } from "@/app/actions/billing";
import { Wizard } from "@/components/dashboard/wizard";
import { SiteHeader } from "@/components/site-header";
import { formatAlbumPrice, isMercadoPagoEnabled } from "@/lib/billing";
import { getDeclarationById } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Estúdio" };

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    passo?: string;
    pagamento?: string;
    payment_id?: string;
    collection_id?: string;
  }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { passo, pagamento, payment_id, collection_id } = await searchParams;
  if (pagamento || payment_id || collection_id) {
    await syncCheckoutReturn(id, payment_id || collection_id);
  }
  const record = await getDeclarationById(id);
  if (!record || record.userId !== user.id) notFound();
  const initialStep = Math.min(3, Math.max(0, Number(passo) - 1 || 0));

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <Wizard
        initial={record}
        initialStep={initialStep}
        priceLabel={formatAlbumPrice()}
        paymentsEnabled={isMercadoPagoEnabled()}
        paymentHint={pagamento}
      />
    </div>
  );
}
