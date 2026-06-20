import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "gelato-api-live.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "gelato-api-test.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        // Vercel Blob public URLs
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        // Gelato CDN previews
        protocol: "https",
        hostname: "*.gelatoapis.com",
      },
    ],
  },
};

export default nextConfig;
