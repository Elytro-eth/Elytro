type Environment = 'development' | 'production' | 'test';

const getEnvironment = (): Environment => {
  const env = process.env.NODE_ENV as Environment;
  return env || 'development';
};

const config = {
  development: {
    graphqlEndpoint: 'https://api-dev.soulwallet.io/elytroapi/graphql/',
  },
  test: {
    graphqlEndpoint: 'https://api-dev.soulwallet.io/elytroapi/graphql/',
  },
  production: {
    graphqlEndpoint: 'https://api.soulwallet.io/elytroapi/graphql/',
  },
};

const currentConfig = config[getEnvironment()];

export default currentConfig;
