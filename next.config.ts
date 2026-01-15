import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "https://backend-geo-crud--samuelf21.replit.app/api/v1"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
