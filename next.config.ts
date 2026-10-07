import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {},
  async redirects() {
    return [
      {
        source: "/medhit",
        destination: "/",
        permanent: true,
      },
      {
        source: "/medhit/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
