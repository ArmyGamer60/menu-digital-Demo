import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async redirects() {
    return [{ source: "/", destination: "/menu/molienda", permanent: false }];
  },
};

export default nextConfig;
