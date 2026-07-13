import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Honor the PORT env when the preview harness assigns one (autoPort).
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: false,
  },
})
