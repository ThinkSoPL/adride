import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['mapbox-gl', 'react-map-gl'],
  outputFileTracingRoot: '/root/adride',
};

export default nextConfig;
