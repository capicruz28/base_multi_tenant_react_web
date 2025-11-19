import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',  // ✅ Permite acceso desde subdominios
    port: 5173,
    strictPort: true,  // ✅ Falla si el puerto está ocupado
    
    // ✅ CORRECCIÓN CRÍTICA: Permitir todos los subdominios
    allowedHosts: [
      'localhost',
      '.app.local',  // ✅ Permite platform.app.local, acme.app.local, etc.
      '.midominio.com',  // ✅ Mantener para producción
    ],
    
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        ws: true,  // ✅ Habilita WebSockets
        configure: (proxy) => {
          // ✅ CORRECCIÓN: Solo usar 'proxy', eliminar parámetros no usados
          proxy.on('proxyReq', (proxyReq, req) => {
            // ✅ Log para debugging (opcional, puedes comentar si no lo necesitas)
            console.log(`[PROXY] ${req.method} ${req.url} → ${proxyReq.path}`);
          });
        },
      }
    }
  }
})