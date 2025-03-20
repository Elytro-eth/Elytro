import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './public/manifest.json';
import { resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import renameAndPackOutputPlugin from './output-pack-vite-plugin';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: isProd ? ['transform-remove-console'] : [],
      },
    }),
    crx({ manifest }),
    // a workaround for @metamask/post-message-stream - readable-stream
    nodePolyfills({
      include: ['process', 'util'],
    }),
    renameAndPackOutputPlugin(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // 'util': 'node_modules'
    },
  },
  build: {
    manifest: true,
    outDir: isProd ? 'build' : 'dist',
    rollupOptions: {
      input: {
        tab: resolve(__dirname, 'src/tab.html'),
        sidePanel: resolve(__dirname, 'src/side-panel.html'),
      },
      treeshake: true,
      output: {
        entryFileNames: isProd ? 'assets/[hash].js' : 'assets/[name].js',
        chunkFileNames: isProd ? 'assets/[hash].js' : 'assets/[name].js',
        assetFileNames: isProd ? 'assets/[hash].[ext]' : 'assets/[name].[ext]',
        // TODO: manualChunks?
      },
    },
    minify: 'esbuild',
    sourcemap: !isProd,
    cssCodeSplit: true,
    cssMinify: isProd,
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: isProd,
    emptyOutDir: true,
  },
  esbuild: {
    pure: isProd
      ? [
          'console.log',
          'console.info',
          'console.debug',
          'console.warn',
          'console.error',
          'console.table',
          'console.time',
          'console.timeEnd',
          'console.group',
          'console.groupEnd',
          'console.trace',
          'console.assert',
          'console.clear',
          'console.count',
          'console.countReset',
          'console.dir',
          'console.dirxml',
        ]
      : [],
    drop: isProd ? ['debugger'] : [],
    legalComments: isProd ? 'none' : 'inline',
    target: ['chrome89'],
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: [],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
