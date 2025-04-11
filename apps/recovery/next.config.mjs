/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'placehold.co',
      'icons.llamao.fi',
      'logosarchive.com',
      'gist.githubusercontent.com',
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
