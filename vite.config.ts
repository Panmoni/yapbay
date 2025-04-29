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
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    host: '0.0.0.0', // Listen on all available network interfaces
    // ngrok
    // allowedHosts: ['6c3b-2a01-4ff-f0-c8d4-00-1.ngrok-free.app']
  },
});
