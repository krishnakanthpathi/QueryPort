import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts', 'react-activity-calendar'],
          'ui-libs': ['lucide-react', 'react-icons', 'class-variance-authority', 'clsx', 'tailwind-merge'],
        }
      }
    }
  }
})
