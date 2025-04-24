import devConfig from './index.dev';
import prodConfig from './index.prod';

const env = process.env.NODE_ENV || 'development';
let config = devConfig;

if (env === 'production' || env === 'test') {
  config = prodConfig;
}

export default config;
