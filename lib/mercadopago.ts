import { createHmac, timingSafeEqual } from "crypto";
import { albumPriceAmount } from "@/lib/billing";

const API = "https://api.mercadopago.com";

function accessToken() {
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("MP_ACCESS_TOKEN ausente");
  return token;
}

async function mpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      detail = String(body.message || body.error || "");
    } catch {
      detail = "";
    }
    console.error("mercadopago", response.status, detail.slice(0, 160));
    throw new Error("Falha ao falar com o Mercado Pago");
  }
  return (await response.json()) as T;
}

export type MercadoPagoPreference = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

export type MercadoPagoPayment = {
  id: number | string;
  status?: string;
  external_reference?: string | null;
  transaction_amount?: number;
  currency_id?: string;
};

export async function createAlbumPreference(input: {
  declarationId: string;
  title: string;
  payerEmail?: string | null;
  baseUrl: string;
}) {
  const base = input.baseUrl.replace(/\/$/, "");
  const returnUrl = `${base}/dashboard/${input.declarationId}`;
  const itemTitle = input.title.trim() || "Álbum Revellar";
  const https = base.startsWith("https://");

  const preference = await mpFetch<MercadoPagoPreference>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: [
        {
          id: input.declarationId,
          title: itemTitle.slice(0, 120),
          quantity: 1,
          unit_price: Number(albumPriceAmount().toFixed(2)),
          currency_id: "BRL",
        },
      ],
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      external_reference: input.declarationId,
      metadata: { declarationId: input.declarationId },
      back_urls: {
        success: `${returnUrl}?passo=4&pagamento=ok`,
        failure: `${returnUrl}?passo=4&pagamento=erro`,
        pending: `${returnUrl}?passo=4&pagamento=pendente`,
      },
      ...(https ? { auto_return: "approved" } : {}),
      notification_url: `${base}/api/webhooks/mercadopago`,
    }),
  });

  const checkoutUrl = preference.init_point || preference.sandbox_init_point;

  if (!checkoutUrl) {
    throw new Error("Checkout do Mercado Pago sem URL");
  }

  return { preferenceId: preference.id, checkoutUrl };
}

export async function getMercadoPagoPayment(paymentId: string) {
  if (!/^\d+$/.test(paymentId)) return null;
  return mpFetch<MercadoPagoPayment>(`/v1/payments/${paymentId}`);
}

export async function findApprovedPaymentByDeclaration(declarationId: string) {
  const result = await mpFetch<{ results?: MercadoPagoPayment[] }>(
    `/v1/payments/search?sort=date_created&criteria=desc&external_reference=${encodeURIComponent(declarationId)}`
  );
  return (
    result.results?.find((payment) => payment.status === "approved") ??
    result.results?.[0] ??
    null
  );
}

export function verifyMercadoPagoSignature(input: {
  rawBody: string;
  signature: string | null;
  requestId: string | null;
  dataId: string;
}) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!input.signature || !input.requestId) return false;

  const parts = Object.fromEntries(
    input.signature.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key.trim(), rest.join("=").trim()];
    })
  );
  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  const manifest = `id:${input.dataId};request-id:${input.requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(hash, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
