import type { NextConfig } from 'next';
import path from 'node:path';
import dotenv from 'dotenv';
import { getEnvFilePath } from '@asko/shared';

dotenv.config({ path: getEnvFilePath(), override: true });

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(import.meta.dirname, '../../'),
  transpilePackages: ['@asko/shared', '@asko/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        // 'reflect-metadata': require.resolve('reflect-metadata'),
      };
    }

    return config;
  },
};

export default nextConfig;
