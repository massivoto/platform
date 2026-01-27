import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // @ts-ignore
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    css: true,
    passWithNoTests: true,
    env: {
      VITE_BACKEND_URL: 'http://test.local',
    },
  },
})
