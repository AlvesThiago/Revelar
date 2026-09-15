import { headers } from "next/headers";

const DEFAULT_PRICE_BRL = 29.9;

export function albumPriceCents() {
  const raw = (process.env.ALBUM_PRICE_BRL ?? String(DEFAULT_PRICE_BRL)).replace(",", ".");
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return Math.round(DEFAULT_PRICE_BRL * 100);
  return Math.round(value * 100);
}

export function albumPriceAmount() {
  return albumPriceCents() / 100;
}

export function formatAlbumPrice() {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(albumPriceAmount());
}

export function isMercadoPagoEnabled() {
  return Boolean(process.env.MP_ACCESS_TOKEN?.trim());
}

function isLocalUrl(value: string) {
  return /127\.0\.0\.1|localhost/i.test(value);
}

export function appBaseUrl() {
  const authUrl = process.env.AUTH_URL?.replace(/\/$/, "");
  if (authUrl && !isLocalUrl(authUrl)) return authUrl;
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return authUrl || "http://127.0.0.1:3000";
}

export async function requestBaseUrl() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const proto =
    forwardedProto ||
    (host && isLocalUrl(host) ? "http" : "https");
  if (host) return `${proto}://${host}`.replace(/\/$/, "");
  return appBaseUrl();
}
