import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
)

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['exceljs', '@ant-design/plots', 'tslib'],
  },
  // 与服务器 /opt/xn/www/xn-admin-react-ts 同名，便于直接上传
  build: {
    outDir: '../www/xn-admin-react-ts',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    // Dedicated port so it won't collide with Vue frontends / xn-home
    port: 1800,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      '/swagger-ui': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      '/v3/api-docs': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8088',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
