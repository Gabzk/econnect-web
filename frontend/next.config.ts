import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ===== Fontes de RSS =====
      // National Geographic Brasil
      {
        protocol: "https",
        hostname: "static.nationalgeographicbrasil.com",
      },
      {
        protocol: "https",
        hostname: "*.nationalgeographicbrasil.com",
      },
      // Mongabay Brasil
      {
        protocol: "https",
        hostname: "imgs.mongabay.com",
      },
      {
        protocol: "https",
        hostname: "*.mongabay.com",
      },
      // Greenpeace Brasil
      {
        protocol: "https",
        hostname: "*.greenpeace.org",
      },
      // G1 / Globo
      {
        protocol: "https",
        hostname: "s2.glbimg.com",
      },
      {
        protocol: "https",
        hostname: "*.glbimg.com",
      },
      {
        protocol: "https",
        hostname: "*.globo.com",
      },
      // Fallback para outros domínios HTTPS
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
