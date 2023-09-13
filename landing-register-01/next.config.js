/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    minimumCacheTTL: 3600,
  },
  // trailingSlash: true, // fawk api requires trailing slash in url
  skipTrailingSlashRedirect: true, // dont redirect to trailing slash, accept both with and without trailing slash
  env: {
    API_URL: process.env.API_URL,
  },
  // API Proxy to Backend. Read: https://nextjs.org/docs/api-reference/next.config.js/rewrites
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
