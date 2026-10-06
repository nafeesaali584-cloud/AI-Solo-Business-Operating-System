/**
 * Workspace URL provider auto-detection & YouTube helper utilities
 * No external API calls — pure pattern and regex matching.
 */

export function detectProvider(url: string): string {
  if (!url) return "LINK";
  const trimmed = url.trim().toLowerCase();

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host.includes("youtube.com") || host.includes("youtu.be")) return "YOUTUBE";
    if (host.includes("instagram.com")) return "INSTAGRAM";
    if (host.includes("linkedin.com")) return "LINKEDIN";
    if (host.includes("facebook.com") || host.includes("fb.watch")) return "FACEBOOK";
    if (host.includes("twitter.com") || host.includes("x.com")) return "TWITTER";
    if (host.includes("tiktok.com")) return "TIKTOK";
    if (host.includes("google.com") && parsed.pathname.includes("maps") || host.includes("goo.gl")) return "GOOGLE_MAPS";
    if (host.includes("yelp.com")) return "YELP";
    if (host.includes("github.com")) return "GITHUB";
    if (host.includes("r2.dev") || host.includes("r2.cloudflarestorage")) return "R2";

    // Clean domain uppercase label, e.g. "techcrunch.com" -> "TECHCRUNCH.COM"
    return host.toUpperCase() || "WEBSITE";
  } catch {
    if (trimmed.includes("youtube") || trimmed.includes("youtu.be")) return "YOUTUBE";
    if (trimmed.includes("instagram")) return "INSTAGRAM";
    if (trimmed.includes("linkedin")) return "LINKEDIN";
    return "WEBSITE";
  }
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const str = url.trim();

  // Match shorts: youtube.com/shorts/VIDEO_ID
  const shortsMatch = str.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // Match standard youtu.be/VIDEO_ID
  const youtuBeMatch = str.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch && youtuBeMatch[1]) return youtuBeMatch[1];

  // Match youtube.com/watch?v=VIDEO_ID
  const watchMatch = str.match(/(?:watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // Match youtube.com/embed/VIDEO_ID
  const embedMatch = str.match(/(?:embed\/)([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  return null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
