/** @type {import('next').NextConfig} */
const urlBase = process.env.NEXT_PUBLIC_API_URL_CHART;
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/market",
        permanent: false,
      },
      // TODO: Enable swap
      {
        source: "/swap",
        destination: process.env.NODE_ENV === "production" ? "/404" : "/swap",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
  async rewrites() {
    return process.env.NEXT_PUBLIC_ENVIRONMENT === "local"
      ? [
        {
          source: "/api/:path*",
          destination: `${urlBase}/:path*`,
        },
      ]
      : [];
  },
};

module.exports = nextConfig;
