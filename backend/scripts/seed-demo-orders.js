/**
 * Crea pedidos (Orders) demo para la empresa del usuario demo.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { Company } from "../src/models/Company.js";
import { User } from "../src/models/User.js";
import { Order } from "../src/models/Order.js";
import { OrderEvent } from "../src/models/OrderEvent.js";
import { logOrderEvent } from "../src/services/orders/orderEvents.js";

const DEMO_EMAIL = "demo@naolab.local";
const DEMO_ORDER_PREFIX = "ORD-DEMO-";

const DEMO_ORDERS = [
  {
    orderNumber: "ORD-DEMO-2026-001",
    externalBusinessId: "ERP-8842",
    customer: "Distribuidora Peninsular S.A.",
    shipper: "Valencia Warehouse",
    consignee: "Rotterdam DC",
    shippingWindowStart: "2026-07-01",
    shippingWindowEnd: "2026-07-15",
    transportMode: "ocean",
    placeOfReceipt: "Valencia",
    portOfLoading: "ESVLC",
    portOfDischarge: "NLRTM",
    placeOfDelivery: "Rotterdam",
    incoterm: "FOB",
    status: "booked",
    notes: "Order consolidado Valencia → Rotterdam.",
    lines: [
      {
        lineKey: "LINE-001",
        sku: "SKU-WIDGET-A",
        description: "Industrial widget A",
        quantity: 120,
        uom: "pcs",
        countryOfOrigin: "ES",
        totalGrossWeight: 480,
        totalCbm: 2.4,
      },
      {
        lineKey: "LINE-002",
        sku: "SKU-WIDGET-B",
        description: "Industrial widget B",
        quantity: 60,
        uom: "ctn",
        countryOfOrigin: "ES",
        totalGrossWeight: 210,
        totalCbm: 1.1,
      },
    ],
  },
  {
    orderNumber: "ORD-DEMO-2026-002",
    externalBusinessId: "ERP-9011",
    customer: "Ocean Network Express Spain",
    shipper: "Barcelona Hub",
    consignee: "New York Importer",
    shippingWindowStart: "2026-08-05",
    shippingWindowEnd: "2026-08-20",
    transportMode: "ocean",
    placeOfReceipt: "Barcelona",
    portOfLoading: "ESBCN",
    portOfDischarge: "USNYC",
    placeOfDelivery: "New York",
    incoterm: "CIF",
    status: "partially_booked",
    notes: "Transatlántico — booking parcial.",
    lines: [
      {
        lineKey: "LINE-010",
        sku: "SKU-TEXT-01",
        description: "Textile rolls",
        quantity: 48,
        uom: "roll",
        countryOfOrigin: "PT",
        totalGrossWeight: 960,
        totalCbm: 8.2,
      },
    ],
  },
  {
    orderNumber: "ORD-DEMO-2026-003",
    customer: "Hub CMA CGM Valencia",
    shipper: "Algeciras Depot",
    consignee: "Hamburg Receiver",
    status: "draft",
    notes: "Borrador — rutas pendientes.",
    lines: [
      {
        lineKey: "LINE-020",
        sku: "SKU-DRY-100",
        description: "Dry goods pallet mix",
        quantity: 24,
        uom: "plt",
      },
      {
        lineKey: "LINE-021",
        sku: "SKU-DRY-101",
        description: "Cartons assorted",
        quantity: 360,
        uom: "ctn",
        countryOfOrigin: "MA",
        totalGrossWeight: 540,
        totalCbm: 3.6,
      },
    ],
  },
  {
    orderNumber: "ORD-DEMO-2026-004",
    externalBusinessId: "ERP-7700",
    customer: "Hamburg Süd Iberia",
    shipper: "Vigo Plant",
    consignee: "Bremen DC",
    shippingWindowStart: "2026-06-01",
    shippingWindowEnd: "2026-06-15",
    transportMode: "rail",
    placeOfReceipt: "Vigo",
    portOfLoading: "ESVGO",
    portOfDischarge: "DEBRV",
    placeOfDelivery: "Bremen",
    incoterm: "DAP",
    status: "new",
    notes: "Pedido recién creado — pendiente de booking.",
    lines: [
      {
        lineKey: "LINE-030",
        sku: "SKU-CHEM-09",
        description: "Non-hazardous chemicals",
        quantity: 12,
        uom: "ibc",
        countryOfOrigin: "ES",
        totalGrossWeight: 10800,
        totalCbm: 14.4,
      },
    ],
  },
];

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Falta MONGODB_URI en .env");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const user = await User.findOne({ email: DEMO_EMAIL }).lean();
  if (!user) {
    console.error(`No existe el usuario demo (${DEMO_EMAIL}). Ejecuta antes: npm run seed:demo`);
    process.exit(1);
  }

  const company = await Company.findById(user.companyId).lean();
  if (!company) {
    console.error("Empresa demo no encontrada.");
    process.exit(1);
  }

  const companyId = company._id;
  const existing = await Order.find({
    companyId,
    $or: [{ orderNumber: { $regex: `^${DEMO_ORDER_PREFIX}` } }, { poNumber: { $regex: "^PO-DEMO-" } }],
  }).select("_id orderNumber poNumber");

  if (existing.length > 0) {
    const ids = existing.map((row) => row._id);
    await OrderEvent.deleteMany({ orderId: { $in: ids } });
    await Order.deleteMany({ _id: { $in: ids } });
    console.log(`Eliminados ${existing.length} pedidos demo anteriores.`);
  }

  let created = 0;
  for (const row of DEMO_ORDERS) {
    const doc = await Order.create({
      companyId,
      orderNumber: row.orderNumber,
      externalBusinessId: row.externalBusinessId ?? "",
      customer: row.customer,
      shipper: row.shipper,
      consignee: row.consignee,
      shippingWindowStart: parseDate(row.shippingWindowStart),
      shippingWindowEnd: parseDate(row.shippingWindowEnd),
      transportMode: row.transportMode ?? "",
      placeOfReceipt: row.placeOfReceipt ?? "",
      portOfLoading: row.portOfLoading ?? "",
      portOfDischarge: row.portOfDischarge ?? "",
      placeOfDelivery: row.placeOfDelivery ?? "",
      incoterm: row.incoterm ?? "",
      status: row.status,
      notes: row.notes ?? "",
      lines: row.lines,
    });
    await Order.collection.updateOne({ _id: doc._id }, { $set: { poNumber: row.orderNumber } });

    await logOrderEvent({
      orderId: doc._id,
      companyId,
      kind: "created",
      message: `Order created (${doc.orderNumber})`,
      actorUserId: user._id,
      actorEmail: user.email,
    });

    created += 1;
    console.log(`  • ${doc.orderNumber}  (${row.status}, ${row.lines.length} líneas)`);
  }

  console.log("");
  console.log("=== Orders demo seed OK ===");
  console.log(`Empresa: ${company.name}`);
  console.log(`Pedidos creados: ${created}`);
  console.log("");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
