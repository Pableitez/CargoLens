# CargoLens — Proyecto final Full Stack (The Bridge)

## Documentación de entrega

Documento de apoyo para **tribunal y evaluadores del repositorio**: alcance del trabajo, decisiones técnicas, reproducción del entorno local y en producción, relación con el temario del máster y con la rúbrica de calificación.

---

## Descripción del proyecto

**CargoLens** es una aplicación web de **seguimiento de contenedores marítimos** que incluye:

- Búsqueda pública de envíos y vista de detalle.
- Registro y acceso por **workspace** (empresa) con **MongoDB** y autenticación **JWT**.
- Integración opcional con API de operador (**Sinay/Safecube**) para tracking y buques.
- **Mapas Leaflet** y panel de **staff** (clientes, importación Excel, actividad, listas guardadas, etc.).

El código está organizado como **monorepo** (`frontend/` y `backend/`) para mantener un flujo completo desde la persistencia hasta el despliegue.

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, Vite, React Router, Leaflet, Axios |
| Backend | Node.js, Express, Mongoose |
| Autenticación | JWT (Bearer en `localStorage`) |
| Base de datos | MongoDB |

---

## Relación con el temario y decisiones de diseño

En el programa se trabajaron **Node.js, Express, APIs REST, CORS, MongoDB, pruebas, React (hooks, contexto, rutas) y despliegue**. El proyecto integra estos contenidos en un solo producto: API REST bajo `/api`, **CORS** con origen configurable y validación del valor de `CLIENT_ORIGIN` en servidor, modelos **Mongoose** con distinción **staff / portal cliente**, cliente **Axios** unificado y variables de entorno para el despliegue del frontend (**Cloudflare Pages**) frente al backend (**Render**). La persistencia usa **MongoDB** para envíos y listados de contenedores, con modelado y consultas sobre colecciones.

Como ampliación respecto al núcleo mínimo, el repositorio incorpora **internacionalización ES/EN**, **PWA** (`vite-plugin-pwa`), **paleta de comandos** (`Ctrl+K` / `⌘K`), tema claro/oscuro, **GitHub Actions** y **SonarCloud**, prueba **E2E** con **Playwright**, páginas de **changelog** y **privacidad**, y mejoras de UX (indicación de conectividad, impresión desde listas, etc.).

---

## Instalación y ejecución en local

**Requisitos:** Node.js 20 (alineado con CI) y MongoDB accesible (local o Atlas).

### Backend (`backend/`)

1. Copiar `backend/.env.example` a `backend/.env` y configurar `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (por ejemplo `http://localhost:5173` en desarrollo).
2. Opcional: `SAFECUBE_API_KEY` para datos reales de tracking y buques (portal Sinay / Developers).
3. Ejecutar `npm install` y `npm run dev`.

API por defecto: `http://localhost:4000`. Comprobación: `GET /health`.

### Frontend (`frontend/`)

1. `npm install` y `npm run dev`.
2. En desarrollo, Vite hace **proxy** de `/api` al backend. Si fuera necesario, definir `VITE_API_BASE_URL=http://localhost:4000/api` en un `.env` del frontend.
3. En **producción**, el build requiere **`VITE_API_BASE_URL`** con la URL absoluta del API (el cliente acepta host con o sin sufijo `/api` según la implementación en `frontend/src/api/client.js`).

### Scripts principales

| Ubicación | Comando | Uso |
|-----------|---------|-----|
| `backend/` | `npm run dev` | Servidor con recarga (`--watch`). |
| `backend/` | `npm start` | Arranque sin watch (producción). |
| `backend/` | `npm run seed:demo` | Usuario y datos de demostración. |
| `backend/` | `npm test` / `npm run test:coverage` | Jest y cobertura (CI/Sonar). |
| `frontend/` | `npm run dev` / `build` / `preview` | Ciclo Vite. |
| `frontend/` | `npm test` / `npm run test:coverage` | Vitest. |
| `frontend/` | `npm run lint` / `npm run lint:locales` | ESLint y coherencia i18n. |
| `frontend/` | `npm run test:e2e` | Playwright (servidor de desarrollo en ejecución). |

---

## Endpoints principales del API

Las rutas de negocio utilizan el prefijo **`/api`**. El health check está en la raíz.

| Método | Ruta | Autenticación | Descripción |
|--------|------|----------------|-------------|
| GET | `/health` | No | Estado del servicio y base de datos. |
| POST | `/api/auth/register` | No | Registro. |
| POST | `/api/auth/login` | No | Obtención de JWT. |
| GET | `/api/auth/me` | Bearer | Perfil del usuario. |
| GET | `/api/track/search` | Opcional | Búsqueda por número de contenedor (`q`). |
| GET | `/api/vessels/search` | No | Búsqueda pública de buques (clave en servidor). |
| GET | `/api/vessels/from-containers` | Bearer | Buques a partir de contenedores guardados. |
| GET/POST/PATCH/DELETE | `/api/containers` | Bearer / staff | CRUD, importación. |
| GET | `/api/containers/overview-map` | Bearer | Datos para mapa y resumen. |
| CRUD | `/api/clients` | Staff | Clientes del workspace. |
| GET | `/api/activity` | Staff | Actividad del workspace. |

Sobre `/api` se aplica **rate limiting** (ver `backend/src/app.js`).

---

## Cuenta de demostración

Los datos de prueba se generan con:

```bash
cd backend && npm run seed:demo
```

Para que el mismo usuario exista en el entorno desplegado, el `MONGODB_URI` usado al ejecutar el seed debe corresponder al **mismo** clúster o base de datos que utiliza el backend en producción.

| Campo | Valor |
|-------|--------|
| Email | `demo@freightboard.local` |
| Contraseña | `FreightDemo2026!` |

Acceso: ruta `/login`.

---

## Modos de tracking

El backend distingue:

1. **Con `SAFECUBE_API_KEY` configurada:** llamadas a la API de Sinay/Safecube y mapeo al modelo de la aplicación.
2. **Sin clave:** respuesta **simulada determinista** (`buildMockShipment`) para permitir pruebas sin dependencia de claves ni de equipos reales.

Para el modo simulado se puede usar el número **`ZZZZ0000000`**; el resultado es reproducible y no consume cuota de API externa. Con API real, el resultado depende de la disponibilidad de datos del operador.

---

## Despliegue

- **Backend:** servicio Node (por ejemplo **Render**) con `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (origen exacto del frontend, sin barra final) y, opcionalmente, `SAFECUBE_API_KEY`.
- **Frontend:** hosting estático (**Cloudflare Pages** u otro) con variable de build `VITE_API_BASE_URL`.

Entre dominios distintos, los problemas habituales se resuelven verificando **CORS** y la **URL base del API** en el cliente.

---

## Repositorio, seguridad y calidad

- Estructura **monorepo** con `frontend/` y `backend/`.
- **`.gitignore`:** exclusión de `.env` y variantes; se versionan archivos `*.env.example`.
- **CI:** GitHub Actions con instalación, tests y cobertura; análisis en **SonarCloud** (`sonar-project.properties`).

---

## Correspondencia con la rúbrica de evaluación

| Criterio | Evidencia en el proyecto |
|----------|----------------------------|
| **Backend** | API REST, validaciones, códigos de estado HTTP, JWT, rate limiting, manejo de errores e integración con servicio externo cuando aplica. |
| **Frontend (React)** | Componentes organizados, Context, hooks, enrutamiento, interfaz coherente, i18n. |
| **Integración frontend–backend** | Cliente HTTP centralizado, token en peticiones, indicadores de carga y mensajes de error en flujos principales. |
| **GitHub / repositorio** | Organización por carpetas, este README, scripts documentados, tabla de endpoints, `.gitignore`. |
| **Despliegue** | Backend y frontend alojados por separado con variables de entorno descritas. |

---

## Alcance del trabajo

El proyecto se enmarca como **aplicación de aprendizaje y demostración técnica**; no pretende equivaler a un producto enterprise en seguridad u observabilidad avanzada, pero sí cubre un **flujo vertical** completo: autenticación, persistencia, consumo de API de terceros opcional y despliegue.

## Estructura del repositorio

```
Final Project/
├── backend/src/
├── frontend/src/
├── frontend/e2e/
├── .github/workflows/
└── README.md
```

## Arquitectura lógica

```
Browser (React) ──axios /api──► Express ──► MongoDB (Mongoose)
                     │
                     └── APIs Sinay/Safecube si existe SAFECUBE_API_KEY
```

---

*Documentación elaborada como memoria del proyecto final. Para incidencias en la reproducción del entorno, verificar variables en `.env` y conectividad con MongoDB.*
