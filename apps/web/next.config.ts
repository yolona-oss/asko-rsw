import type { NextConfig } from 'next';
import path from 'node:path';
import dotenv from 'dotenv';
import { getEnvFilePath } from '@asko/shared/server';

dotenv.config({ path: getEnvFilePath(), override: true });

const isDev = process.env.NODE_ENV !== 'production';

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
  ...(isDev && {
    rewrites: async () => [
      // Auth Gateway (:4001)
      { source: '/api/auth/:path*', destination: 'http://localhost:4001/auth/:path*' },
      { source: '/api/invite/:path*', destination: 'http://localhost:4001/invite/:path*' },
      // Repair Gateway (:4002)
      { source: '/api/repair-requests/:path*', destination: 'http://localhost:4002/repair-requests/:path*' },
      { source: '/api/devices/:path*', destination: 'http://localhost:4002/devices/:path*' },
      { source: '/api/user-devices/:path*', destination: 'http://localhost:4002/user-devices/:path*' },
      { source: '/api/device-categories/:path*', destination: 'http://localhost:4002/device-categories/:path*' },
      { source: '/api/certificates/:path*', destination: 'http://localhost:4002/certificates/:path*' },
      { source: '/api/repairers/:path*', destination: 'http://localhost:4002/repairers/:path*' },
      { source: '/api/dealers/:path*', destination: 'http://localhost:4002/dealers/:path*' },
      { source: '/api/reviews/:path*', destination: 'http://localhost:4002/reviews/:path*' },
      { source: '/api/schedule/:path*', destination: 'http://localhost:4002/schedule/:path*' },
      { source: '/api/address/:path*', destination: 'http://localhost:4002/address/:path*' },
      { source: '/api/payment/:path*', destination: 'http://localhost:4002/payment/:path*' },
      // Media Gateway (:4003)
      { source: '/api/file-upload/:path*', destination: 'http://localhost:4003/file-upload/:path*' },
      { source: '/api/files/:path*', destination: 'http://localhost:4003/files/:path*' },
      { source: '/api/images/:path*', destination: 'http://localhost:4003/images/:path*' },
      { source: '/api/videos/:path*', destination: 'http://localhost:4003/videos/:path*' },
      // Realtime Gateway (:4004)
      { source: '/api/chat/:path*', destination: 'http://localhost:4004/chat/:path*' },
      { source: '/api/notifications/:path*', destination: 'http://localhost:4004/notifications/:path*' },
      { source: '/api/socket.io/:path*', destination: 'http://localhost:4004/socket.io/:path*' },
      // Content Gateway (:4005)
      { source: '/api/articles/:path*', destination: 'http://localhost:4005/articles/:path*' },
      { source: '/api/users/:path*', destination: 'http://localhost:4005/users/:path*' },
      // Health
      { source: '/api/health', destination: 'http://localhost:4001/health' },
    ],
  }),
};

export default nextConfig;
