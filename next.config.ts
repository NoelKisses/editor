import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Sharp precisa ser externo no servidor
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
