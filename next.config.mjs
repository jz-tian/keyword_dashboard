/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude CJS packages from webpack bundling so they use native require()
  // Next.js 14 uses experimental.serverComponentsExternalPackages
  experimental: {
    serverComponentsExternalPackages: ["ytsr"],
  },
  env: {
    PYTHON_API_URL: process.env.PYTHON_API_URL ?? "http://localhost:8000",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "inv.tux.pizza",
      },
      {
        protocol: "https",
        hostname: "invidious.nerdvpn.de",
      },
      {
        protocol: "https",
        hostname: "invidious.privacydev.net",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
