import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Eye,
  Server,
  UserCheck,
  FileText,
  ArrowLeft,
  Scale,
  Clock,
  Mail,
} from 'lucide-react';
import logo from '../assets/logo.png';

const LAST_UPDATED = '12 de junio de 2026';

const sections = [
  {
    id: 'recopilacion',
    icon: Eye,
    title: 'Información que Recopilamos',
    content: [
      'Datos de identificación del usuario (nombre, cédula, cargo y rol institucional) necesarios para el control de acceso al sistema.',
      'Credenciales de autenticación almacenadas de forma cifrada para garantizar la seguridad del acceso.',
      'Registros de actividad dentro del sistema (auditoría), incluyendo fecha, hora, módulo consultado y acciones realizadas, con fines de trazabilidad y control interno.',
      'Información técnica de la sesión (dirección IP, navegador y dispositivo) para monitoreo de seguridad.',
    ],
  },
  {
    id: 'uso',
    icon: FileText,
    title: 'Uso de la Información',
    content: [
      'Autenticación y control de acceso basado en roles para cada módulo del sistema (Almacén, Cementerio, Terrenos, Vehículos, Reportes, Auditoría y Configuración).',
      'Generación de reportes internos y auditorías sobre la gestión de bienes nacionales.',
      'Cumplimiento de normativas gubernamentales sobre la administración de bienes públicos de la República Bolivariana de Venezuela.',
      'Mejora continua de la funcionalidad y seguridad del sistema.',
    ],
  },
  {
    id: 'proteccion',
    icon: Lock,
    title: 'Protección de Datos',
    content: [
      'Todas las comunicaciones están protegidas mediante cifrado HTTPS/TLS para garantizar la confidencialidad en tránsito.',
      'Las contraseñas se almacenan con algoritmos de hash seguros y nunca en texto plano.',
      'El acceso a los datos está restringido según el rol asignado a cada usuario, siguiendo el principio de menor privilegio.',
      'Se mantienen registros de auditoría inmutables de todas las operaciones realizadas en el sistema.',
    ],
  },
  {
    id: 'almacenamiento',
    icon: Server,
    title: 'Almacenamiento y Retención',
    content: [
      'Los datos se almacenan en servidores seguros administrados por C.V.G. FERROCASA con acceso restringido al personal autorizado.',
      'Los registros de auditoría se conservan conforme a los plazos establecidos por la normativa vigente en materia de bienes públicos.',
      'Las sesiones de usuario expiran automáticamente tras un período de inactividad para prevenir accesos no autorizados.',
    ],
  },
  {
    id: 'derechos',
    icon: UserCheck,
    title: 'Derechos del Usuario',
    content: [
      'Acceder a la información personal registrada en el sistema a través de su perfil de usuario.',
      'Solicitar la corrección de datos personales inexactos mediante el módulo de Configuración o contactando al administrador del sistema.',
      'Conocer los registros de actividad asociados a su cuenta de usuario.',
      'Recibir notificación oportuna ante cualquier incidente de seguridad que pueda afectar sus datos.',
    ],
  },
  {
    id: 'marco-legal',
    icon: Scale,
    title: 'Marco Legal Aplicable',
    content: [
      'Constitución de la República Bolivariana de Venezuela — Artículos 28 y 60 sobre protección de datos y privacidad.',
      'Ley Orgánica de la Administración Pública — Normativas sobre transparencia y custodia de información institucional.',
      'Ley Especial contra los Delitos Informáticos — Protección contra acceso indebido y manejo ilícito de datos.',
      'Normativas internas de C.V.G. FERROCASA sobre gestión y resguardo de bienes nacionales.',
    ],
  },
] as const;

export default function Privacidad() {
  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <header className="bg-white border-b border-gray-200/90 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 group"
            aria-label="Volver al inicio"
          >
            <img src={logo} alt="" className="w-9 h-9 object-contain" aria-hidden="true" />
            <div className="hidden sm:block">
              <p className="font-bold text-navy-900 text-sm font-display tracking-tight leading-none">
                FERROCASA
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                Bienes Nacionales
              </p>
            </div>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900 rounded-lg px-3 py-2 hover:bg-navy-50 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Volver al sistema</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-navy-900 rounded-xl flex items-center justify-center shadow-md shadow-navy-900/20">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 font-display tracking-tight">
                Política de Privacidad
              </h1>
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed max-w-2xl">
            C.V.G. FERROCASA se compromete con la protección de los datos
            personales de los usuarios del Sistema de Control de Inventario de
            Bienes Nacionales. Esta política describe cómo recopilamos, usamos
            y protegemos su información.
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
            <Clock size={14} />
            <span>Última actualización: {LAST_UPDATED}</span>
          </div>
        </div>

        <nav
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-8"
          aria-label="Índice de secciones"
        >
          <p className="text-xs font-semibold text-navy-700 uppercase tracking-wide mb-3">
            Contenido
          </p>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sections.map((section, idx) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg px-3 py-2 transition-colors group"
                >
                  <span className="w-6 h-6 rounded-md bg-navy-50 text-navy-700 text-xs font-semibold flex items-center justify-center shrink-0 group-hover:bg-navy-100 transition-colors">
                    {idx + 1}
                  </span>
                  <span>{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-6">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <section
                key={section.id}
                id={section.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden scroll-mt-20"
                aria-labelledby={`heading-${section.id}`}
              >
                <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-navy-700" />
                  </div>
                  <h2
                    id={`heading-${section.id}`}
                    className="text-base sm:text-lg font-semibold text-navy-900 font-display"
                  >
                    <span className="text-navy-400 mr-2">{idx + 1}.</span>
                    {section.title}
                  </h2>
                </div>
                <ul className="px-5 sm:px-6 py-4 space-y-3" role="list">
                  {section.content.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-sm text-gray-700 leading-relaxed"
                    >
                      <span
                        className="mt-2 w-1.5 h-1.5 rounded-full bg-navy-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <section className="mt-8 bg-navy-50 rounded-xl border border-navy-200/60 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-navy-100 flex items-center justify-center shrink-0 mt-0.5">
              <Mail size={18} className="text-navy-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy-900 font-display mb-1">
                Contacto
              </h2>
              <p className="text-sm text-navy-800 leading-relaxed">
                Para consultas relacionadas con esta política de privacidad o el
                manejo de sus datos personales, contacte al Departamento de
                Tecnología de Información de C.V.G. FERROCASA.
              </p>
              <p className="text-sm text-navy-600 mt-2">
                Correo:{' '}
                <a
                  href="mailto:soporte@ferrocasa.gob.ve"
                  className="font-medium text-navy-800 hover:underline"
                >
                  soporte@ferrocasa.gob.ve
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200/90 bg-white px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>&copy; 2026 C.V.G. FERROCASA</span>
          <span>Sistema de Control de Inventario de Bienes Nacionales</span>
        </div>
      </footer>
    </div>
  );
}
