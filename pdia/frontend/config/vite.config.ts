import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(currentDir, '../src'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    allowedHosts: true,
    host: '0.0.0.0',   // escucha en todas las interfaces, no solo localhost
    port: 5174
  }
})