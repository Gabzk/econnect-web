import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Desabilitar otimização para permitir qualquer URL de imagem
    unoptimized: true,
  },
};

export default nextConfig;
