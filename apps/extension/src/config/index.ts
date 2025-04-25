import devConfig from './index.dev';
import testConfig from './index.test';
import prodConfig from './index.prod';

const env = process.env.APP_ENV || 'development';

let config = devConfig;

if (env === 'production') {
  config = prodConfig;
} else if (env === 'test') {
  config = testConfig;
}

export default config;
