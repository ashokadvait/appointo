/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@calendly/types', '@calendly/core', '@calendly/database'],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async rewrites() {
    if (process.env.VERCEL) {
      return [];
    }
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4000/api/:path*',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
