import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'node',
    isolate: true,
    threads: false,
    setupFiles: ['./vitest.setup.js'],
    reporters: ['verbose'],
    testTimeout: 30000
  }
})
