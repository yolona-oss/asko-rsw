import type { NextConfig } from 'next';
import path from 'node:path';
import dotenv from 'dotenv';
import { getEnvFilePath } from '@asko/shared/server';

dotenv.config({ path: getEnvFilePath(), override: true });

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(import.meta.dirname, '../../'),
  transpilePackages: ['@asko/shared', '@asko/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '193.42.127.113' },
      { protocol: 'https', hostname: 'askoservis.ru' },
    ],
  },
};

export default nextConfig;
