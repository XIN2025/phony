/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  transpilePackages: ['@repo/ui', '@repo/db'],
  reactStrictMode: false,
  images: { remotePatterns: [{ protocol: 'https', hostname: '*' }] },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        util: false,
      };
    }

    // Use modern hash function for better compatibility
    config.output.hashFunction = 'xxhash64';
    config.output.hashDigest = 'hex';

    return config;
  },
  experimental: {
    // Enable modern features for better performance
    optimizePackageImports: ['@repo/ui'],
  },
};

export default nextConfig;
