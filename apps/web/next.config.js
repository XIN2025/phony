const nextConfig = {
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

    config.output.hashFunction = 'md4';
    config.output.hashDigest = 'hex';

    return config;
  },
};
export default nextConfig;
