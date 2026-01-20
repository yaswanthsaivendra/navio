import type { NextConfig } from "next";

// Helper to extract hostname from URL
function getHostnameFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return null;
  }
}

// Build remote patterns for images
const remotePatterns: Array<{
  protocol: "https";
  hostname: string;
  pathname: string;
}> = [
  {
    protocol: "https",
    hostname: "lh3.googleusercontent.com",
    pathname: "/**",
  },
];

// Add R2 CDN domain if configured
const cdnDomain = process.env.R2_CDN_DOMAIN || process.env.R2_PUBLIC_URL;
if (cdnDomain) {
  const hostname = getHostnameFromUrl(cdnDomain);
  if (hostname && hostname !== "your_custom_domain.com") {
    remotePatterns.push({
      protocol: "https",
      hostname,
      pathname: "/**",
    });
  }
}

// Add R2 account domain pattern (if R2_ACCOUNT_ID is set)
if (process.env.R2_ACCOUNT_ID) {
  remotePatterns.push({
    protocol: "https",
    hostname: `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    pathname: "/**",
  });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    // Disable image optimization for external domains that might not be configured
    // This allows images to load even if domain isn't in remotePatterns
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        // Apply headers to embed routes only
        source: "/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;", // Allow embedding from any domain
          },
        ],
      },
    ];
  },
};

export default nextConfig;
