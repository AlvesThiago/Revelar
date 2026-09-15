"use server";

import { eq } from "drizzle-orm";
import { applyApprovedPayment } from "@/lib/apply-payment";
import {
  albumPriceCents,
  isMercadoPagoEnabled,
  requestBaseUrl,
} from "@/lib/billing";
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

export type CheckoutState = {
  error?: string;
  url?: string;
};

export async function startCheckoutAction(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const user = await requireUser();
  const id = String(formData.get("declarationId") ?? "");
  if (!isUuid(id)) return { error: "Álbum não encontrado." };

  const key = await clientKey();
  if (!rateLimit(`checkout:${user.id}:${key}`, 8, 15 * 60 * 1000)) {
    return { error: "Muitas tentativas. Espere um pouco e tente de novo." };
  }
  if (!isMercadoPagoEnabled()) {
    return {
      error:
        "Falta o Access Token do Mercado Pago. Cole MP_ACCESS_TOKEN na Vercel e faça um novo deploy.",
    };
  }

  const record = await getDeclarationById(id);
  if (!record || record.userId !== user.id) {
    return { error: "Álbum não encontrado." };
  }
  if (record.paid) {
    return { error: "Este álbum já está pago." };
  }

  try {
    const { preferenceId, checkoutUrl } = await createAlbumPreference({
      declarationId: id,
      title: record.coupleName || record.title || "Álbum Revellar",
      payerEmail: user.email,
      baseUrl: await requestBaseUrl(),
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

    return { url: checkoutUrl };
  } catch {
    console.error("startCheckoutAction");
    return {
      error:
        "Não foi possível abrir o Mercado Pago. Confira o Access Token e se AUTH_URL é o domínio da Vercel.",
    };
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
