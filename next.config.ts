import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/api/blob-image",
      },
    ],
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
        // Gelato CDN (product preview images — exact domain varies by store)
        protocol: "https",
        hostname: "*.gelato.cloud",
      },
      {
        protocol: "https",
        hostname: "*.gelato.com",
      },
    ],
  },
};

export default nextConfig;
