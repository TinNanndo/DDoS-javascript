import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/protected': {
        target: 'https://localhost:3443',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/protected/, '/protected')
      },
      '/api/unprotected': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/unprotected/, '/unprotected')
      },
      '/api/heavy-protected': {
        target: 'https://localhost:3443',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/heavy-protected/, '/heavy')
      },
      '/api/heavy-unprotected': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/heavy-unprotected/, '/heavy')
      }
    }
  }
})