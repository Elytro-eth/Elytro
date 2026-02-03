/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'placehold.co' },
      { hostname: 'icons.llamao.fi' },
      { hostname: 'logosarchive.com' },
      { hostname: 'gist.githubusercontent.com' },
      { hostname: 'static1.tokenterminal.com' },
      { hostname: 'raw.githubusercontent.com' },
    ],
    dangerouslyAllowSVG: true,
  },
  // Enable transpilation of external workspace packages (@elytro/ui)
  experimental: {
    externalDir: true,
  },
  transpilePackages: ['@elytro/ui'],
};

export default nextConfig;
