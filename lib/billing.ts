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
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

export function appBaseUrl() {
  return (process.env.AUTH_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
}
