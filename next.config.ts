import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Add this if the build fails due to images
  },
};

export default nextConfig;