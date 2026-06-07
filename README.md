# FERROCASA — Frontend

Aplicación web para la **auditoría y gestión de inventario** de Ferrocasa: bienes administrativos, cementerio, terrenos, vehículos, reportes y trazabilidad. SPA en React que consume un API REST propio.

---

## Stack tecnológico

| Capa | Tecnología | Versión (aprox.) |
|------|------------|------------------|
| Runtime UI | [React](https://react.dev/) | 19 |
| Lenguaje | [TypeScript](https://www.typescriptlang.org/) | 6 |
| Bundler / dev server | [Vite](https://vite.dev/) | 8 |
| Estilos | [Tailwind CSS](https://tailwindcss.com/) v4 + plugin `@tailwindcss/vite` | 4 |
| Enrutamiento | [React Router](https://reactrouter.com/) | 7 |
| Estado global | [Zustand](https://zustand.docs.pmnd.rs/) | 5 |
| Formularios | [React Hook Form](https://react-hook-form.com/) | 7 |
| Validación | [Zod](https://zod.dev/) + `@hookform/resolvers` | 4 / 5 |
| Gráficos | [Recharts](https://recharts.org/) | 3 |
| Iconos | [Lucide React](https://lucide.dev/) | 1 |
| Notificaciones | [Sonner](https://sonner.emilkowal.ski/) | 2 |
| Excel | [SheetJS (`xlsx`)](https://sheetjs.com/) + [`xlsx-js-style`](https://www.npmjs.com/package/xlsx-js-style) | 0.18 / 1.2 |
| Linting | [ESLint](https://eslint.org/) 10 (flat config) + `eslint-plugin-react-hooks` | — |
| Gestor de paquetes | [pnpm](https://pnpm.io/) | — |
| Despliegue | [Vercel](https://vercel.com/) (SPA con rewrites) | — |

---

## Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│  React 19 + React Router 7                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ AuthContext │  │ Zustand      │  │ Páginas / módulos   │ │
│  │ (sesión)    │  │ cache + UI   │  │ (Almacén, Vehículos)│ │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘ │
│         │                │                      │           │
│         └────────────────┼──────────────────────┘           │
│                          ▼                                  │
│              useApiQuery + servicios API                    │
│                          │                                  │
│              apiRequest (fetch) + validación Zod            │
└──────────────────────────┼──────────────────────────────────┘
                           ▼
              API REST (/api/v1) — backend Ferrocasa
```

La app es **100 % cliente**: no hay SSR ni BFF propio. En desarrollo, Vite hace **proxy** de `/api` al backend para evitar CORS.

---

## Núcleo de la aplicación

### React 19 + TypeScript

- Entrada: `src/main.tsx` → `App.tsx`.
- **TypeScript estricto** (`strict: true`), target ES2020, JSX `react-jsx`.
- Alias de rutas: `@/*` → `src/*` (definido en `tsconfig.json`).

### Vite 8

- Plugin `@vitejs/plugin-react` para HMR y compilación JSX.
- Plugin `@tailwindcss/vite` para integrar Tailwind v4 sin PostCSS manual.
- **Proxy de desarrollo** en `vite.config.js`: las peticiones a `/api` se reenvían a `VITE_DEV_API_PROXY` (por defecto `http://localhost:4000`).

### Tailwind CSS v4

- Configuración vía CSS (`src/index.css`) con directiva `@theme`.
- Paleta corporativa `navy-*` y tipografía **Poppins** (Google Fonts en `index.html`).
- `clamp()` en `font-size` para legibilidad en pantallas 1366×768 y superiores.

### React Router 7

- `BrowserRouter` con rutas protegidas (`ProtectedRoute`) y layout compartido (`Layout`).
- Módulos principales: Dashboard, Almacén, Cementerio, Terrenos, Vehículos, Reportes, Auditoría, Configuración.

---

## Estado y datos

### Zustand

Dos stores principales:

| Store | Archivo | Responsabilidad |
|-------|---------|-----------------|
| `useApiCacheStore` | `src/stores/apiCacheStore.ts` | Caché de consultas API con TTL, deduplicación de peticiones en vuelo e invalidación |
| `useModuleUiStore` | `src/stores/moduleUiStore.ts` | Estado de UI por módulo (filtros, paginación local, etc.) |

### `useApiQuery`

Hook propio (`src/hooks/useApiQuery.ts`) que combina el caché de Zustand con un patrón similar a React Query: `data`, `loading`, `error` y `refetch`, sin dependencia externa de TanStack Query.

### Autenticación

- **Context API** en `src/context/AuthContext.tsx`: login, logout, perfil y roles.
- Tokens en `src/api/auth/session.ts` (localStorage).
- Cliente HTTP con **refresh automático** del access token y evento `ferrocasa:auth-expired` al expirar la sesión (`src/api/client.ts`).

---

## Capa API

### Cliente HTTP

- `apiRequest` en `src/api/client.ts`: `fetch` nativo, query params, body JSON, cabecera `Authorization` y reintento tras refresh.
- Base URL: variable `VITE_API_URL` (por defecto `/api/v1`).

### Servicios

Un servicio por dominio en `src/api/services/`:

`auth`, `bienes`, `bienes-sedes`, `vehiculos`, `parcelas`, `propiedades`, `almacenes`, `sedes`, `departamentos`, `categorias`, `documentos`, `documentos-propiedad`, `protocolos`, `desincorporaciones`, `compromisos`, `responsables`, `roles`, `usuarios`, etc.

### Validación y mapeo

- Esquemas Zod del contrato API en `src/api/schemas/api.schema.ts`.
- Validación de respuestas y payloads en `src/api/validation.ts` (`ApiValidationError`).
- Mappers API ↔ dominio UI en `src/api/mappers/` (`bien`, `vehiculo`, `parcela`, `enums`).

### Paginación

`src/api/pagination.ts` centraliza:

- `API_MAX_LIMIT = 100` (tope impuesto por el backend).
- `MODULE_PAGE_SIZE = 10` para tablas de módulo.
- `fetchAllPages()` para exportaciones que requieren el dataset completo.

### Datos mock (solo desarrollo)

Controlado por variables de entorno (`src/api/mockConfig.ts`):

| Variable | Efecto |
|----------|--------|
| `VITE_USE_MOCK_DATA=true` | Solo mock, sin llamar al API |
| `VITE_ALLOW_MOCK_FALLBACK=true` | Si el API responde vacío, usar mock como respaldo |

---

## Formularios y validación

- **React Hook Form** para estado de formularios y rendimiento.
- **Zod** para esquemas de registro y edición en `src/schemas/` (`registro`, `registroVehiculo`, `registroParcela`, `protocolizacion`, `vehiculo`).
- **@hookform/resolvers** para conectar Zod con RHF en modales de alta/edición.

Componentes de formulario reutilizables en `src/components/forms/` (`SearchableSelect`, `CurrencyAmountInput`, `FlexibleIntegerInput`).

---

## UI y experiencia

| Librería | Uso en el proyecto |
|----------|-------------------|
| **Lucide React** | Iconografía en layout, tablas, modales y acciones |
| **Sonner** | Toasts (`<Toaster />` en `App.tsx`) para feedback de operaciones |
| **Recharts** | Gráficos del Dashboard |

Componentes de módulo en `src/components/module/`: cabecera, métricas, filtros, tablas, paginación y vista de detalle de activos.

Modales de registro y operaciones en `src/components/modals/`. Guard de cambios sin guardar: `useUnsavedChangesGuard` + `UnsavedChangesModal`.

---

## Exportación Excel

Flujo de reportes SUDEBIP e informes internos:

- Plantillas `.xlsx` en `public/formats/`.
- Lectura/escritura con `xlsx` y estilos con `xlsx-js-style`.
- Utilidades: `exportSudebipExcel.ts`, `exportInternoExcel.ts`, `excelWorkbookExport.ts`, `excelSheetStyles.ts`.
- Mappers de filas: `sudebipExportMappers.ts`, `internoExportMappers.ts`.

---

## Estructura del proyecto

```
src/
├── api/                 # Cliente HTTP, servicios, schemas Zod, mappers, paginación, mock
├── components/          # UI compartida, forms, modals, módulos
├── constants/           # Formatos Excel, filtros, tokens de UI
├── context/             # AuthContext
├── data/                # Catálogos estáticos y datos mock de desarrollo
├── hooks/               # useApiQuery, guards, acciones de inventario
├── pages/               # Vistas por ruta (Almacen, Vehiculos, Reportes, …)
├── schemas/             # Validación Zod de formularios
├── stores/              # Zustand (caché API, UI de módulos)
├── types/               # Tipos de dominio TypeScript
└── utils/               # Formateo, normalización, export Excel, estadísticas
public/
└── formats/             # Plantillas Excel oficiales
```

---

## Variables de entorno

Copiar `.env.example` a `.env` (el `.env` no se commitea):

```bash
cp .env.example .env
```

| Variable | Entorno | Descripción |
|----------|---------|-------------|
| `VITE_API_URL` | Dev / Prod | Base del API. En dev: `/api/v1` (proxy Vite). En prod: URL absoluta del backend |
| `VITE_DEV_API_PROXY` | Dev | Host al que Vite reenvía `/api` (default: `http://localhost:4000`) |
| `VITE_USE_MOCK_DATA` | Dev | `true` = solo datos mock |
| `VITE_ALLOW_MOCK_FALLBACK` | Dev | `true` = fallback a mock si el API devuelve listas vacías |

En **Vercel**, configurar `VITE_API_URL` en el panel de variables del proyecto (no en el repositorio).

---

## Requisitos y puesta en marcha

### Requisitos

- **Node.js** 20+ (recomendado)
- **pnpm** instalado globalmente
- Backend Ferrocasa corriendo (p. ej. puerto 4000) salvo que uses solo mock

### Instalación

```bash
pnpm install
```

### Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo con HMR (puerto 5173 por defecto) |
| `pnpm build` | Build de producción en `dist/` |
| `pnpm preview` | Sirve el build localmente |
| `pnpm lint` | ESLint sobre el proyecto |

### Desarrollo con API local

```bash
# .env
VITE_API_URL=/api/v1
VITE_DEV_API_PROXY=http://localhost:4000
VITE_USE_MOCK_DATA=false

pnpm dev
```

El front llama a `/api/v1/...`; Vite proxy reenvía a `localhost:4000/api/v1/...`.

---

## Despliegue

- **Plataforma:** Vercel.
- **Config:** `vercel.json` con rewrite SPA (`/(.*)` → `/index.html`).
- **Build:** `pnpm build` → carpeta `dist/`.
- Definir `VITE_API_URL` con la URL pública del API en producción.

---

## Módulos de negocio

| Módulo | Ruta | Descripción breve |
|--------|------|-------------------|
| Dashboard | `/dashboard` | Resumen y métricas (Recharts) |
| Bienes administrativos | `/almacen` | Inventario de muebles y bienes por sede/almacén |
| Cementerio | `/cementerio` | Gestión de bienes en cementerio |
| Terrenos | `/terrenos` | Parcelas y propiedades |
| Vehículos | `/vehiculos` | Flota e inventario vehicular |
| Reportes | `/reportes` | Exportación SUDEBIP e informes internos (Excel) |
| Auditoría | `/auditoria` | Trazabilidad de acciones por módulo |
| Configuración | `/configuracion` | Ajustes del sistema |

---

## Calidad de código

- **ESLint 10** con configuración flat (`eslint.config.js`).
- Reglas recomendadas de JS, React Hooks y React Refresh (Vite).
- TypeScript como fuente de verdad de tipos; el lint actual cubre principalmente archivos `.js`/`.jsx`.

---

## Licencia y propiedad

Proyecto privado (`"private": true` en `package.json`). Uso interno Ferrocasa.
