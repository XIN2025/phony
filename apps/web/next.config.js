const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/db'],
  reactStrictMode: false,
  images: { remotePatterns: [{ protocol: 'https', hostname: '*' }] },
  webpack: (config, { isServer }) => {
    // Fix for Node.js 22 compatibility with webpack hash functions
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        util: false,
      };
    }

    // Use a more compatible hash function for Node.js 22
    config.output.hashFunction = 'md4';
    config.output.hashDigest = 'hex';

    return config;
  },
};
export default nextConfig;
