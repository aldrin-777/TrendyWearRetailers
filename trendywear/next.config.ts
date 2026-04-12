import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /** Safety net for actions that still send binary (default ~1MB is too small). */
      bodySizeLimit: "8mb",
    },
  },
  images: {
    domains: [
      "zbsbowihpgcjrsvhldci.supabase.co",
      "images.unsplash.com",
    ],
  },
};

export default nextConfig;