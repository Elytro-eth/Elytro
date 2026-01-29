/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['placehold.co', 'icons.llamao.fi', 'logosarchive.com', 'gist.githubusercontent.com'],
    dangerouslyAllowSVG: true,
  },
  // Enable transpilation of external workspace packages (@elytro/ui)
  experimental: {
    externalDir: true,
  },
  transpilePackages: ['@elytro/ui'],
};

export default nextConfig;
