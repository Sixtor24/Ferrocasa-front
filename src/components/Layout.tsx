import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MODULOS_MENU } from '../data/modulosMenu';
import logo from '../assets/logo.png';
import {
  LayoutDashboard,
  Package,
  Landmark,
  FileText,
  Shield,
  Settings,
  Calendar,
  ChevronDown,
  LogOut,
  X,
  Menu,
  Truck,
  Map,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

const SIDEBAR_COLLAPSED_KEY = 'ferrocasa-sidebar-collapsed';

const mockNotifications = [
  { id: 1, text: 'Stock bajo: Cabillas 1/2"', time: 'Hace 5 min', read: false },
  { id: 2, text: 'Nuevo inmueble registrado en Villa Rosa', time: 'Hace 15 min', read: false },
  { id: 3, text: 'Reporte mensual generado', time: 'Hace 1 hora', read: true },
];

const navItems = [
  { to: '/dashboard', label: MODULOS_MENU[0], icon: LayoutDashboard },
  { to: '/almacen', label: MODULOS_MENU[1], icon: Package },
  { to: '/cementerio', label: MODULOS_MENU[2], icon: Landmark },
  { to: '/terrenos', label: MODULOS_MENU[3], icon: Map },
  { to: '/vehiculos', label: MODULOS_MENU[4], icon: Truck },
  { to: '/reportes', label: MODULOS_MENU[5], icon: FileText },
  { to: '/auditoria', label: MODULOS_MENU[6], icon: Shield },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    setShowNotif(false);
    setShowUserMenu(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
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

  const timeNow = clock.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const sidebarWidth = sidebarCollapsed ? 'w-[4.25rem]' : 'w-56';

  return (
    <div className="flex h-screen bg-[#f4f6f9]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 ${sidebarWidth} bg-white border-r border-gray-200/90 flex flex-col
          transform transition-all duration-300 ease-in-out shadow-sm
          lg:static lg:translate-x-0 lg:shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className={`p-3 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between gap-2'}`}>
          <div className={`flex items-center gap-3 min-w-0 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <img src={logo} alt="CVG Ferrocasa" className="w-10 h-10 object-contain shrink-0" />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="font-bold text-navy-900 text-sm font-display tracking-tight">FERROCASA</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Bienes Nacionales</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={sidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-navy-900 text-white shadow-md shadow-navy-900/20'
                    : 'text-gray-600 hover:bg-navy-50 hover:text-navy-900'
                }`
              }
            >
              <item.icon size={20} className="shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-200/90 px-3 sm:px-5 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-navy-900 shrink-0 p-1.5 rounded-lg hover:bg-gray-100"
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-navy-700 hover:bg-navy-50 hover:border-navy-200 transition-colors shrink-0"
              title={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
              aria-label={sidebarCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
            >
              {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-3 sm:gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar size={16} className="shrink-0" />
                <span className="capitalize truncate">{today}</span>
              </div>
              <time
                dateTime={clock.toISOString()}
                className="font-mono text-sm sm:text-base font-semibold tabular-nums text-navy-900 tracking-wide"
              >
                {timeNow}
              </time>
            </div>
            <time
              dateTime={clock.toISOString()}
              className="md:hidden font-mono text-sm font-semibold tabular-nums text-navy-900 tracking-wide"
            >
              {timeNow}
            </time>
            <div className="relative" ref={notifRef}>
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
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-navy-700 hover:bg-navy-50 transition-colors"
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
                aria-label="Menú de usuario"
              >
                <ChevronDown
                  size={18}
                  className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                type="button"
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-navy-900 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors"
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
                aria-label="Menú de usuario"
              >
                <span className="max-w-[140px] truncate">{user?.nombre}</span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 shrink-0 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                />
              </button>
              {showUserMenu && (
                <div
                  role="menu"
                  className="absolute top-full right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden py-1"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/configuracion');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-900 hover:bg-navy-50 transition-colors text-left"
                  >
                    <Settings size={16} className="text-gray-500 shrink-0" />
                    Configuración
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowUserMenu(false);
                      void handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
                  >
                    <LogOut size={16} className="shrink-0" />
                    Salir del sistema
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        <footer className="bg-white border-t border-gray-200/90 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-gray-400 shrink-0">
          <span className="truncate">© 2024 C.V.G. FERROCASA — v1.0</span>
          <div className="hidden sm:flex gap-4">
            <span className="hover:text-navy-600 cursor-pointer">Privacidad</span>
            <span className="hover:text-navy-600 cursor-pointer">Soporte Técnico</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
