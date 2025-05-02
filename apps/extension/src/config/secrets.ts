import { z } from 'zod';

const envSchema = z.object({
  // Firebase Configuration
  VITE_FIREBASE_VAPID_KEY: z.string(),
  VITE_FIREBASE_API_KEY: z.string(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string(),
  VITE_FIREBASE_PROJECT_ID: z.string(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string(),
  VITE_FIREBASE_APP_ID: z.string(),
  VITE_FIREBASE_MEASUREMENT_ID: z.string(),

  // RPC Configuration
  VITE_ALCHEMY_API_KEY: z.string(),
  VITE_PIMLICO_API_KEY: z.string(),
});

function handleEnvError(error: z.ZodError) {
  const missingVars = error.errors
    .filter((err) => err.code === 'invalid_type' && err.received === 'undefined')
    .map((err) => err.path.join('.'));

  if (missingVars.length > 0) {
    const errorMessage = [
      '\n❌ Missing required environment variables:',
      ...missingVars.map((varName) => `   - ${varName}`),
      '\n💡 Please add these variables to your .env file',
      '   For example:',
      '   VITE_FIREBASE_API_KEY=your-api-key',
      '\n📝 See CONFIGURATION.md for more details\n',
    ].join('\n');

    console.error(errorMessage);

    throw new Error('Environment variables validation failed');
  }

  const invalidVars = error.errors
    .filter((err) => err.code !== 'invalid_type')
    .map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));

  if (invalidVars.length > 0) {
    const errorMessage = [
      '\n❌ Invalid environment variables:',
      ...invalidVars.map(({ path, message }) => `   - ${path}: ${message}`),
    ].join('\n');

    console.error(errorMessage);

    throw new Error('Environment variables validation failed');
  }
}

const env = (() => {
  try {
    return envSchema.parse(import.meta.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleEnvError(error);
    } else {
      const errorMessage = 'Unexpected error during environment validation: ' + error;
      console.error(errorMessage);

      throw error;
    }
  }
})() as z.infer<typeof envSchema>;

export default {
  firebase: {
    config: {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
    },
    vapidKey: env.VITE_FIREBASE_VAPID_KEY,
  },
  rpc: {
    alchemyKey: env.VITE_ALCHEMY_API_KEY,
    pimlicoKey: env.VITE_PIMLICO_API_KEY,
  },
};
