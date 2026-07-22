import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            if (id.includes('BuilderContentCard')) return 'builder-content-card';
            if (id.includes('FormBuilderPage')) return 'form-builder';
            if (id.includes('MapLocationPicker')) return 'map-picker';
            return undefined;
          }
          if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
})
