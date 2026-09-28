import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  experimental: {
    // El panel guarda el documento completo del menú (logos/favicons en base64 incluidos).
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
