import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    proxy: {
      '/api/nhl-proxy': {
        target: 'https://statsapi.web.nhl.com/api/v1',
        changeOrigin: true,
        rewrite: (path) => {
          // Extract the endpoint parameter from the query string
          const url = new URL(path, 'http://localhost')
          const endpoint = url.searchParams.get('endpoint')
          return endpoint ? `/${endpoint}` : '/'
        }
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vue': ['vue'],
          'pinia': ['pinia'],
          'axios': ['axios']
        }
      }
    }
  }
})
