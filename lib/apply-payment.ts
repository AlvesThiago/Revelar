import { eq } from "drizzle-orm";
import { revalidateUserWorkspace } from "@/lib/cache";
import { newId } from "@/lib/crypto";
import { db } from "@/lib/db";
import { albumPriceAmount } from "@/lib/billing";
import type { MercadoPagoPayment } from "@/lib/mercadopago";
import { declarations, payments, photos } from "@/lib/schema";
import { uniqueSlugFromCouple } from "@/lib/publish";

export async function applyApprovedPayment(
  payment: MercadoPagoPayment,
  declarationId: string
) {
  if (payment.status !== "approved") return { paid: false as const };
  const paymentId = String(payment.id);

  const [album] = await db
    .select()
    .from(declarations)
    .where(eq(declarations.id, declarationId))
    .limit(1);
  if (!album) return { paid: false as const };

  const now = new Date();
  const [existing] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.paymentId, paymentId))
    .limit(1);

  if (!existing) {
    await db.insert(payments).values({
      id: newId(),
      declarationId,
      userId: album.userId,
      provider: "mercadopago",
      paymentId,
      status: "approved",
      amountCents: Math.round((payment.transaction_amount ?? albumPriceAmount()) * 100),
      currency: payment.currency_id ?? "BRL",
      paidAt: now,
    });
  } else {
    await db
      .update(payments)
      .set({ status: "approved", paidAt: now })
      .where(eq(payments.paymentId, paymentId));
  }

  const photoRows = await db
    .select({ id: photos.id })
    .from(photos)
    .where(eq(photos.declarationId, declarationId));

  const canPublish =
    Boolean(album.coupleName.trim()) &&
    Boolean(album.title.trim()) &&
    photoRows.length > 0;

  const slug = canPublish
    ? await uniqueSlugFromCouple(album.coupleName, album.id)
    : album.slug;

  await db
    .update(declarations)
    .set({
      paidAt: album.paidAt ?? now,
      published: canPublish ? true : album.published,
      slug,
      updatedAt: now,
    })
    .where(eq(declarations.id, declarationId));

  revalidateUserWorkspace({ id: declarationId, slug, previousSlug: album.slug });
  return { paid: true as const, published: canPublish };
}
