import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      globals: {
        process: true, // Polyfills process for Dynamic
      },
    }),
    visualizer({
      filename: './stats.html', // Output file in project root
      open: true, // Automatically open the report in the browser after build
      gzipSize: true, // Show gzip size
      brotliSize: true, // Show brotli size
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'dynamic-labs': [
            '@dynamic-labs/sdk-react-core',
            '@dynamic-labs/solana',
          ],
          'solana-vendor': [
            '@solana/web3.js',
            '@solana/spl-token',
            '@coral-xyz/anchor',
          ],
          'ui-vendor': [
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
          ],
          'utils-vendor': ['axios', 'viem', 'date-fns', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB to reduce warnings
  },
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    host: '0.0.0.0', // Listen on all available network interfaces
    // ngrok
    // allowedHosts: ['6c3b-2a01-4ff-f0-c8d4-00-1.ngrok-free.app']
    watch: {
      ignored: ['**/docs/**', '**/node_modules/**'],
    },
  },
});
