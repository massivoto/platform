import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig } from 'vite'

/**
 * Vite configuration for the Grid applet frontend.
 * Builds the React app to dist/front/ for serving by the Express server.
 */
export default defineConfig({
  plugins: [react()],
  root: 'front',
  base: '/',
  build: {
    outDir: '../dist/front',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './front/src'),
    },
  },
})
