/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const pwaConfig = {
  dest: 'public',
  swSrc: '../../worker/index.js',
  disable: false,
  skipWaiting: true,
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  buildExcludes: [
    ({ asset }) => asset.name.includes('app-build-manifest.json'),
    ({ asset }) => asset.name.includes('build-manifest.json'),
    ({ asset }) => asset.name.includes('react-loadable-manifest.json'),
    ({ asset }) => asset.name.includes('middleware-build-manifest.js'),
    ({ asset }) => asset.name.includes('middleware-react-loadable-manifest.js'),
    ({ asset }) => asset.name.includes('client-reference-manifest'),
    ({ asset }) => asset.name.includes('next-font-manifest.js'),
    ({ asset }) => asset.name.includes('next-font-manifest.json'),
    ({ asset }) => /(_next|server).*-manifest\.(js|json)$/.test(asset.name),
  ],
  manifestTransforms: [
    async (entries) => {
      return {
        manifest: entries.filter(
          (entry) =>
            !entry.url.includes('build-manifest.json') &&
            !entry.url.includes('app-build-manifest.json') &&
            !entry.url.includes('react-loadable-manifest.json') &&
            !entry.url.includes('middleware-build-manifest.js') &&
            !entry.url.includes('middleware-react-loadable-manifest.js') &&
            !entry.url.includes('client-reference-manifest') &&
            !entry.url.includes('next-font-manifest.js') &&
            !entry.url.includes('next-font-manifest.json') &&
            !/(_next|server).*-manifest\.(js|json)$/.test(entry.url),
        ),
        warnings: [],
      };
    },
  ],
};

const nextConfig = {
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
    config.output.hashFunction = 'xxhash64';
    config.output.hashDigest = 'hex';
    return config;
  },
};

export default withPWA(pwaConfig)(nextConfig);
