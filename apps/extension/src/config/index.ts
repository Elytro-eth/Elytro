import secrets from './secrets';
import testDefault from './default.test';
import devDefault from './default.development';
import prodDefault from './default.production';

type Environment = 'development' | 'production' | 'test';
const env = (process.env.APP_ENV || 'development') as Environment;

const defaultConfig = {
  development: devDefault,
  production: prodDefault,
  test: testDefault,
}[env as Environment];

const config = {
  ...defaultConfig,
  firebase: secrets.firebase,
  rpc: secrets.rpc,
};

export default config;
