import {
  PHOTO_FILTERS,
  VIEW_MODES,
  WALLPAPERS,
  type PhotoFilter,
  type RevealEffect,
  type SoundtrackType,
  type ViewMode,
  type Wallpaper,
} from "@/lib/types";

const PRIVATE_HOST =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|169\.254\.\d+\.\d+)$/i;

export function safeUploadFilename(name: string) {
  const base = name.replace(/\\/g, "/").split("/").pop() || "";
  return base.replace(/[^A-Za-z0-9._-]/g, "");
}

export function sanitizeText(value: string, max: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

export function validateAlbumPassword(password: string): string | undefined {
  if (password.length < 6) return "A senha do envelope precisa ter pelo menos 6 caracteres.";
  if (password.length > 64) return "A senha do envelope é longa demais.";
  return undefined;
}

function isPrivateHostname(hostname: string) {
  return PRIVATE_HOST.test(hostname);
}

export function sanitizeMediaUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  if (value.startsWith("/uploads/")) {
    const filename = safeUploadFilename(value.slice("/uploads/".length));
    return filename ? `/uploads/${filename}` : "";
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "";
  }

  if (parsed.protocol !== "https:") return "";
  if (parsed.username || parsed.password) return "";
  if (isPrivateHostname(parsed.hostname)) return "";
  return parsed.toString();
}

const REVEAL_EFFECTS = new Set<RevealEffect>(["polaroid", "camera"]);
const SOUNDTRACK_TYPES = new Set<SoundtrackType>(["url", "upload", "spotify", "youtube"]);

export function parseWallpaper(value: string): Wallpaper {
  return WALLPAPERS.some((item) => item.id === value) ? (value as Wallpaper) : "wood";
}

export function parseViewMode(value: string): ViewMode {
  return VIEW_MODES.some((item) => item.id === value) ? (value as ViewMode) : "deck";
}

export function parseRevealEffect(value: string): RevealEffect {
  return REVEAL_EFFECTS.has(value as RevealEffect) ? (value as RevealEffect) : "polaroid";
}

export function parseSoundtrackType(value: string): SoundtrackType {
  return SOUNDTRACK_TYPES.has(value as SoundtrackType)
    ? (value as SoundtrackType)
    : "url";
}

export function parsePhotoFilter(value: string | undefined): PhotoFilter | undefined {
  if (!value) return undefined;
  return PHOTO_FILTERS.some((item) => item.id === value)
    ? (value as PhotoFilter)
    : undefined;
}
