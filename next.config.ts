import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Compatibility fallback for environments expecting the experimental key.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
