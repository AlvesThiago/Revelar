"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { applyApprovedPayment } from "@/lib/apply-payment";
import { albumPriceCents, isMercadoPagoEnabled } from "@/lib/billing";
import { isUuid, newId } from "@/lib/crypto";
import { db } from "@/lib/db";
import {
  createAlbumPreference,
  findApprovedPaymentByDeclaration,
  getMercadoPagoPayment,
} from "@/lib/mercadopago";
import { getDeclarationById } from "@/lib/queries";
import { declarations, payments } from "@/lib/schema";
import { clientKey, rateLimit } from "@/lib/security";
import { requireUser } from "@/lib/session";

export async function startCheckoutAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("declarationId") ?? "");
  if (!isUuid(id)) redirect("/dashboard");

  const key = await clientKey();
  if (!rateLimit(`checkout:${user.id}:${key}`, 8, 15 * 60 * 1000)) {
    redirect(`/dashboard/${id}?passo=4&pagamento=limite`);
  }
  if (!isMercadoPagoEnabled()) {
    redirect(`/dashboard/${id}?passo=4&pagamento=config`);
  }

  const record = await getDeclarationById(id);
  if (!record || record.userId !== user.id) redirect("/dashboard");
  if (record.paid) redirect(`/dashboard/${id}?passo=4`);

  try {
    const { preferenceId, checkoutUrl } = await createAlbumPreference({
      declarationId: id,
      title: record.coupleName || record.title || "Álbum Revellar",
      payerEmail: user.email,
    });

    await db.insert(payments).values({
      id: newId(),
      declarationId: id,
      userId: user.id,
      provider: "mercadopago",
      preferenceId,
      status: "pending",
      amountCents: albumPriceCents(),
    });

    redirect(checkoutUrl);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("startCheckoutAction");
    redirect(`/dashboard/${id}?passo=4&pagamento=erro`);
  }
}

export async function syncCheckoutReturn(id: string, paymentId?: string) {
  const user = await requireUser();
  if (!isUuid(id)) return { paid: false as const };

  const [album] = await db
    .select({
      id: declarations.id,
      userId: declarations.userId,
      paidAt: declarations.paidAt,
    })
    .from(declarations)
    .where(eq(declarations.id, id))
    .limit(1);
  if (!album || album.userId !== user.id) return { paid: false as const };
  if (album.paidAt) return { paid: true as const };

  try {
    const payment = paymentId
      ? await getMercadoPagoPayment(paymentId)
      : await findApprovedPaymentByDeclaration(id);
    if (!payment) return { paid: false as const };
    if (String(payment.external_reference ?? id) !== id) return { paid: false as const };
    return applyApprovedPayment(payment, id);
  } catch {
    console.error("syncCheckoutReturn");
    return { paid: false as const };
  }
}
