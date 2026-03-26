import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@spread/shared", "@spread/prisma"],
  async rewrites() {
    // In development, proxy /api/v1 requests to the Hono API server
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/v1/:path*",
          destination: "http://localhost:3001/api/v1/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
