#!/bin/bash

set -e

echo "=== Elytro Local Quickstart ==="


# 1. Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
  exit 1
fi

# 2. Check pnpm
if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm is not installed. Installing pnpm globally..."
  npm install -g pnpm
fi

echo "Node.js version: $(node -v)"
echo "pnpm version: $(pnpm -v)"

# 3. Install dependencies
echo "Installing dependencies..."
pnpm install

# 4. Start extension dev server
echo "Starting Elytro extension dev server..."
pnpm --filter extension dev &

# 5. Start recovery app dev server
echo "Starting Elytro recovery web app..."
pnpm --filter recovery dev &

# Cleanup background processes on exit
trap "echo ''; echo 'Stopping dev servers...'; kill 0" SIGINT SIGTERM

echo ""
echo "All set! Next steps:"
echo "1. Chrome extension:"
echo "   - Open Chrome and visit chrome://extensions/"
echo "   - Enable 'Developer mode'"
echo "   - Click 'Load unpacked' and select:"
echo "     $(pwd)/apps/extension/dist"
echo "2. Recovery web app:"
echo "   - Open http://localhost:3000 in your browser"
echo ""
echo "To stop the servers, press Ctrl+C in this terminal."
echo ""

echo "=== Elytro Local Quickstart ==="

# Keep background processes alive
wait
