import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['placehold.co', 'icons.llamao.fi', 'logosarchive.com', 'gist.githubusercontent.com'],
    dangerouslyAllowSVG: true,
  },
  // Enable transpilation of external directories (extension UI components)
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    // Add alias for extension UI components
    config.resolve.alias['@elytro/extension-ui'] = path.resolve(__dirname, '../extension/src/components/ui');
    return config;
  },
};

export default nextConfig;
