import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Auditoria from './pages/Auditoria';
import Almacen from './pages/Almacen';
import Inmuebles from './pages/Inmuebles';
import Reportes from './pages/Reportes';
import Materiales from './pages/Materiales';
import Ventas from './pages/Ventas';
import Cementerio from './pages/Cementerio';
import Placeholder from './pages/Placeholder';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

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
        <Route path="/almacen" element={<Materiales />} />
        <Route path="/almacen/proyectos" element={<Almacen />} />
        <Route path="/almacen/inmuebles" element={<Inmuebles />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/cementerio" element={<Cementerio />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/auditoria" element={<Auditoria />} />
        <Route path="/configuracion" element={<Placeholder title="Configuración" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
