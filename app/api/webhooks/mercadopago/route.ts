import { NextResponse } from "next/server";
import { applyApprovedPayment } from "@/lib/apply-payment";
import {
  getMercadoPagoPayment,
  verifyMercadoPagoSignature,
} from "@/lib/mercadopago";

export const runtime = "nodejs";

function paymentIdFrom(body: unknown, url: URL) {
  const queryId = url.searchParams.get("data.id") || url.searchParams.get("id");
  const topic = url.searchParams.get("type") || url.searchParams.get("topic");
  if (queryId && (topic === "payment" || url.searchParams.get("topic") === "payment")) {
    return queryId;
  }
  if (!body || typeof body !== "object") return queryId;
  const payload = body as {
    type?: string;
    action?: string;
    data?: { id?: string | number };
  };
  if (payload.type === "payment" || payload.action?.startsWith("payment.")) {
    return payload.data?.id != null ? String(payload.data.id) : queryId;
  }
  return queryId;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  let body: unknown = {};
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    body = {};
  }

  const url = new URL(request.url);
  const dataId = paymentIdFrom(body, url);
  if (!dataId) return NextResponse.json({ ok: true });

  const valid = verifyMercadoPagoSignature({
    rawBody,
    signature: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
  });
  if (!valid) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const payment = await getMercadoPagoPayment(dataId);
    const declarationId = payment?.external_reference;
    if (payment && declarationId) {
      await applyApprovedPayment(payment, declarationId);
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
