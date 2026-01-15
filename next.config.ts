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
  // Configurações para evitar problemas no Windows com OneDrive
  experimental: {
    // Desabilitar otimizações que podem causar problemas com symlinks no Windows
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
