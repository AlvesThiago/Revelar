import { sanitizeMediaUrl } from "@/lib/safe-url";

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);

export function classifySoundtrack(url: string) {
  const value = sanitizeMediaUrl(url);
  if (!value) return { type: "url" as const, embedUrl: "" };

  if (value.startsWith("/uploads/") || value.startsWith("/api/media/")) {
    return { type: "url" as const, embedUrl: value };
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { type: "url" as const, embedUrl: "" };
  }

  if (parsed.hostname === "open.spotify.com") {
    const embed = value.replace("open.spotify.com/", "open.spotify.com/embed/");
    return { type: "spotify" as const, embedUrl: embed };
  }

  if (YOUTUBE_HOSTS.has(parsed.hostname)) {
    const id =
      parsed.hostname === "youtu.be"
        ? parsed.pathname.replace("/", "")
        : parsed.searchParams.get("v") ||
          parsed.pathname.match(/\/(?:embed|shorts)\/([A-Za-z0-9_-]{6,})/)?.[1];
    if (id && /^[A-Za-z0-9_-]{6,}$/.test(id)) {
      return {
        type: "youtube" as const,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&loop=1&playsinline=1&enablejsapi=1&playlist=${id}`,
      };
    }
  }

  return { type: "url" as const, embedUrl: value };
}
