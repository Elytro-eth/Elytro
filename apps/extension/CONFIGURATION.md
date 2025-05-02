# Environment Variables Configuration Guide

## Overview

This project uses environment variables for configuration management. Create the following files based on your environment:

- `.env.development` - For local development
- `.env.test` - For testing environment
- `.env.production` - For production deployment

## Required Environment Variables

### Basic Configuration

```
APP_ENV=development|test|production
```

### Firebase Configuration

Create your own Firebase project and use its configuration values:

```
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
FIREBASE_APP_ID=your-firebase-app-id
FIREBASE_MEASUREMENT_ID=your-firebase-measurement-id
FIREBASE_VAPID_KEY=your-firebase-vapid-key
```

### Chain Configuration

```
ALCHEMY_API_KEY=your-alchemy-api-key
PIMLICO_API_KEY=your-pimlico-api-key
```

### Extension Configuration (Optional)

Used to maintain a consistent extension ID across builds:

```
DEV_EXTENSION_KEY=your-extension-key
```

## Development Workflow

1. Clone the repository
2. Create your `.env` file with the required variables
3. Start development: `pnpm dev`
4. Build for different environments:
   - Development: `pnpm build:dev`
   - Test: `pnpm build:test`
   - Production: `pnpm build:release`

## Security Notes

- Never commit `.env` files to version control
- Use secure methods to inject environment variables in CI/CD
- Rotate API keys periodically
- Maintain separate configurations for different environments
