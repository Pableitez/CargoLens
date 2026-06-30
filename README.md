# NaoLab — Proyecto final Full Stack (The Bridge)

## Descripción

**NaoLab** es una plataforma web de **operaciones comerciales** para transitarios y operadores de comercio exterior:

- **Export orders**, **shipper bookings** y **carrier bookings** enlazados.
- **Trade setup** — parties, facilities, relationships, supply chains.
- **Workspace** multi-usuario (staff + portal cliente) con MongoDB y sesión httpOnly.
- Landing pública, registro, i18n ES/EN, PWA y command palette.

Monorepo: `frontend/` (React + Vite) y `backend/` (Express + Mongoose).

---

## Stack

| Capa          | Tecnología                          |
| ------------- | ----------------------------------- |
| Frontend      | React 18, Vite, React Router, Axios |
| Backend       | Node.js, Express, Mongoose          |
| Auth          | JWT en cookie httpOnly              |
| Base de datos | MongoDB                             |

---

## Local

**Requisitos:** Node.js 20+, MongoDB en marcha (`mongodb://127.0.0.1:27017`).

### Arranque rápido (recomendado)

Desde la **raíz** del repo (backend + frontend a la vez):

```bash
npm install          # instala husky + concurrently
npm run dev          # API :4000 + web :5173
```

Abre **http://localhost:5173** (no uses solo el puerto 4000 — es solo la API).

### Backend / frontend por separado

```bash
cd backend
cp .env.example .env   # MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN
npm install
npm run dev            # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173 — proxy /api → backend
```

### Datos demo

```bash
cd backend && npm run seed:all
```

| Campo      | Valor               |
| ---------- | ------------------- |
| Email      | `demo@naolab.local` |
| Contraseña | `FreightDemo2026!`  |

---

## API principal (`/api`)

| Área             | Rutas                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| Auth             | `/auth/register`, `/login`, `/logout`, `/me`                                    |
| Orders           | `/orders`                                                                       |
| Shipper bookings | `/shipper-bookings`                                                             |
| Carrier bookings | `/carrier-bookings`                                                             |
| Trade masters    | `/parties`, `/facilities`, `/trade-relationships`, `/supply-chains`, `/clients` |
| Messages         | `/conversations`                                                                |
| Marketing        | `/marketing/pilot-leads` (opcional)                                             |
| Health           | `GET /health` (raíz, sin prefijo)                                               |

Carrier booking usa `CARRIER_BOOKING_MODE=mock` por defecto (sin credenciales INTTRA).

### E2E (Playwright)

```bash
cd backend && npm run seed:all
cd ../frontend
npx playwright install chromium
npm run test:e2e
```

---

## Scripts útiles

| Ubicación   | Comando             |
| ----------- | ------------------- |
| Raíz        | `npm test`          |
| `frontend/` | `npm run typecheck` |
| `frontend/` | `npm run test:e2e`  |
| `backend/`  | `npm test`          |

---

## Despliegue

- **Backend:** Render (u otro) — `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`.
- **Frontend:** Cloudflare Pages — `VITE_API_BASE_URL` apuntando al API (`…/api`).

Opcional: `RESEND_API_KEY` + `PILOT_NOTIFY_TO` para avisos de leads de marketing.

---

## Estructura

```
├── backend/src/     controllers, models, routes, services
├── frontend/src/    pages, features, api, i18n, config/moduleRegistry.ts
├── docs/            MODULE_REGISTRY.md, business plan v1.1
└── shared/domain/   tipos compartidos
```

Documentación de módulos: `docs/MODULE_REGISTRY.md`.

---

## Calidad

GitHub Actions + SonarCloud (`sonar.projectKey=Pableitez_NaoLab`). Si el proyecto en SonarCloud aún usa la clave antigua, renómbralo o actualiza la clave en CI.
