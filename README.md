# CargoLens — proyecto full-stack (The Bridge)

Aplicación de **seguimiento de contenedores marítimos** con búsqueda pública, workspace por empresa (MongoDB + JWT), integración con API tipo Sinay/Safecube, mapas Leaflet y panel de staff (clientes, import Excel, actividad, etc.). Este documento describe el alcance del proyecto, la instalación, los scripts, los endpoints principales, la cuenta demo y el modo de tracking; está redactado de forma **impersonal** para evaluación y clonado del repositorio.

---

## Stack

| Parte | Tecnología |
|--------|------------|
| Frontend | React 18, Vite, React Router, Leaflet, Axios |
| Backend | Node.js, Express, Mongoose |
| Auth | JWT (Bearer en `localStorage`) |
| Datos | MongoDB |

---

## Instalación y ejecución en local

### Requisitos

- Node.js 20 recomendado (alineado con CI).
- MongoDB accesible (local o Atlas).

### Backend (`backend/`)

1. Copiar `backend/.env.example` → `backend/.env` y configurar `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (p. ej. `http://localhost:5173`).
2. Opcional: `SAFECUBE_API_KEY` para tracking y buques con datos reales (portal Sinay / Developers).
3. `npm install` → `npm run dev`

La API escucha por defecto en `http://localhost:4000`. Comprobación: `GET /health`.

### Frontend (`frontend/`)

1. `npm install` → `npm run dev`
2. En desarrollo, Vite hace **proxy** de `/api` al backend. Si hiciera falta forzar la URL: `VITE_API_BASE_URL=http://localhost:4000/api` en un `.env` del frontend.
3. En **producción** (Cloudflare Pages, etc.) es obligatorio definir `VITE_API_BASE_URL` con la URL absoluta del API (p. ej. `https://<servicio>.onrender.com/api`).

### Scripts npm

| Ubicación | Comando | Descripción |
|-----------|---------|-------------|
| `backend/` | `npm run dev` | Servidor Express con recarga (`--watch`). |
| `backend/` | `npm start` | Arranque sin watch (producción). |
| `backend/` | `npm run seed:demo` | Crea/actualiza usuario demo y datos de ejemplo (`scripts/seed-demo-user.js`). |
| `backend/` | `npm test` | Tests Jest. |
| `backend/` | `npm run test:coverage` | Tests con cobertura LCOV (CI/Sonar). |
| `frontend/` | `npm run dev` | Vite dev server. |
| `frontend/` | `npm run build` | Build de producción (`dist/`). |
| `frontend/` | `npm run preview` | Sirve el build localmente. |
| `frontend/` | `npm test` / `npm run test:coverage` | Vitest. |
| `frontend/` | `npm run lint` | ESLint. |
| `frontend/` | `npm run lint:locales` | Comprueba claves i18n EN/ES. |
| `frontend/` | `npm run test:e2e` | Playwright (requiere dev server en marcha). |

---

## Endpoints principales del API

Todas las rutas de negocio van bajo el prefijo **`/api`**, salvo el health en la raíz.

| Método | Ruta | Auth | Descripción breve |
|--------|------|------|---------------------|
| GET | `/health` | No | Estado del servicio y conexión a BD. |
| POST | `/api/auth/register` | No | Registro (empresa / códigos de invitación). |
| POST | `/api/auth/login` | No | Login; devuelve JWT. |
| GET | `/api/auth/me` | Bearer | Perfil del usuario autenticado. |
| GET | `/api/track/search` | Opcional | Búsqueda de envío por número de contenedor (`q`). |
| GET | `/api/vessels/search` | No | Búsqueda pública de buques (requiere clave API en servidor). |
| GET | `/api/vessels/from-containers` | Bearer | Buques derivados de contenedores guardados. |
| GET | `/api/containers` | Bearer | Lista de contenedores guardados. |
| POST | `/api/containers` | Staff | Alta de contenedor. |
| PATCH | `/api/containers/:id` | Staff | Actualización. |
| DELETE | `/api/containers/:id` | Staff | Borrado. |
| POST | `/api/containers/import` | Staff | Importación Excel (multipart). |
| GET | `/api/containers/overview-map` | Bearer | Payload para mapa/resumen del dashboard. |
| GET/POST/PATCH/DELETE | `/api/clients` | Staff | CRUD de clientes del workspace. |
| GET | `/api/activity` | Staff | Listado de actividad del workspace. |

El rate limiting se aplica al montaje de `/api` (ver `app.js`).

---

## Cuenta demo y seed

El script `backend/scripts/seed-demo-user.js` define un usuario de demostración y datos asociados (empresa, clientes, contenedores guardados).

### Sembrar la base de datos

Desde `backend/`, con `MONGODB_URI` en `.env`:

```bash
npm run seed:demo
```

Para que el mismo usuario exista en **producción**, el `MONGODB_URI` usado al ejecutar el seed debe apuntar al **mismo** cluster/base que el backend desplegado.

### Credenciales tras el seed

| Campo | Valor |
|--------|--------|
| Email | `demo@freightboard.local` |
| Contraseña | `FreightDemo2026!` |

Acceso vía ruta `/login` de la aplicación.

---

## Tracking: API real vs modo simulado

El backend (`trackingController`) distingue:

1. **Con `SAFECUBE_API_KEY` en el servidor:** petición a Sinay/Safecube, mapeo de la respuesta y envío al cliente como datos de operador cuando existan.
2. **Sin clave:** respuesta **mock** determinista (`buildMockShipment`), útil para demos sin depender de claves ni de equipos reales.

### Prueba recomendada en modo mock

Número de ejemplo: **`ZZZZ0000000`**. Con el mock activo, el resultado es determinista y puede repetirse sin consumir cuota de API externa. Con API real, el resultado depende de los datos del operador para ese contenedor.

La búsqueda exige un mínimo de caracteres en la query (ver validación en el controlador).

---

## Relación con el temario (The Bridge)

| Bloque | Implementación en el repo |
|--------|---------------------------|
| Node / Express | API REST modular, middlewares, rate limit. |
| REST / Axios / CORS | Cliente Axios centralizado; CORS con `CLIENT_ORIGIN` y validación de origen. |
| MongoDB / Mongoose | Modelos y rutas CRUD con permisos staff/cliente. |
| Jest / Vitest | Tests y cobertura en CI. |
| React (router, hooks, context) | Rutas, contextos de auth/tema/toasts, hooks de dominio. |
| Deploy | Variables de entorno en hosting (Render + estático en Pages u otro). |

El temario incluye SQL; este proyecto usa **MongoDB** por el modelo documental de envíos y listados; los conceptos de modelado y consultas se aplican a colecciones y agregaciones.

---

## Funcionalidades adicionales

- Internacionalización ES/EN y comprobación de claves.
- PWA (`vite-plugin-pwa`).
- Paleta de comandos (`Ctrl+K` / `⌘K`), tema claro/oscuro, mapas Leaflet.
- Dashboard con KPIs, filtros, mapa de flota en overview.
- GitHub Actions + SonarCloud; Playwright en `frontend/e2e/`.
- Páginas legales, changelog, banner de conectividad, impresión desde listas.

---

## Despliegue

- **Backend:** servicio Node (p. ej. Render) con `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (URL del frontend, sin barra final), opcionalmente `SAFECUBE_API_KEY`.
- **Frontend:** hosting estático con build Vite; variable de build `VITE_API_BASE_URL` apuntando al API (incluyendo `/api` o solo el host según la normalización del cliente).

---

## Repositorio y calidad

- Monorepo con carpetas `frontend/` y `backend/`.
- `.gitignore` excluye `.env` y variantes; se versionan `*.env.example`.
- README: instalación, scripts, descripción, endpoints resumidos.
- Workflow CI: instalación, tests con cobertura, análisis Sonar (ver `.github/workflows/` y `sonar-project.properties`).

---

## Alineación orientativa con la rúbrica de evaluación

| Criterio | Evidencia en el proyecto |
|----------|---------------------------|
| **Backend** | Rutas REST bajo `/api`, validaciones en controladores, códigos HTTP coherentes, manejo de errores (incl. servicios externos), rate limiting, JWT. |
| **Frontend (React)** | Componentes por dominio, contextos, hooks, rutas protegidas, UI coherente, i18n. |
| **Integración F–B** | Axios con base URL por entorno, interceptores JWT, feedback de carga/errores en flujos principales. |
| **GitHub / repo** | Estructura clara, README extendido, `.gitignore`, documentación de scripts y API. |
| **Despliegue** | Proyecto diseñado para backend + frontend en la nube con variables de entorno documentadas. |

---

## Qué incluye el proyecto (resumen)

- CRUD y permisos (staff vs portal cliente), import Excel, export CSV, actividad.
- Integración externa de tracking y buques cuando hay claves configuradas.
- UI responsive, accesibilidad básica (p. ej. skip link).

## Calidad y pruebas (frontend)

- `npm run lint`, `npm run lint:locales`.
- E2E: con `npm run dev` en `frontend/`, en otra terminal `npm run test:e2e` (opcional `PLAYWRIGHT_BASE_URL`).

## Alcance

Proyecto de **aprendizaje y demo**: no sustituye un producto enterprise completo (observabilidad avanzada, hardening exhaustivo, etc.), pero cubre un flujo vertical de extremo a extremo.

## Estructura del repositorio

```
Final Project/
├── backend/src/     # Express: rutas, controladores, modelos, servicios
├── frontend/src/    # React: páginas, API client, contexts
├── frontend/e2e/    # Playwright
├── .github/workflows/
└── README.md
```

## Arquitectura de datos

```
Browser (React) ──axios /api──► Express ──► MongoDB (Mongoose)
                     │
                     └── Tracking / buques: APIs externas (Sinay/Safecube) si hay clave
```
