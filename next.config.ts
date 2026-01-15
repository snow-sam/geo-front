import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurações para evitar problemas no Windows com OneDrive
  experimental: {
    // Desabilitar otimizações que podem causar problemas com symlinks no Windows
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
