# Module registry — NaoLab

Taxonomía oficial del producto. **No reordenar** submódulos entre áreas sin actualizar este documento y `frontend/src/config/moduleRegistry.ts`.

## Navegación principal (top-level)

| ID                   | Ruta                             | Descripción                                      |
| -------------------- | -------------------------------- | ------------------------------------------------ |
| `home`               | `/dashboard/home`                | Inicio operativo, KPIs, pendientes               |
| `cases`              | `/dashboard/cases`               | Expedientes / files                              |
| `shipments`          | `/dashboard/shipments`           | Operaciones de embarque                          |
| `tracking`           | `/dashboard/tracking`            | Visibilidad contenedor / buque                   |
| `operationalFinance` | `/dashboard/operational-finance` | Finanzas operativas                              |
| `documents`          | `/dashboard/documents`           | Área documental (independiente de Export/Import) |
| `insights`           | `/dashboard/insights`            | Inteligencia y reporting                         |
| `tasks`              | `/dashboard/tasks`               | Bandeja de tareas                                |
| `settings`           | `/dashboard/settings`            | Configuración                                    |

## Export

Ruta base: `/dashboard/operations/export`

| Submódulo       | ID               |
| --------------- | ---------------- | ---------------------------------------------------- |
| Order           | `order`          |
| Shipper booking | `shipperBooking` | **Live** — export bookings (SB), lines, import Excel |
| Export customs  | `exportCustoms`  |

## Transport

Ruta base: `/dashboard/operations/transport`

| Submódulo              | ID                      |
| ---------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| Carrier booking        | `carrierBooking`        | **Live** — INTTRA-oriented requests linked to shipper bookings (mock submit by default) |
| Shipping instructions  | `shippingInstructions`  |
| Verified gross mass    | `verifiedGrossMass`     |
| Schedules              | `schedules`             |
| Allocation utilization | `allocationUtilization` |

## Warehouse

Ruta base: `/dashboard/operations/warehouse`

| Submódulo      | ID              |
| -------------- | --------------- |
| Receiving      | `receiving`     |
| Cargo stuffing | `cargoStuffing` |

## Import

Ruta base: `/dashboard/operations/import`

| Submódulo             | ID                    |
| --------------------- | --------------------- |
| Arrival management    | `arrivalManagement`   |
| Carrier release       | `carrierRelease`      |
| Import customs        | `importCustoms`       |
| Delivery planning     | `deliveryPlanning`    |
| Exception management  | `exceptionManagement` |
| Non-network shipments | `nonNetworkShipments` |

## Documents

Ruta base: `/dashboard/documents` — **no** pertenece a Export ni Import.

| Submódulo                | ID                       |
| ------------------------ | ------------------------ |
| Document management      | `documentManagement`     |
| Forwarders cargo receipt | `forwardersCargoReceipt` |
| Commercial invoices      | `commercialInvoices`     |
| Exception management     | `exceptionManagement`    |
| Packing list             | `packingList`            |

## Insights

Ruta base: `/dashboard/insights`

| Submódulo                  | ID                         |
| -------------------------- | -------------------------- |
| Supply chain intelligence  | `supplyChainIntelligence`  |
| Reporting                  | `reporting`                |
| Customer messaging service | `customerMessagingService` |

## Reglas de arquitectura

1. Cada submódulo futuro: modelo + API + UI + eventos + tests en su carpeta de dominio.
2. `Case` (expediente) será el contenedor transversal; `Shipment` sigue siendo la unidad logística actual.
3. Documents vive solo bajo **Documents**; se vincula a cases/shipments por referencia, no por categoría operativa.

## Estado de implementación

Ver `implemented: true` en `frontend/src/config/moduleRegistry.ts`. Hoy live: **orders** (export PO, CRUD + import Excel), **shipper bookings** (export SB), **carrier bookings** (transport CB / INTTRA mock), **cases** (CRUD + timeline), **tracking** (parcial vía overview/list/vessels), **settings**, **home**.
