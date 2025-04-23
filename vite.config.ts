import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tailwindcss from "@tailwindcss/vite";
import path from "path";


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      globals: {
        process: true, // Polyfills process for Dynamic
      }
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // server: {
  //   allowedHosts: ['6c3b-2a01-4ff-f0-c8d4-00-1.ngrok-free.app']
  // }
})
