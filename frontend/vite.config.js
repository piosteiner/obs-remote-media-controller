import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // For GitHub Pages at root domain
  server: {
    port: 5173,
    proxy: {
      // Proxy to backend during local development
      '/api': {
        target: 'http://83.228.207.199:3000', // Your Infomaniak VPS
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://83.228.207.199:3000',
        ws: true,
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://83.228.207.199:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'socket-vendor': ['socket.io-client'],
        }
      }
    }
  }
})
