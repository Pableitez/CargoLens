# CargoLens — proyecto full-stack (bootcamp)

Aplicación de **seguimiento de contenedores marítimos** con búsqueda pública, workspace por empresa (MongoDB + JWT), integración con API tipo Sinay/Safecube, mapas Leaflet y panel de staff (clientes, import Excel, actividad, etc.).

## Stack

| Parte | Tecnología |
|--------|------------|
| Frontend | React 18, Vite, React Router, Leaflet, Axios |
| Backend | Node.js, Express, Mongoose |
| Auth | JWT (Bearer en `localStorage`) |
| Datos | MongoDB |

## Cómo ejecutarlo en local

1. **MongoDB** en marcha (local o Atlas URI).
2. **Backend** (`backend/`):
   - Copiar `backend/.env.example` → `backend/.env` y rellenar `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (p. ej. `http://localhost:5173`).
   - Opcional: `SAFECUBE_API_KEY` para datos reales de tracking / buques.
   - `npm install` → `npm run dev`
3. **Frontend** (`frontend/`):
   - Opcional: `VITE_API_BASE_URL=http://localhost:4000/api` si el proxy de Vite no aplica.
   - `npm install` → `npm run dev`

API por defecto: `http://localhost:4000` · health: `GET /health`.

## Qué demuestra el proyecto

- CRUD y permisos (staff vs portal cliente), importación Excel, export CSV, actividad de workspace.
- Consumo de API externa de tracking y búsqueda de buques.
- UI responsive (sidebar + topbar), tema claro/oscuro, mapas acoplados al tema.
- **Paleta de comandos** (`Ctrl+K` / `⌘K`): rutas y contenedores guardados; **banner** si la API no responde; **PWA** (service worker + manifest vía `vite-plugin-pwa`); **KPIs** en el resumen del dashboard; **notificaciones** (menú de actividad reciente para staff); **impresión / PDF** desde la lista guardada; **fechas con zona horaria** en actividad; página **Novedades** (`/changelog`) y **privacidad** ampliada (retención); **Playwright** (`frontend/e2e/`).

## Calidad y pruebas (frontend)

- `npm run lint` — ESLint.
- `npm run lint:locales` — mismas claves EN/ES.
- **E2E:** con el dev server en marcha (`npm run dev` en `frontend/`), en otra terminal: `npm run test:e2e` (Playwright). Opcional: `PLAYWRIGHT_BASE_URL=http://localhost:5173`.

## Alcance (bootcamp)

Pensado como **aprendizaje y demo**: no sustituye un producto enterprise (hardening de seguridad, observabilidad APM, alertas por email, etc.).

## Estructura rápida

```
Final Project/
├── backend/src/     # Express: rutas, controladores, modelos, servicios
├── frontend/src/    # React: páginas, API client, contexts
├── frontend/e2e/    # Playwright
└── README.md
```

## Arquitectura rápida (datos)

```
Browser (React) ──axios /api──► Express ──► MongoDB (Mongoose)
                     │
                     └── Tracking / buques: servicios que llaman APIs externas (p. ej. Sinay) si hay clave
```
