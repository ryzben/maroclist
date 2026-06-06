const STORAGE_PATH = "/storage/v1/object/public/";
const TRANSFORM_PATH = "/storage/v1/render/image/public/";

interface TransformOptions {
  width?: number;
  quality?: number;
  format?: "webp" | "avif" | "origin";
  resize?: "cover" | "contain" | "fill";
}

/**
 * Converts a Supabase Storage URL to a Supabase Image Transform URL.
 * Non-Supabase URLs are returned unchanged.
 */
export function optimizeImage(url: string | null | undefined, options: TransformOptions = {}): string {
  if (!url) return "";
  if (!url.includes(STORAGE_PATH)) return url;

  const { width = 1200, quality = 80, format = "webp", resize = "cover" } = options;

  const base = url.split("?")[0].replace(STORAGE_PATH, TRANSFORM_PATH);
  const params = new URLSearchParams({
    width: String(width),
    quality: String(quality),
    format,
    resize,
  });

  return `${base}?${params}`;
}

// Preset helpers
export const imgCard  = (url: string) => optimizeImage(url, { width: 800,  quality: 80 });
export const imgThumb = (url: string) => optimizeImage(url, { width: 300,  quality: 75 });
export const imgFull  = (url: string) => optimizeImage(url, { width: 1400, quality: 85 });
