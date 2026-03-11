import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@asko/shared', '@asko/ui'],
};

export default nextConfig;
