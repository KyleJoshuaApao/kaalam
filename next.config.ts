import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    preloadEntriesOnStart: false,
    webpackMemoryOptimizations: true,
  },
  serverExternalPackages: ['mammoth', 'openai', 'pdf-parse'],
};

export default nextConfig;
