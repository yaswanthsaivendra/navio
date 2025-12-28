/**
 * Custom image loader for R2/CDN images
 * Falls back to direct URL if Next.js Image optimization fails
 * Note: This function signature matches Next.js Image loader requirements
 */
export function r2ImageLoader({
  src,
  width: _width,
  quality: _quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // If it's an R2 or CDN URL, return as-is (unoptimized)
  // Next.js will handle optimization if domain is configured
  // Otherwise, return the original URL
  // Note: width and quality are part of Next.js Image loader signature but not used here
  // They are prefixed with _ to indicate intentional non-use
  void _width;
  void _quality;
  return src;
}
