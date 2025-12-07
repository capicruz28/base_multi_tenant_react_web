import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/features': path.resolve(__dirname, './src/features'),
    },
  },
  build: {
    // ✅ Optimización de code splitting
    rollupOptions: {
      output: {
        // Agrupar chunks por feature/módulo
        manualChunks: (id) => {
          // node_modules en chunk separado
          if (id.includes('node_modules')) {
            // Separar librerías grandes
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-react-query';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Resto de node_modules
            return 'vendor';
          }
          
          // Features en chunks separados
          if (id.includes('/features/super-admin/')) {
            return 'feature-super-admin';
          }
          if (id.includes('/features/auth/')) {
            return 'feature-auth';
          }
          if (id.includes('/features/tenant/')) {
            return 'feature-tenant';
          }
          if (id.includes('/features/admin/')) {
            return 'feature-admin';
          }
          
          // Core en chunk separado
          if (id.includes('/core/')) {
            return 'core';
          }
        },
      },
    },
    // Optimizaciones adicionales
    chunkSizeWarningLimit: 1000, // Avisar si un chunk es > 1MB
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