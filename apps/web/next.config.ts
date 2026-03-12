import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@asko/shared', '@asko/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
