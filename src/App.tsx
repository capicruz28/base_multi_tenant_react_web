// src/App.tsx
import './index.css'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
//import { BrandingInitializer } from './components/BrandingInitializer';
//import { BrandingDebug } from './components/BrandingDebug';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Layouts y Protección
import ProtectedRoute from './components/ProtectedRoute';
import NewLayout from './components/layout/NewLayout';
import SmartRedirect from './components/SmartRedirect'; // ✅ NUEVO

// Páginas Públicas
import Login from './pages/auth/Login';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Páginas Principales/Normales
import Home from './pages/Home';

// Páginas de Administración
import UserManagementPage from './pages/admin/UserManagementPage';
import RoleManagementPage from './pages/admin/RoleManagementPage';
import AreaManagementPage from './pages/admin/AreaManagementPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import ActiveSessionsPage from './pages/admin/ActiveSessionsPage';
import AutorizacionPage from './pages/AutorizacionPage';
import FinalizarTareoPage from './pages/FinalizarTareoPage';
import ReporteAutorizacionPage from './pages/ReporteAutorizacionPage';

// Páginas de Super Admin
import ClientManagementPage from './pages/super-admin/ClientManagementPage';
import ClientDetailPage from './pages/super-admin/ClientDetailPage';
import ModuleManagementPage from './pages/super-admin/ModuleManagementPage';
// ✅ ELIMINADO: import ConnectionManagementPage (ahora integrado en módulos)
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {/*}
          <BrandingInitializer />
          <BrandingDebug />*/}
          <BrowserRouter>
            <Routes>
              {/* --- Rutas Públicas --- */}
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* --- Rutas Protegidas (Usuario Normal) --- */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<NewLayout />}>
                  {/* ✅ CORRECCIÓN: Redirección inteligente según tipo de usuario */}
                  <Route index element={<SmartRedirect />} />

                  {/* Rutas accesibles para cualquier usuario autenticado */}
                  <Route path="home" element={<Home />} />
                  <Route path="finalizartareo" element={<FinalizarTareoPage />} />
                  <Route path="autorizacion" element={<AutorizacionPage />} />
                  <Route path="reportedestajo" element={<ReporteAutorizacionPage />} />

                  {/* Catch-all: redirige según tipo de usuario */}
                  <Route path="*" element={<SmartRedirect />} />
                </Route>
              </Route>

              {/* --- Rutas de Administración (Tenant Admin) --- */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredLevel={4}>
                    <DndProvider backend={HTML5Backend}>
                      <NewLayout />
                    </DndProvider>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="usuarios" replace />} />
                <Route path="usuarios" element={<UserManagementPage />} />
                <Route path="roles" element={<RoleManagementPage />} />
                <Route path="areas" element={<AreaManagementPage />} />
                <Route path="menus" element={<MenuManagementPage />} />
                <Route path="sesiones" element={<ActiveSessionsPage />} />
                <Route path="*" element={<Navigate to="/admin/usuarios" replace />} />
              </Route>

              {/* --- Rutas de Super Admin --- */}
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute requireSuperAdmin={true}>
                    <DndProvider backend={HTML5Backend}>
                      <NewLayout />
                    </DndProvider>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<SuperAdminDashboard />} />
                <Route path="clientes" element={<ClientManagementPage />} />
                <Route path="clientes/:id" element={<ClientDetailPage />} />
                <Route path="modulos" element={<ModuleManagementPage />} />
                {/* ✅ ELIMINADO: Ruta /conexiones (ahora integrado en módulos por cliente) */}
                <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
              </Route>
            </Routes>
            <Toaster position="top-right" />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;