# CargoLens — mi proyecto final (Full Stack, The Bridge)

No hay presentación oral aparte: **este README es la presentación del trabajo**. Lo escribo yo para que quien lo lea (profesor, tribunal o compañero que clone el repo) entienda qué hay detrás, cómo se ejecuta y por qué tomé las decisiones que tomé.

**CargoLens** es una web de **seguimiento de contenedores marítimos**: búsqueda pública de envíos, registro por empresa con **MongoDB + JWT**, integración con API tipo **Sinay/Safecube** cuando hay clave, **mapas Leaflet** y un **panel de staff** (clientes, import Excel, actividad, listas guardadas, etc.). Lo monté como monorepo `frontend/` + `backend/` porque quería un corte vertical real: de la base de datos al despliegue.

---

## Stack (lo que elegí y me funcionó)

| Parte | Tecnología |
|--------|------------|
| Frontend | React 18, Vite, React Router, Leaflet, Axios |
| Backend | Node.js, Express, Mongoose |
| Auth | JWT (Bearer en `localStorage`) |
| Datos | MongoDB |

---

## Qué apliqué del máster (y qué fui más allá)

En el programa vimos **Node, Express, REST, CORS, Mongo, Jest, React, hooks, contexto, deploy**. Aquí lo solté todo en el mismo producto: rutas REST bajo `/api`, CORS con origen configurable (me pegué con eso en producción hasta dejar validación de `CLIENT_ORIGIN`), modelos Mongoose con permisos **staff vs portal cliente**, cliente **Axios** centralizado y variables de entorno para que el front en **Cloudflare Pages** hable con el API en **Render** sin inventos raros.

El temario también tocó **SQL** a fondo; yo aposté por **MongoDB** en este proyecto porque encaja con documentos de envío y listas de contenedores, pero la idea de modelar bien los datos y no mezclar conceptos es la misma.

Lo que me motivó a ir un poco “crack” por encima del mínimo: **i18n ES/EN**, **PWA** con `vite-plugin-pwa`, **paleta de comandos** (`Ctrl+K`), tema claro/oscuro, **GitHub Actions + SonarCloud**, un **smoke E2E con Playwright**, páginas de **changelog / privacidad** y detalles de UX (banner si la API no responde, impresión desde listas…). No son obligatorios en una rúbrica básica, pero son la prueba de que me importaba entregar algo **usable y defendible**.

---

## Cómo lo levantas en local

**Requisitos:** Node 20 (lo uso en CI), Mongo accesible (local o Atlas).

### Backend (`backend/`)

1. Copia `backend/.env.example` → `backend/.env` y rellena `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (en local yo uso `http://localhost:5173`).
2. Si tienes clave de Sinay: `SAFECUBE_API_KEY` para tracking y buques con datos reales.
3. `npm install` → `npm run dev`

La API queda en `http://localhost:4000`. Para ver que respira: `GET /health`.

### Frontend (`frontend/`)

1. `npm install` → `npm run dev`
2. En desarrollo Vite hace **proxy** de `/api` al backend. Si algo rasca, en un `.env` del front puedes poner `VITE_API_BASE_URL=http://localhost:4000/api`.
3. En **producción** hace falta **`VITE_API_BASE_URL`** con la URL absoluta del API (yo uso el host de Render; el cliente normaliza y añade `/api` si solo pones el dominio).

### Scripts que uso a diario

| Dónde | Comando | Para qué |
|--------|---------|----------|
| `backend/` | `npm run dev` | API con `--watch` |
| `backend/` | `npm start` | Producción local / Render |
| `backend/` | `npm run seed:demo` | Usuario demo + datos (`scripts/seed-demo-user.js`) |
| `backend/` | `npm test` / `npm run test:coverage` | Jest + LCOV para Sonar |
| `frontend/` | `npm run dev` / `build` / `preview` | Vite |
| `frontend/` | `npm test` / `npm run test:coverage` | Vitest |
| `frontend/` | `npm run lint` / `lint:locales` | ESLint + claves i18n |
| `frontend/` | `npm run test:e2e` | Playwright (con el dev server levantado) |

---

## Endpoints del API (resumen)

Todo el negocio va bajo **`/api`** salvo el health.

| Método | Ruta | Auth | Qué hace |
|--------|------|------|----------|
| GET | `/health` | No | Estado + BD |
| POST | `/api/auth/register` | No | Registro |
| POST | `/api/auth/login` | No | JWT |
| GET | `/api/auth/me` | Bearer | Perfil |
| GET | `/api/track/search` | Opcional | Tracking por `q` |
| GET | `/api/vessels/search` | No | Buques (pública; clave en servidor) |
| GET | `/api/vessels/from-containers` | Bearer | Buques desde guardados |
| GET/POST/PATCH/DELETE | `/api/containers` | Bearer / staff | CRUD + import |
| GET | `/api/containers/overview-map` | Bearer | Mapa / resumen dashboard |
| CRUD | `/api/clients` | Staff | Clientes |
| GET | `/api/activity` | Staff | Actividad |

Rate limit en `/api` — mirar `app.js`.

---

## Cuenta demo (para que pruebes sin registrarte otra vez)

Dejé un script que crea empresa, usuario y contenedores de ejemplo:

```bash
cd backend && npm run seed:demo
```

**Ojo:** si quieres el mismo usuario en **producción**, el `MONGODB_URI` con el que corres el seed tiene que ser **el mismo** cluster que usa el backend desplegado.

| Campo | Valor |
|--------|--------|
| Email | `demo@freightboard.local` |
| Contraseña | `FreightDemo2026!` |

Entrada: `/login`.

---

## Tracking: con API real o en modo demo

Monté dos caminos en el backend:

1. **Con `SAFECUBE_API_KEY` en el servidor** → llamo a Sinay/Safecube y mapeo la respuesta; el front muestra datos “live” cuando el operador tiene información.
2. **Sin clave** → **mock determinista** (`buildMockShipment`) para que la demo no dependa de claves ni de un contenedor real en el océano.

Para probar el mock sin líos uso **`ZZZZ0000000`**: siempre devuelve un envío simulado coherente y puedes repetir la búsqueda las veces que quieras sin gastar cuota de API externa. Si enseñas API real, el resultado ya depende del operador.

---

## Despliegue (cómo lo tengo montado)

- **API:** Node en **Render** con `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (URL exacta del front, sin `/` final) y opcionalmente `SAFECUBE_API_KEY`.
- **Front:** estático en **Cloudflare Pages** con `VITE_API_BASE_URL` en el build.

Si algo falla entre dominios, casi siempre es CORS o la URL del API mal puesta — lo dejé documentado arriba para no repetir el sufrimiento.

---

## Repo, `.gitignore` y calidad

Separé `frontend/` y `backend/`, ignoré **`.env` y `.env.*`** (menos `*.env.example`) para no subir secretos, y conecté **GitHub Actions** con tests + cobertura y **SonarCloud** (`sonar-project.properties`). El README que lees es parte de la entrega; el código habla del resto.

---

## Cómo encaja esto con la rúbrica (lo que quiero que valoren)

| Criterio | Dónde se nota |
|----------|----------------|
| **Backend** | REST, validaciones, status codes, JWT, rate limit, integración externa con manejo de errores |
| **Frontend** | React estructurado, Context, hooks, rutas, UI consistente, i18n |
| **Integración** | Axios, JWT en peticiones, feedback de carga/errores en los flujos principales |
| **GitHub** | Monorepo ordenado, este README, scripts, endpoints, `.gitignore` |
| **Despliegue** | Render + Pages con variables documentadas |

---

## Resumen honesto del alcance

Esto es un **proyecto de aprendizaje y demo serio**, no un SaaS enterprise con SOC2; aun así cubre **login → API → Mongo → front desplegado** y integración con API de terceros cuando hay clave.

## Estructura del repo

```
Final Project/
├── backend/src/
├── frontend/src/
├── frontend/e2e/
├── .github/workflows/
└── README.md   ← estás aquí; para mí esto cuenta como la presentación
```

## Arquitectura (una línea)

```
Browser (React) ──axios /api──► Express ──► MongoDB (Mongoose)
                     │
                     └── Sinay/Safecube si hay SAFECUBE_API_KEY
```

---

*Si clonas el repo y algo no arranca, revisa `.env` y que Mongo esté arriba. Suerte en la corrección.*
