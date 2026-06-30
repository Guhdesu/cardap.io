import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Força Webpack — evita crash do Turbopack em ambientes com baixo ulimit
  bundler: "webpack" as never,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
