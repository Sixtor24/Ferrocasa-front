import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Auditoria from './pages/Auditoria';
import Almacen from './pages/Almacen';
import Proyectos from './pages/Proyectos';
import Reportes from './pages/Reportes';
import Cementerio from './pages/Cementerio';
import Vehiculos from './pages/Vehiculos';
import Terrenos from './pages/Terrenos';
import Configuracion from './pages/Configuracion';
import ModuleRoute from './components/ModuleRoute';
import { useRolePermissions } from './hooks/useRolePermissions';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <AuthLoading />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AuthLoading() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 text-center">
        <div className="w-9 h-9 border-4 border-navy-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-navy-900">Validando sesión segura...</p>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { defaultPath } = useRolePermissions();
  return <Navigate to={defaultPath} replace />;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <AuthLoading />;

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <HomeRedirect /> : <Login />}
      />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<ModuleRoute module="dashboard"><Dashboard /></ModuleRoute>} />
        <Route path="/almacen" element={<ModuleRoute module="almacen"><Almacen /></ModuleRoute>} />
        <Route path="/almacen/proyectos" element={<ModuleRoute module="almacen"><Proyectos /></ModuleRoute>} />
        <Route path="/almacen/inmuebles" element={<Navigate to="/terrenos" replace />} />
        <Route path="/almacen/:id" element={<ModuleRoute module="almacen"><Almacen /></ModuleRoute>} />
        <Route path="/cementerio" element={<ModuleRoute module="cementerio"><Cementerio /></ModuleRoute>} />
        <Route path="/cementerio/parcela/:id" element={<Navigate to="/terrenos" replace />} />
        <Route path="/cementerio/:id" element={<ModuleRoute module="cementerio"><Cementerio /></ModuleRoute>} />
        <Route path="/terrenos" element={<ModuleRoute module="terrenos"><Terrenos /></ModuleRoute>} />
        <Route path="/terrenos/:id" element={<ModuleRoute module="terrenos"><Terrenos /></ModuleRoute>} />
        <Route path="/vehiculos" element={<ModuleRoute module="vehiculos"><Vehiculos /></ModuleRoute>} />
        <Route path="/vehiculos/:id" element={<ModuleRoute module="vehiculos"><Vehiculos /></ModuleRoute>} />
        <Route path="/ventas" element={<Navigate to="/dashboard" replace />} />
        <Route path="/reportes" element={<ModuleRoute module="reportes"><Reportes /></ModuleRoute>} />
        <Route path="/auditoria" element={<ModuleRoute module="auditoria"><Auditoria /></ModuleRoute>} />
        <Route path="/configuracion" element={<ModuleRoute module="configuracion"><Configuracion /></ModuleRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
