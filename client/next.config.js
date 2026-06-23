/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    // New service worker activates immediately instead of waiting for
    // every open tab to close — so a fresh deploy takes over on next load.
    skipWaiting: true,
    // The new SW takes control of already-open pages right away.
    clientsClaim: true,
    // Delete previous-build precache entries so stale JS chunks (which
    // 404 after a redeploy and cause "This page couldn't load" /
    // ChunkLoadError) are purged instead of served from cache.
    cleanupOutdatedCaches: true,
  },
});

const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
