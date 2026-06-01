import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
