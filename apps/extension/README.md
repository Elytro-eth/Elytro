> **IMPORTANT FOR NON-DEVELOPERS:**
> If you are not a developer and want to run Elytro locally, please read [GETTING_STARTED_FOR_NON_DEVS.md](../../GETTING_STARTED_FOR_NON_DEVS.md) first for a simple, step-by-step guide!

# Elytro Wallet Extension

---

## 🚀 Quick Start Script (Recommended for Everyone)

You can set up and run everything with a single command from the project root:

```bash
./quickstart.sh
```

- This script will:
  1. Check/install prerequisites
  2. Install dependencies
  3. Start both the extension and recovery app dev servers
  4. Show you how to load the extension in Chrome

If you see a permissions error, run:

```bash
chmod +x quickstart.sh
```

---

Elytro is a modern, secure Chrome browser extension ERC-4337 wallet built with React, TypeScript, and Vite. It provides seamless Web3 integration with support for multiple blockchain networks, account abstraction, and advanced wallet recovery features.

## Core Features

- **Secure Account Management**: Create, import, and manage multiple wallets
- **Multi-Chain Support**: Compatible with Ethereum and all EVM chains
- **Account Abstraction (ERC-4337)**: Smart contract wallet with programmable validation
- **Social Recovery**: Contact-based recovery without seed phrases
- **DApp Integration**: Seamless Web3 connectivity via injected provider
- **Modern UI**: Clean, responsive interface with dark/light themes
- **Fast Performance**: Vite-powered builds, instant page loads

## Tech Stack

| Layer            | Technology                               |
| ---------------- | ---------------------------------------- |
| Frontend         | React, TypeScript, Vite                  |
| UI Framework     | Tailwind CSS, Radix UI, shadcn/ui        |
| State Management | Zustand, React Context                   |
| Data Layer       | Apollo Client (GraphQL)                  |
| Ethereum SDK     | Viem (TypeScript native EVM interaction) |
| Extension API    | Chrome Extension Manifest V3             |
| Build Tooling    | Vite + CRX plugin                        |

## Security Model

- **Account Abstraction**: Smart contract-based accounts with on-chain auth logic
- **Social Recovery**: Recovery via trusted contacts, no private key exposure
- **Secure Execution (SES)**: Hardened JavaScript runtime using Secure EcmaScript for isolating untrusted code
- **CSP Enforcement**: Self-hosted scripts only; no remote code execution
- **Minimal Permissions**: Only essential Chrome APIs are requested
- **Secure Builds**: Production strips logs, disables source maps, and enforces immutability

## Prerequisites

- Node.js 22.15.0 or higher
- pnpm 9.0 or higher
- Chrome browser for testing

## Getting Started

### Installation

1. **Clone the repository and install dependencies:**

```bash
# Navigate to the extension directory
cd apps/extension

# Install dependencies
pnpm install
```

### Development

2. **Start development server:**

```bash
# Run in development mode
pnpm dev

# The extension will be built to the 'dist' directory
```

3. **Load extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder
   - The Elytro extension icon should appear in your browser toolbar

### Building

4. **Build for different environments:**

```bash
# Development build (with source maps)
pnpm build:dev

# Test environment build
pnpm build:test

# Production build (optimized)
pnpm build:release

# Version-specific builds
pnpm build:patch    # Increments patch version
pnpm build:minor    # Increments minor version
pnpm build:major    # Increments major version
```

### Installation from Build

5. **Install built extension:**
   - After running any build command, the output will be in the `build` directory (production) or `dist` directory (development)
   - Follow the same Chrome extension loading process as step 3, but select the build output directory
   - For production builds, you can also package the extension as a ZIP file for distribution

## Development Tools

### Adding UI Components

Add components from `shadcn/ui`:

```bash
# ALWAYS use --no-overwrite to preserve custom modifications
pnpm dlx shadcn@latest add [component-name] --no-overwrite
```

### Code Quality

```bash
# Run ESLint
pnpm lint

# Type checking is automatically handled by TypeScript compilation
```

## Project Structure

```
src/
├── background/           # Service worker and background scripts
│   ├── index.ts         # Main background script entry
│   ├── provider/        # Web3 provider implementations
│   └── services/        # Core wallet services
├── content-scripts/     # Content scripts for web page injection
├── pages/              # UI pages and routes
├── components/         # Reusable React components
│   ├── ui/             # Base UI components (shadcn/ui)
│   └── biz/            # Business logic components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and helpers
├── assets/             # Static assets (images, fonts, icons)
├── constants/          # Application constants
└── types/              # TypeScript type definitions
```

## Configuration

### Environment Variables

The extension supports multiple environments configured via `APP_ENV`:

- `development`: Development mode with debugging enabled
- `test`: Testing environment
- `production`: Production build with optimizations

### Build Configuration

Key build settings in `vite.config.ts`:

- **CSS Optimization**: Disabled minification for consistent styling across builds
- **Code Splitting**: Disabled for extension compatibility
- **Source Maps**: Enabled in development, disabled in production
- **Console Removal**: Production builds strip console statements

## Extension Configuration

### Permissions

The extension requests the following Chrome permissions:

- `activeTab`: Access to current tab
- `storage`: Local data storage
- `tabs`: Tab management
- `sidePanel`: Chrome side panel integration
- `gcm`: Push notifications
- `notifications`: System notifications

### Content Security Policy

Strict CSP implemented for security:

- Scripts: Self and WebAssembly only
- Objects: None allowed
- Fonts: Self-hosted only

## Troubleshooting

### Common Issues

1. **Extension not loading**: Ensure you've built the project first with `pnpm dev` or `pnpm build:dev`

2. **Hot reload not working**: Restart the development server and reload the extension in Chrome

3. **Firebase/GraphQL errors**: Check your network configuration and API endpoints in the config files

### Development Tips

- Use Chrome DevTools for debugging extension pages
- Check the Chrome extension console for background script errors
- Enable verbose logging in development mode for detailed debugging

## Key Technologies

- **React**: Modern React with hooks and concurrent features
- **TypeScript 5.5**: Full type safety and developer experience
- **Vite 5.4**: Fast build tool with HMR support
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **Radix UI**: Accessible, unstyled UI primitives
- **Apollo Client**: GraphQL client with caching
- **Zustand**: Lightweight state management
- **Viem**: TypeScript Ethereum library

## Contributing

1. Follow the existing code style and TypeScript conventions
2. Use the configured ESLint rules
3. Ensure all UI components follow the design system
4. Test extension functionality across different environments
5. Update documentation for new features

## License

[GNU](../../LICENSE)

## Links

- [ERC 4337](https://docs.erc4337.io/)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Vite Chrome Extension Plugin](https://github.com/crxjs/chrome-extension-tools)
- [shadcn/ui Components](https://ui.shadcn.com/)
