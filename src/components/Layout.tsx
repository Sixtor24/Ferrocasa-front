import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Landmark,
  FileText,
  Shield,
  Settings,
  Search,
  Bell,
  Calendar,
  ChevronDown,
  LogOut,
  X,
  Menu,
} from 'lucide-react';

const searchablePages = [
  { label: 'Dashboard', path: '/dashboard', keywords: 'inicio panel resumen estadísticas stats' },
  { label: 'Catálogo de Materiales', path: '/almacen', keywords: 'materiales stock inventario cemento cabilla bloque' },
  { label: 'Proyectos Habitacionales', path: '/almacen/proyectos', keywords: 'proyectos edificio urbanismo villa residencias' },
  { label: 'Registro de Inmuebles', path: '/almacen/inmuebles', keywords: 'inmuebles propiedad apartamento casa terreno parcela' },
  { label: 'Ventas', path: '/ventas', keywords: 'ventas comercial factura cliente' },
  { label: 'Cementerio', path: '/cementerio', keywords: 'cementerio parcela' },
  { label: 'Reportes', path: '/reportes', keywords: 'reportes reporte auditoría pdf excel export' },
  { label: 'Auditoría', path: '/auditoria', keywords: 'auditoría trazabilidad registro log seguridad' },
  { label: 'Configuración', path: '/configuracion', keywords: 'configuración ajustes sistema preferencias' },
];

const mockNotifications = [
  { id: 1, text: 'Stock bajo: Cabillas 1/2"', time: 'Hace 5 min', read: false },
  { id: 2, text: 'Nuevo inmueble registrado en Villa Rosa', time: 'Hace 15 min', read: false },
  { id: 3, text: 'Reporte mensual generado', time: 'Hace 1 hora', read: true },
];

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/almacen', label: 'Almacén', icon: Package },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { to: '/cementerio', label: 'Cementerio', icon: Landmark },
  { to: '/reportes', label: 'Reportes', icon: FileText },
  { to: '/auditoria', label: 'Auditoría', icon: Shield },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const searchResults = searchQuery.length >= 2
    ? searchablePages.filter((p) => {
        const q = searchQuery.toLowerCase();
        return p.label.toLowerCase().includes(q) || p.keywords.includes(q);
      })
    : [];

  useEffect(() => {
    setSearchQuery('');
    setShowSearch(false);
    setShowNotif(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const today = new Date().toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-52 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0 lg:shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="CVG Ferrocasa" className="w-10 h-10 object-contain shrink-0" />
            <div>
              <p className="font-bold text-navy-900 text-sm">FERROCASA</p>
              <p className="text-xs text-gray-500">Bienes Nacionales</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-navy-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Config */}
        <div className="px-3 pb-2">
          <NavLink
            to="/configuracion"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-navy-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <Settings size={18} />
            Configuración
          </NavLink>
        </div>

        {/* User info */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-navy-200 rounded-full flex items-center justify-center">
              <span className="text-navy-800 text-xs font-bold">{user?.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy-900 truncate">{user?.nombre}</p>
              <p className="text-xs text-gray-500 truncate">{user?.rol}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-navy-900 shrink-0">
              <Menu size={22} />
            </button>
            <div className="relative flex-1 max-w-md" ref={searchRef}>
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar bienes, parcelas o registros..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
              {showSearch && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 mt-1 w-full sm:w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400">Sin resultados para "{searchQuery}"</div>
                  ) : (
                    searchResults.map((r) => (
                      <button
                        key={r.path}
                        onClick={() => { navigate(r.path); setSearchQuery(''); setShowSearch(false); }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                      >
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <div>
                          <p className="font-medium text-navy-900">{r.label}</p>
                          <p className="text-xs text-gray-400">{r.path}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span className="capitalize">{today}</span>
            </div>
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative text-gray-500 hover:text-navy-900"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {mockNotifications.filter((n) => !n.read).length}
                </span>
              </button>
              {showNotif && (
                <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-navy-900">Notificaciones</span>
                    <span className="text-xs text-navy-600 cursor-pointer hover:underline">Marcar leídas</span>
                  </div>
                  {mockNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer ${!n.read ? 'bg-navy-50/50' : ''}`}
                    >
                      <p className="text-sm text-navy-900">{n.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-navy-900">
              {user?.nombre}
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-gray-400">
          <span className="truncate">© 2024 C.V.G. FERROCASA - v2.4.0</span>
          <div className="hidden sm:flex gap-4">
            <span className="hover:text-navy-600 cursor-pointer">Privacidad</span>
            <span className="hover:text-navy-600 cursor-pointer">Soporte Técnico</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
