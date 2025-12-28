"use client";

import Image from "next/image";
import { useState } from "react";
import type { ComponentProps } from "react";
import { normalizeR2UrlClient } from "@/lib/utils/r2-url";

type R2ImageProps = Omit<ComponentProps<typeof Image>, "src" | "onError"> & {
  src: string | null | undefined;
  fallback?: React.ReactNode;
};

/**
 * Image component that handles R2/CDN images with fallback
 * For R2/external URLs, uses regular img tag to avoid Next.js Image domain configuration issues
 */
export function R2Image({
  src,
  fallback,
  alt,
  className,
  fill,
  ...props
}: R2ImageProps) {
  // Normalize the URL (replace placeholder domains with actual R2 URLs)
  // Use client-side normalization (requires NEXT_PUBLIC_R2_ACCOUNT_ID env var)
  const normalizedSrc = normalizeR2UrlClient(src);

  // Use normalizedSrc as key to automatically reset component when src changes
  // This avoids needing useEffect to reset error state
  const [imgError, setImgError] = useState(false);

  if (!normalizedSrc || imgError) {
    return fallback ? <>{fallback}</> : null;
  }

  // Check if it's an R2/external URL or API proxy - use regular img tag directly
  const isR2Url =
    normalizedSrc.includes("r2.cloudflarestorage.com") ||
    normalizedSrc.includes("your_custom_domain.com") ||
    normalizedSrc.startsWith("/api/images/") || // API proxy URLs
    (!normalizedSrc.startsWith("/") && !normalizedSrc.startsWith("data:")); // External URLs

  // For R2/external URLs, use regular img tag to avoid Next.js Image issues
  if (isR2Url) {
    const objectFit = className?.includes("object-cover")
      ? "cover"
      : className?.includes("object-contain")
        ? "contain"
        : "fill";

    const imgStyle: React.CSSProperties = {
      objectFit,
      ...(props.style as React.CSSProperties),
    };

    // Handle fill prop - make image fill parent container
    if (fill) {
      imgStyle.position = "absolute";
      imgStyle.inset = "0";
      imgStyle.width = "100%";
      imgStyle.height = "100%";
    } else {
      imgStyle.width = "100%";
      imgStyle.height = "100%";
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={normalizedSrc}
        src={normalizedSrc}
        alt={alt || ""}
        className={className}
        onError={() => {
          setImgError(true);
        }}
        style={imgStyle}
        loading={props.priority ? "eager" : "lazy"}
      />
    );
  }

  // For local/internal URLs, use Next.js Image
  return (
    <Image
      key={normalizedSrc}
      src={normalizedSrc}
      alt={alt || ""}
      className={className}
      fill={fill}
      {...props}
      onError={() => {
        setImgError(true);
      }}
    />
  );
}
