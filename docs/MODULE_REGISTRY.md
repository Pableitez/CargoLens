# Module registry — NaoLab

Taxonomía oficial del producto. **No reordenar** submódulos entre áreas sin actualizar este documento y `frontend/src/config/moduleRegistry.ts`.

## Navegación principal (top-level)

| ID                   | Ruta                             | Descripción                                |
| -------------------- | -------------------------------- | ------------------------------------------ |
| `home`               | `/dashboard/home`                | Inicio operativo y accesos rápidos         |
| `operations`         | `/dashboard/operations`          | Export, transport, warehouse, import (hub) |
| `documents`          | `/dashboard/documents`           | Área documental                            |
| `insights`           | `/dashboard/insights`            | Reporting y mensajería                     |
| `operationalFinance` | `/dashboard/operational-finance` | Finanzas operativas (roadmap)              |
| `tasks`              | `/dashboard/tasks`               | Bandeja de tareas (roadmap)                |
| `settings`           | `/dashboard/settings`            | Trade setup — parties, facilities          |

## Export

Ruta base: `/dashboard/operations/export`

| Submódulo       | ID               | Estado   |
| --------------- | ---------------- | -------- |
| Order           | `order`          | **Live** |
| Shipper booking | `shipperBooking` | **Live** |
| Export customs  | `exportCustoms`  | Roadmap  |

## Transport

Ruta base: `/dashboard/operations/transport`

| Submódulo              | ID                      | Estado                             |
| ---------------------- | ----------------------- | ---------------------------------- |
| Carrier booking        | `carrierBooking`        | **Live** (INTTRA mock por defecto) |
| Shipping instructions  | `shippingInstructions`  | Roadmap                            |
| Verified gross mass    | `verifiedGrossMass`     | Roadmap                            |
| Schedules              | `schedules`             | Roadmap                            |
| Allocation utilization | `allocationUtilization` | Roadmap                            |

## Warehouse / Import

Roadmap — placeholders en registry.

## Documents / Insights

Roadmap — excepto **customer messaging** (`/dashboard/messages`), live.

## Reglas de arquitectura

1. Cada submódulo futuro: modelo + API + UI + tests en su carpeta de dominio.
2. Documents vive solo bajo **Documents**; se vincula a orders/bookings por referencia.
3. El portal cliente ve trade setup + mensajes; staff gestiona operaciones y settings.

## Estado de implementación

Ver `implemented: true` en `frontend/src/config/moduleRegistry.ts`.

**Live hoy:** export orders, shipper bookings, carrier bookings, trade setup (parties, facilities, relationships), client invites, messages, marketing landing, auth.

**Eliminado del producto:** container tracking, vessel maps, saved containers, Sinay/Safecube integration.
