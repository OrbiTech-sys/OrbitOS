import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Everything the browser needs comes from this site: all Supabase calls run on the
 * server, so no page ever needs to talk to another origin. Inline scripts and styles
 * stay allowed because statically prerendered pages can't carry per-request nonces.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    serverActions: {
      // One workspace save carries up to 100 records of up to 32 KB each.
      bodySizeLimit: "4mb",
    },
  },
  cacheComponents: true,
  poweredByHeader: false,
  async redirects() {
    // There is no separate admin area any more: everyone works in /workspace, and admins
    // manage users under Settings. Old links and bookmarks land in the right place.
    return [
      { source: "/admin/users", destination: "/workspace/settings/users", permanent: false },
      { source: "/admin/password", destination: "/account/password", permanent: false },
      { source: "/admin/deactivated", destination: "/account/deactivated", permanent: false },
      { source: "/admin/:path*", destination: "/workspace", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
