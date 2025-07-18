import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // This is required to allow the Next.js dev server to accept requests from
    // the Firebase Studio UI.
    allowedDevOrigins: [
      '*.cloudworkstations.dev',
      '*.firebase.studio',
    ],
  },
};

export default nextConfig;
