import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
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
