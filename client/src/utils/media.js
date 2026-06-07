/**
 * Build a full URL for uploaded media (poster, backdrop, avatar, ...).
 * In dev, empty VITE_API_URL + Vite proxy serves /uploads from the API server.
 */
export function getMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Normalize trailer link. */
export function getTrailerUrl(url) {
  if (!url?.trim()) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return `https://${trimmed.replace(/^\/+/, '')}`;
  }
  return trimmed.startsWith('/') ? trimmed : `https://${trimmed}`;
}

/** Extract YouTube embed URL for in-page trailer player. */
export function getYoutubeEmbedUrl(url) {
  const normalized = getTrailerUrl(url);
  if (!normalized) return '';

  let videoId =
    normalized.match(/youtu\.be\/([^?&]+)/)?.[1] ||
    normalized.match(/[?&]v=([^&]+)/)?.[1] ||
    normalized.match(/youtube\.com\/embed\/([^?&]+)/)?.[1];

  if (!videoId) return '';
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}
