/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'export',
  images: {
    domains: [
      'placehold.co',
      'icons.llamao.fi',
      'logosarchive.com',
      'gist.githubusercontent.com',
      'raw.githubusercontent.com',
      'github.com',
      'images.ctfassets.net',
      'elytro.com',
    ],
    dangerouslyAllowSVG: true,
    unoptimized: true,
  },
  trailingSlash: true,
  assetPrefix: 'https://recovery.elytro.com/ipfs/QmRaG9di46upr7XxxZE58mL7jFsjPPK278D5dcjbGd6nun',
  basePath: '',
  reactStrictMode: true,
};

export default nextConfig;
