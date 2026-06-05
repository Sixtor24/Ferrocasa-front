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

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <AuthLoading />;

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/almacen" element={<Almacen />} />
        <Route path="/almacen/proyectos" element={<Proyectos />} />
        <Route path="/almacen/inmuebles" element={<Navigate to="/terrenos" replace />} />
        <Route path="/almacen/:id" element={<Almacen />} />
        <Route path="/cementerio" element={<Cementerio />} />
        <Route path="/cementerio/parcela/:id" element={<Navigate to="/terrenos" replace />} />
        <Route path="/cementerio/:id" element={<Cementerio />} />
        <Route path="/terrenos" element={<Terrenos />} />
        <Route path="/terrenos/:id" element={<Terrenos />} />
        <Route path="/vehiculos" element={<Vehiculos />} />
        <Route path="/vehiculos/:id" element={<Vehiculos />} />
        <Route path="/ventas" element={<Navigate to="/dashboard" replace />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/auditoria" element={<Auditoria />} />
        <Route path="/configuracion" element={<Configuracion />} />
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
