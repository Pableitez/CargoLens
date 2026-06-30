/**
 * Flujos dummy end-to-end para la demo (trade setup + portal + mensajes).
 *
 * Requiere usuario demo previo:
 *   npm run seed:demo
 *   npm run seed:orders   (opcional, enlaza pedidos demo)
 *
 * Uso:
 *   npm run seed:flows
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Company } from "../src/models/Company.js";
import { User } from "../src/models/User.js";
import { Client } from "../src/models/Client.js";
import { Party } from "../src/models/Party.js";
import { Facility } from "../src/models/Facility.js";
import { SupplyChain } from "../src/models/SupplyChain.js";
import { Order } from "../src/models/Order.js";
import { ShipperBooking } from "../src/models/ShipperBooking.js";
import { CarrierBookingRequest } from "../src/models/CarrierBookingRequest.js";
import { CarrierBookingEvent } from "../src/models/CarrierBookingEvent.js";
import { Conversation } from "../src/models/Conversation.js";
import { Message } from "../src/models/Message.js";
import { generateClientInviteCode } from "../src/utils/clientInviteCode.js";
import {
  ALL_DEMO_FLOW_PARTY_CODES,
  DEMO_CLIENT_BE,
  DEMO_FACILITY_CODES,
  DEMO_LEGACY_CLIENT_CODES,
  DEMO_LEGACY_PARTY_CODE_PATTERN,
  DEMO_ORDER_CUSTOMER_CODES,
  DEMO_PARTY_BE,
} from "./demoBeCodes.js";

const SALT_ROUNDS = 10;
const DEMO_STAFF_EMAIL = "demo@naolab.local";
const DEMO_PORTAL_EMAIL = "portal.acme@naolab.local";
const DEMO_PASSWORD = "FreightDemo2026!";

const DEMO_PORTAL_PENINSULA_EMAIL = "portal.peninsula@naolab.local";

/** Nombres de pedidos demo → BE code contractual del cliente. */
const ORDER_CUSTOMER_CODES = DEMO_ORDER_CUSTOMER_CODES;

const FLOW = {
  clients: {
    acmePrimary: {
      code: DEMO_CLIENT_BE.ACME,
      name: "Acme Retail Group",
      inviteCode: "CDEMOAC1",
      tier: "primary",
    },
    acmeEs: {
      code: DEMO_CLIENT_BE.ACME_ES,
      name: "Acme Iberia S.L.",
      inviteCode: "CDEMOAC2",
      tier: "subsidiary",
      parentKey: "acmePrimary",
    },
    nordicPrimary: {
      code: DEMO_CLIENT_BE.NORDIC,
      name: "Nordic Foods AB",
      inviteCode: "CDEMONO1",
      tier: "primary",
    },
  },
  parties: [
    {
      key: "shipperVal",
      code: DEMO_PARTY_BE.SHIPPER_VAL,
      legalName: "Acme Manufacturing Valencia",
      country: "ES",
      city: "Valencia",
      address: "Polígono Fuente del Jarro, 46988",
      aliases: [{ role: "shipper", aliasCode: "SHP-VAL", source: "ERP" }],
      contacts: [
        {
          name: "Laura Méndez",
          email: "laura.mendez@acme-demo.local",
          phone: "+34 960 000 101",
          jobTitle: "Export coordinator",
          isPrimary: true,
        },
      ],
      addressBook: [
        {
          label: "registered",
          line1: "C/ Exportación 12",
          city: "Valencia",
          country: "ES",
          postalCode: "46001",
          isPrimary: true,
        },
      ],
      ownerClientKey: "acmePrimary",
    },
    {
      key: "consigneeRtm",
      code: DEMO_PARTY_BE.CONSIGNEE_RTM,
      legalName: "Rotterdam Distribution BV",
      country: "NL",
      city: "Rotterdam",
      address: "Harbour Lane 8, 3011 AA",
      aliases: [{ role: "consignee", aliasCode: "CON-RTM", source: "WMS" }],
      contacts: [
        {
          name: "Pieter van Dijk",
          email: "p.vandijk@rtm-demo.local",
          phone: "+31 10 000 202",
          jobTitle: "Import manager",
          isPrimary: true,
        },
      ],
      ownerClientKey: "acmePrimary",
    },
    {
      key: "forwarder",
      code: DEMO_PARTY_BE.FORWARDER,
      legalName: "FreightBoard Demo Forwarder",
      country: "ES",
      city: "Madrid",
      aliases: [{ role: "forwarder", aliasCode: "FWD-DEMO", source: "Internal" }],
      ownerClientKey: "acmePrimary",
    },
    {
      key: "buyerNyc",
      code: DEMO_PARTY_BE.BUYER_NYC,
      legalName: "Atlantic Grocery NYC",
      country: "US",
      city: "New York",
      aliases: [{ role: "buyer", aliasCode: "BUY-NYC", source: "CRM" }],
      ownerClientKey: "nordicPrimary",
    },
    {
      key: "consigneeNyc",
      code: DEMO_PARTY_BE.CONSIGNEE_NYC,
      legalName: "Atlantic Grocery Receiving",
      country: "US",
      city: "New York",
      aliases: [{ role: "consignee", aliasCode: "CON-NYC", source: "WMS" }],
      ownerClientKey: "nordicPrimary",
    },
  ],
  chains: [
    {
      key: "euExport",
      code: "DEMO-EU-EXP",
      name: "Valencia → Rotterdam export",
      clientKey: "acmePrimary",
      primaryPartyKey: "shipperVal",
      direction: "export",
      primaryRole: "shipper",
      defaultIncoterm: "FOB",
      defaultTransportMode: "ocean",
      defaultPortOfLoading: "ESVLC",
      defaultPortOfDischarge: "NLRTM",
      nodes: [{ partyKey: "consigneeRtm", role: "consignee" }],
    },
    {
      key: "usImport",
      code: "DEMO-US-IMP",
      name: "Nordic → New York import",
      clientKey: "nordicPrimary",
      primaryPartyKey: "consigneeNyc",
      direction: "import",
      primaryRole: "consignee",
      defaultIncoterm: "CIF",
      defaultTransportMode: "ocean",
      defaultPortOfLoading: "SEGOT",
      defaultPortOfDischarge: "USNYC",
    },
  ],
  facilities: [
    {
      key: "vlcWh",
      code: "ESVALWHS",
      name: "Valencia export warehouse",
      facilityType: "warehouse",
      line1: "Polígono Fuente del Jarro",
      city: "Valencia",
      country: "ES",
    },
    {
      key: "rtmDc",
      code: "NLRTMDCX",
      name: "Rotterdam distribution centre",
      facilityType: "warehouse",
      line1: "Harbour Lane 8",
      city: "Rotterdam",
      country: "NL",
    },
    {
      key: "nycStore",
      code: "USNYCOFC",
      name: "Atlantic Grocery NYC store",
      facilityType: "office",
      city: "New York",
      country: "US",
    },
  ],
  partyFacilityLinks: [
    { partyKey: "penShipper", links: [{ facilityKey: "vlcWh", purpose: "ships_from" }] },
    { partyKey: "penConsignee", links: [{ facilityKey: "rtmDc", purpose: "receives_at" }] },
    { partyKey: "buyerNyc", links: [{ facilityKey: "nycStore", purpose: "operates" }] },
  ],
  /** Related parties on chain primary hubs — members of each supply chain. */
  partyRelatedLinks: [
    {
      partyKey: "shipperVal",
      links: [
        { relatedPartyKey: "consigneeRtm", relationshipType: "affiliate" },
        { relatedPartyKey: "forwarder", relationshipType: "agent" },
      ],
    },
    {
      partyKey: "consigneeNyc",
      links: [
        { relatedPartyKey: "buyerNyc", relationshipType: "parent" },
        { relatedPartyKey: "forwarder", relationshipType: "agent" },
      ],
    },
    {
      partyKey: "penShipper",
      links: [
        { relatedPartyKey: "penConsignee", relationshipType: "affiliate" },
        { relatedPartyKey: "forwarder", relationshipType: "agent" },
      ],
    },
  ],
  peninsulaParties: [
    {
      key: "penShipper",
      code: DEMO_PARTY_BE.PEN_SHIPPER,
      legalName: "Valencia Warehouse",
      country: "ES",
      city: "Valencia",
      aliases: [{ role: "shipper", aliasCode: "PEN-SHP", source: "WMS" }],
      ownerClientCode: DEMO_CLIENT_BE.PENINSULA,
    },
    {
      key: "penConsignee",
      code: DEMO_PARTY_BE.PEN_CONSIGNEE,
      legalName: "Rotterdam DC",
      country: "NL",
      city: "Rotterdam",
      aliases: [{ role: "consignee", aliasCode: "PEN-CON", source: "ERP" }],
      ownerClientCode: DEMO_CLIENT_BE.PENINSULA,
    },
  ],
  peninsulaChain: {
    code: "DEMO-PEN-EXP",
    name: "Península Valencia → Rotterdam",
    clientCode: DEMO_CLIENT_BE.PENINSULA,
    primaryPartyKey: "penShipper",
    direction: "export",
    primaryRole: "shipper",
    defaultIncoterm: "FOB",
    defaultTransportMode: "ocean",
    defaultPortOfLoading: "ESVLC",
    defaultPortOfDischarge: "NLRTM",
    nodes: [{ partyKey: "penConsignee", role: "consignee" }],
  },
  acmeOrder: {
    orderNumber: "ORD-DEMO-2026-005",
    externalBusinessId: "ERP-ACME-01",
    customer: "Acme Retail Group",
    shipper: "Acme Manufacturing Valencia",
    consignee: "Rotterdam Distribution BV",
    shippingWindowStart: "2026-07-10",
    shippingWindowEnd: "2026-07-25",
    transportMode: "ocean",
    placeOfReceipt: "Valencia",
    portOfLoading: "ESVLC",
    portOfDischarge: "NLRTM",
    placeOfDelivery: "Rotterdam",
    incoterm: "FOB",
    status: "booked",
    notes: `Pedido demo Acme — ${DEMO_CLIENT_BE.ACME} + DEMO-EU-EXP.`,
    lines: [
      {
        lineKey: "LINE-100",
        sku: "SKU-ACME-01",
        description: "Acme retail mix",
        quantity: 200,
        uom: "ctn",
        countryOfOrigin: "ES",
        totalGrossWeight: 800,
        totalCbm: 4.2,
      },
    ],
  },
  booking: {
    bookingReference: "SB-DEMO-2026-001",
    customer: "Acme Retail Group",
    shipper: "Acme Manufacturing Valencia",
    consignee: "Rotterdam Distribution BV",
    status: "confirmed",
    transportMode: "ocean",
    portOfLoading: "ESVLC",
    portOfDischarge: "NLRTM",
    incoterm: "FOB",
    lines: [
      {
        lineKey: "SB-LINE-001",
        orderNumber: "ORD-DEMO-2026-005",
        sku: "SKU-WIDGET-A",
        bookedQuantity: 120,
        quantityUnit: "pcs",
        description: "Industrial widget A",
      },
    ],
  },
  carrierBookingDraft: {
    requestReference: "CB-DEMO-2026-001",
    carrierScac: "MAEU",
    carrierName: "Maersk",
    status: "draft",
    provider: "inttra",
    environment: "mock",
    serviceType: "FCL",
    freightPaymentTerms: "prepaid",
    portOfLoading: "ESVLC",
    portOfDischarge: "NLRTM",
    equipment: [{ quantity: 1, equipmentType: "20GP", weightKg: 18000, volumeCbm: 28, shipperOwned: false }],
  },
  peninsulaMessages: [
    {
      senderKind: "staff",
      body: "Buenos días — ¿confirmáis los contenedores MRSU asignados a la cuenta PENINSULA?",
    },
    {
      senderKind: "client_portal",
      body: "Confirmado. La filial Canarias (PENINSULA-CAN) aún no tiene contenedores; usad el primary.",
    },
  ],
  messages: [
    {
      senderKind: "staff",
      body: "Hola — hemos activado vuestra cadena DEMO-EU-EXP. ¿Confirmáis ventana de carga 1–15 julio?",
    },
    {
      senderKind: "client_portal",
      body: "Sí, ventana confirmada. Adjuntaremos packing list la semana que viene.",
    },
    {
      senderKind: "staff",
      body: `Perfecto. Recordad que el BE code contractual es ${DEMO_CLIENT_BE.ACME} y la cadena DEMO-EU-EXP.`,
    },
  ],
};

async function ensureInviteCode(preferred) {
  const clash = await Party.findOne({ inviteCode: preferred, accountTier: "contractual" });
  if (!clash) return preferred;
  return generateClientInviteCode();
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Migra clientes legacy del seed:demo a parties contractuales y enriquece códigos. */
async function enrichLegacyClients(companyId) {
  const LEGACY = {
    "Distribuidora Peninsular S.A.": { code: DEMO_CLIENT_BE.PENINSULA, tier: "primary" },
    "Ocean Network Express Spain": { code: DEMO_CLIENT_BE.ONE_ES, tier: "primary" },
    "Hub CMA CGM Valencia": { code: DEMO_CLIENT_BE.CMA_VAL, tier: "primary" },
    "Hamburg Süd Iberia": { code: DEMO_CLIENT_BE.HAM_SUD, tier: "primary" },
    "Fan Cargo Mediterranean": { code: DEMO_CLIENT_BE.FAN_MED, tier: "primary" },
    "Blue Sky Logistics": { code: DEMO_CLIENT_BE.BSKY, tier: "primary" },
    "TEX Feedering — TCKU": { code: DEMO_CLIENT_BE.TEX_TCKU, tier: "primary" },
    "Florens pool": { code: DEMO_CLIENT_BE.FLORENS, tier: "primary" },
    "Textainer TCNU": { code: DEMO_CLIENT_BE.TEXT_TNU, tier: "primary" },
    "GAO Container Lines": { code: DEMO_CLIENT_BE.GAO_CL, tier: "primary" },
    "Seaco Iberia": { code: DEMO_CLIENT_BE.SEACO_ES, tier: "primary" },
    "Hascon Warehousing": { code: DEMO_CLIENT_BE.HASCON, tier: "primary" },
    "Beacon Trading": { code: DEMO_CLIENT_BE.BEACON, tier: "primary" },
    "Sud Atlantic Lines": { code: DEMO_CLIENT_BE.SUD_ATL, tier: "primary" },
    "Triton Equipment Pool": { code: DEMO_CLIENT_BE.TRITON, tier: "primary" },
    "Cliente demo": { code: DEMO_CLIENT_BE.CLI_DEMO, tier: "primary" },
    "Distribuidora Peninsular — Canarias": {
      code: DEMO_CLIENT_BE.PENINSULA_CAN,
      tier: "subsidiary",
      parentCode: DEMO_CLIENT_BE.PENINSULA,
    },
  };

  let updated = 0;
  const byCode = new Map();

  for (const legacy of await Client.find({ companyId })) {
    let party = await Party.findById(legacy._id);
    if (!party) {
      party = await Party.create({
        _id: legacy._id,
        companyId,
        code: legacy.code || `LEG-${String(legacy._id).slice(-6)}`.toUpperCase(),
        legalName: legacy.name,
        accountTier: "contractual",
        contractualTier: legacy.contractualTier ?? "primary",
        parentPartyId: legacy.parentClientId ?? null,
        inviteCode: legacy.inviteCode ?? "",
      });
      updated += 1;
    }
    if (party.code) byCode.set(party.code, party._id);
  }

  for (const doc of await Party.find({ companyId, accountTier: "contractual" })) {
    const meta = LEGACY[doc.legalName];
    if (!meta) continue;
    const patch = {};
    const legacyCode = doc.code && DEMO_LEGACY_CLIENT_CODES.includes(doc.code);
    if (!doc.code || legacyCode) patch.code = meta.code;
    if (!doc.contractualTier || doc.contractualTier === "primary") {
      if (meta.tier) patch.contractualTier = meta.tier;
    }
    if (meta.parentCode && !doc.parentPartyId) {
      const parentId = byCode.get(meta.parentCode);
      if (parentId) {
        patch.parentPartyId = parentId;
        patch.contractualTier = "subsidiary";
      }
    }
    if (Object.keys(patch).length === 0) continue;
    await Party.updateOne({ _id: doc._id }, { $set: patch });
    if (patch.code) byCode.set(patch.code, doc._id);
    updated += 1;
    console.log(`  Client party enriquecida: ${doc.legalName} → ${patch.code ?? doc.code}`);
  }

  const peninsula = await Party.findOne({
    companyId,
    accountTier: "contractual",
    code: DEMO_CLIENT_BE.PENINSULA,
  });
  const canary = await Party.findOne({
    companyId,
    accountTier: "contractual",
    code: DEMO_CLIENT_BE.PENINSULA_CAN,
  });
  if (peninsula && !canary) {
    const inviteCode = await ensureInviteCode("CDEMOPC1");
    const sub = await Party.create({
      companyId,
      code: DEMO_CLIENT_BE.PENINSULA_CAN,
      legalName: "Distribuidora Peninsular — Canarias",
      inviteCode,
      accountTier: "contractual",
      contractualTier: "subsidiary",
      parentPartyId: peninsula._id,
    });
    byCode.set(sub.code, sub._id);
    updated += 1;
    console.log(`  Filial creada: ${sub.code} — ${sub.legalName}`);
  }

  return { updated, clientIdByCode: byCode };
}

async function linkDemoOrders(companyId, clientIdByCode) {
  const orders = await Order.find({
    companyId,
    orderNumber: { $regex: /^ORD-DEMO-/ },
  });

  let linked = 0;
  for (const order of orders) {
    const code = ORDER_CUSTOMER_CODES[order.customer];
    const clientId = code ? clientIdByCode.get(code) : null;
    if (!clientId) continue;
    await Order.updateOne({ _id: order._id }, { $set: { contractualPartyId: clientId } });
    linked += 1;
    console.log(`  Pedido ${order.orderNumber} → cliente ${code}`);
  }
  return linked;
}

async function seedConversationThread({
  companyId,
  staff,
  clientId,
  subject,
  messages,
  portalUser,
  externalEmail,
}) {
  const existing = await Conversation.findOne({ companyId, contractualPartyId: clientId });
  if (existing) {
    await Message.deleteMany({ conversationId: existing._id });
    await Conversation.deleteOne({ _id: existing._id });
  }

  const conversation = await Conversation.create({
    companyId,
    contractualPartyId: clientId,
    kind: "client_account",
    subject,
    lastMessageAt: new Date(),
    lastMessagePreview: messages.at(-1)?.body.slice(0, 120) ?? "",
    externalParticipants: externalEmail
      ? [{ email: externalEmail, name: "Contacto externo demo", addedByUserId: staff._id }]
      : [],
  });

  for (const msg of messages) {
    const isPortal = msg.senderKind === "client_portal";
    await Message.create({
      companyId,
      conversationId: conversation._id,
      senderUserId: isPortal && portalUser ? portalUser._id : staff._id,
      senderKind: msg.senderKind,
      senderDisplayName: isPortal
        ? portalUser?.displayName || "Portal cliente"
        : staff.displayName || "Staff demo",
      senderEmail: isPortal ? portalUser?.email || "" : staff.email,
      body: msg.body,
    });
  }
}

async function cleanupFlowData(companyId) {
  const demoContractual = await Party.find({
    companyId,
    accountTier: "contractual",
    $or: [{ code: DEMO_LEGACY_PARTY_CODE_PATTERN }, { code: { $in: ALL_DEMO_FLOW_PARTY_CODES } }],
  }).select("_id code");
  const demoClientIds = demoContractual.map((c) => c._id);

  const demoParties = await Party.find({
    companyId,
    $or: [{ code: DEMO_LEGACY_PARTY_CODE_PATTERN }, { code: { $in: ALL_DEMO_FLOW_PARTY_CODES } }],
  }).select("_id");
  const demoPartyIds = demoParties.map((p) => p._id);

  const demoChains = await SupplyChain.find({ companyId, code: { $regex: /^DEMO-/ } }).select("_id");
  const demoChainIds = demoChains.map((c) => c._id);

  const peninsulaClient = await Party.findOne({
    companyId,
    accountTier: "contractual",
    code: DEMO_CLIENT_BE.PENINSULA,
  }).select("_id");
  const convClientIds = [...demoClientIds];
  if (peninsulaClient) convClientIds.push(peninsulaClient._id);

  const convs = await Conversation.find({
    companyId,
    contractualPartyId: { $in: convClientIds },
  }).select("_id");
  const convIds = convs.map((c) => c._id);

  await Message.deleteMany({ companyId, conversationId: { $in: convIds } });
  await Conversation.deleteMany({ _id: { $in: convIds } });
  await User.deleteMany({ email: { $in: [DEMO_PORTAL_EMAIL, DEMO_PORTAL_PENINSULA_EMAIL] } });
  await Order.deleteMany({ companyId, orderNumber: FLOW.acmeOrder.orderNumber });
  await ShipperBooking.deleteMany({ companyId, bookingReference: FLOW.booking.bookingReference });
  await CarrierBookingEvent.deleteMany({ companyId });
  await CarrierBookingRequest.deleteMany({
    companyId,
    requestReference: FLOW.carrierBookingDraft.requestReference,
  });
  await SupplyChain.deleteMany({ _id: { $in: demoChainIds } });
  await Facility.deleteMany({
    companyId,
    $or: [
      { code: { $regex: /^DEMO-FAC-/ } },
      { code: { $in: DEMO_FACILITY_CODES } },
      { code: { $in: ["ESVALEW", "NLRTMDC", "USNYCST"] } },
    ],
  });
  await Party.deleteMany({ _id: { $in: demoPartyIds } });

  if (demoClientIds.length > 0) {
    await Order.updateMany(
      { companyId, contractualPartyId: { $in: demoClientIds } },
      {
        $set: {
          contractualPartyId: null,
          supplyChainId: null,
          operatingShipperPartyId: null,
          operatingConsigneePartyId: null,
        },
      }
    );
  }

  if (demoChainIds.length > 0) {
    await Order.updateMany(
      { companyId, supplyChainId: { $in: demoChainIds } },
      {
        $set: {
          supplyChainId: null,
          operatingShipperPartyId: null,
          operatingConsigneePartyId: null,
        },
      }
    );
  }
}

async function syncLegacyConversationIndexes() {
  await Conversation.deleteMany({
    $or: [{ contractualPartyId: null }, { contractualPartyId: { $exists: false } }],
  });

  const indexes = await Conversation.collection.indexes();
  for (const idx of indexes) {
    if (Object.prototype.hasOwnProperty.call(idx.key ?? {}, "clientId")) {
      await Conversation.collection.dropIndex(idx.name).catch(() => {});
    }
  }
  await Conversation.syncIndexes();
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Falta MONGODB_URI en .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  await syncLegacyConversationIndexes();

  const staff = await User.findOne({ email: DEMO_STAFF_EMAIL });
  if (!staff) {
    console.error(`No existe ${DEMO_STAFF_EMAIL}. Ejecuta: npm run seed:demo`);
    process.exit(1);
  }

  const companyId = staff.companyId;
  const company = await Company.findById(companyId).lean();
  if (!company) {
    console.error("Empresa demo no encontrada.");
    process.exit(1);
  }

  console.log("Limpiando flujos demo anteriores (prefijo DEMO-)…");
  await cleanupFlowData(companyId);

  console.log("Enriqueciendo clientes del seed:demo (códigos contractuales)…");
  const { updated: clientsEnriched, clientIdByCode: legacyByCode } = await enrichLegacyClients(companyId);
  if (clientsEnriched === 0) {
    console.log("  (Todos los clientes ya tenían código — o ejecuta npm run seed:demo)");
  }

  console.log("Creando client parties (contractual) DEMO-…");
  const clientIds = {};
  const clientIdByCode = new Map(legacyByCode);

  for (const [key, row] of Object.entries(FLOW.clients)) {
    const inviteCode = await ensureInviteCode(row.inviteCode);
    const parentPartyId = row.parentKey && clientIds[row.parentKey] ? clientIds[row.parentKey] : null;

    const doc = await Party.create({
      companyId,
      code: row.code,
      legalName: row.name,
      inviteCode,
      accountTier: "contractual",
      contractualTier: row.tier,
      parentPartyId: row.tier === "subsidiary" ? parentPartyId : null,
      country: "",
      city: "",
      notes: "Dummy flow — client party.",
    });
    clientIds[key] = doc._id;
    clientIdByCode.set(row.code, doc._id);
    console.log(`  Client party ${row.code} — ${row.name} (invite ${inviteCode})`);
  }

  const peninsulaClientId = clientIdByCode.get(DEMO_CLIENT_BE.PENINSULA) ?? null;

  console.log("Creando parties operativas DEMO-…");
  const partyIds = { ...clientIds };
  for (const row of FLOW.parties) {
    const doc = await Party.create({
      companyId,
      code: row.code,
      legalName: row.legalName,
      country: row.country ?? "",
      city: row.city ?? "",
      address: row.address ?? "",
      notes: "Dummy flow — trade master seed.",
      aliases: row.aliases ?? [],
      contacts: row.contacts ?? [],
      addressBook: row.addressBook ?? [],
      accountTier: "operational",
    });
    partyIds[row.key] = doc._id;
    console.log(`  Party ${row.code} — ${row.legalName}`);
  }

  for (const row of FLOW.peninsulaParties) {
    const doc = await Party.create({
      companyId,
      code: row.code,
      legalName: row.legalName,
      country: row.country ?? "",
      city: row.city ?? "",
      address: "",
      notes: "Dummy flow — cadena Península.",
      aliases: row.aliases ?? [],
      contacts: [],
      addressBook: [],
      accountTier: "operational",
    });
    partyIds[row.key] = doc._id;
    console.log(`  Party ${row.code} — ${row.legalName} (PENINSULA)`);
  }

  for (const row of FLOW.partyRelatedLinks ?? []) {
    const partyId = partyIds[row.partyKey];
    if (!partyId) continue;
    const relatedParties = row.links
      .map((link) => ({
        relatedPartyId: partyIds[link.relatedPartyKey],
        relationshipType: link.relationshipType,
        notes: "",
      }))
      .filter((r) => r.relatedPartyId);
    await Party.updateOne({ _id: partyId }, { $set: { relatedParties } });
    console.log(`  Related parties on ${row.partyKey} (${relatedParties.length} links)`);
  }

  const facilityIds = {};
  for (const row of FLOW.facilities ?? []) {
    const doc = await Facility.create({
      companyId,
      code: row.code,
      name: row.name,
      facilityType: row.facilityType ?? "warehouse",
      line1: row.line1 ?? "",
      city: row.city ?? "",
      country: row.country ?? "",
      notes: row.notes ?? "Dummy flow facility.",
    });
    facilityIds[row.key] = doc._id;
    console.log(`  Facility ${row.code} — ${row.name}`);
  }

  for (const row of FLOW.partyFacilityLinks ?? []) {
    const partyId = partyIds[row.partyKey];
    if (!partyId) continue;
    const relatedFacilities = row.links
      .map((link) => ({
        facilityId: facilityIds[link.facilityKey],
        purpose: link.purpose ?? "operates",
        notes: "",
        isPrimary: Boolean(link.isPrimary),
      }))
      .filter((r) => r.facilityId);
    await Party.updateOne({ _id: partyId }, { $set: { relatedFacilities } });
    console.log(`  Related facilities on ${row.partyKey} (${relatedFacilities.length} links)`);
  }

  const chainIds = {};
  for (const row of FLOW.chains) {
    const contractualPartyId = clientIds[row.clientKey];
    const primaryPartyId = partyIds[row.primaryPartyKey];
    const doc = await SupplyChain.create({
      companyId,
      contractualPartyId,
      primaryPartyId,
      code: row.code,
      name: row.name,
      direction: row.direction,
      primaryRole: row.primaryRole,
      defaultIncoterm: row.defaultIncoterm ?? "",
      defaultTransportMode: row.defaultTransportMode ?? "",
      defaultPortOfLoading: row.defaultPortOfLoading ?? "",
      defaultPortOfDischarge: row.defaultPortOfDischarge ?? "",
      nodes: (row.nodes ?? [])
        .map((node) => ({
          partyId: partyIds[node.partyKey],
          role: node.role,
        }))
        .filter((node) => node.partyId),
    });
    chainIds[row.key] = doc._id;
    console.log(`  Cadena ${row.code} — ${row.name} (primary ${row.primaryPartyKey})`);
  }

  if (peninsulaClientId) {
    const pen = FLOW.peninsulaChain;
    const penChain = await SupplyChain.create({
      companyId,
      contractualPartyId: peninsulaClientId,
      primaryPartyId: partyIds[pen.primaryPartyKey],
      code: pen.code,
      name: pen.name,
      direction: pen.direction,
      primaryRole: pen.primaryRole,
      defaultIncoterm: pen.defaultIncoterm ?? "",
      defaultTransportMode: pen.defaultTransportMode ?? "",
      defaultPortOfLoading: pen.defaultPortOfLoading ?? "",
      defaultPortOfDischarge: pen.defaultPortOfDischarge ?? "",
      nodes: (pen.nodes ?? [])
        .map((node) => ({
          partyId: partyIds[node.partyKey],
          role: node.role,
        }))
        .filter((node) => node.partyId),
    });
    chainIds.penExport = penChain._id;
    console.log(`  Cadena ${pen.code} — ${pen.name} (primary ${pen.primaryPartyKey})`);
  }

  const portalHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  const portalAcme = await User.findOneAndUpdate(
    { email: DEMO_PORTAL_EMAIL },
    {
      $set: {
        passwordHash: portalHash,
        companyId,
        clientId: clientIds.acmePrimary,
        displayName: "Acme Portal User",
      },
    },
    { upsert: true, new: true }
  );
  console.log(`  Portal Acme: ${DEMO_PORTAL_EMAIL}`);

  let portalPeninsula = null;
  if (peninsulaClientId) {
    portalPeninsula = await User.findOneAndUpdate(
      { email: DEMO_PORTAL_PENINSULA_EMAIL },
      {
        $set: {
          passwordHash: portalHash,
          companyId,
          clientId: peninsulaClientId,
          displayName: "Península Portal User",
        },
      },
      { upsert: true, new: true }
    );
    console.log(`  Portal Península: ${DEMO_PORTAL_PENINSULA_EMAIL}`);
  }

  await seedConversationThread({
    companyId,
    staff,
    clientId: clientIds.acmePrimary,
    subject: "Coordinación export DEMO-EU-EXP",
    messages: FLOW.messages,
    portalUser: portalAcme,
    externalEmail: "customs.broker@demo.local",
  });
  console.log(`  Conversación Acme + ${FLOW.messages.length} mensajes`);

  if (peninsulaClientId && portalPeninsula) {
    await seedConversationThread({
      companyId,
      staff,
      clientId: peninsulaClientId,
      subject: "Contenedores MRSU — cuenta PENINSULA",
      messages: FLOW.peninsulaMessages,
      portalUser: portalPeninsula,
    });
    console.log(`  Conversación Península + ${FLOW.peninsulaMessages.length} mensajes`);
  }

  const linkedOrders = await linkDemoOrders(companyId, clientIdByCode);

  const penOrder = await Order.findOne({ companyId, orderNumber: "ORD-DEMO-2026-001" });
  if (penOrder && peninsulaClientId && chainIds.penExport) {
    await Order.updateOne(
      { _id: penOrder._id },
      {
        $set: {
          contractualPartyId: peninsulaClientId,
          supplyChainId: chainIds.penExport,
          operatingShipperPartyId: partyIds.penShipper,
          operatingConsigneePartyId: partyIds.penConsignee,
        },
      }
    );
    console.log(`  Pedido ORD-DEMO-2026-001 enlazado a ${DEMO_CLIENT_BE.PENINSULA} + DEMO-PEN-EXP`);
  }

  const acmeRow = FLOW.acmeOrder;
  const acmeOrderSet = {
    companyId,
    orderNumber: acmeRow.orderNumber,
    poNumber: acmeRow.orderNumber,
    externalBusinessId: acmeRow.externalBusinessId,
    customer: acmeRow.customer,
    shipper: acmeRow.shipper,
    consignee: acmeRow.consignee,
    shippingWindowStart: parseDate(acmeRow.shippingWindowStart),
    shippingWindowEnd: parseDate(acmeRow.shippingWindowEnd),
    transportMode: acmeRow.transportMode,
    placeOfReceipt: acmeRow.placeOfReceipt,
    portOfLoading: acmeRow.portOfLoading,
    portOfDischarge: acmeRow.portOfDischarge,
    placeOfDelivery: acmeRow.placeOfDelivery,
    incoterm: acmeRow.incoterm,
    status: acmeRow.status,
    notes: acmeRow.notes,
    lines: acmeRow.lines,
    contractualPartyId: clientIds.acmePrimary,
    supplyChainId: chainIds.euExport,
    operatingShipperPartyId: partyIds.shipperVal,
    operatingConsigneePartyId: partyIds.consigneeRtm,
    updatedAt: new Date(),
  };
  await Order.collection.updateOne(
    { companyId, orderNumber: acmeRow.orderNumber },
    { $set: acmeOrderSet, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  console.log(`  Pedido ${acmeRow.orderNumber} creado (${DEMO_CLIENT_BE.ACME} + DEMO-EU-EXP)`);

  if (linkedOrders === 0) {
    console.log("  (Sin pedidos ORD-DEMO-* — ejecuta npm run seed:orders)");
  }

  await ShipperBooking.findOneAndUpdate(
    { companyId, bookingReference: FLOW.booking.bookingReference },
    {
      $set: {
        companyId,
        ...FLOW.booking,
        contractualPartyId: clientIds.acmePrimary,
        supplyChainId: chainIds.euExport,
        operatingShipperPartyId: partyIds.shipperVal,
        operatingConsigneePartyId: partyIds.consigneeRtm,
      },
    },
    { upsert: true }
  );
  console.log(`  Shipper booking ${FLOW.booking.bookingReference}`);

  const demoSb = await ShipperBooking.findOne({
    companyId,
    bookingReference: FLOW.booking.bookingReference,
  }).lean();
  const cbRow = FLOW.carrierBookingDraft;
  const demoCb = await CarrierBookingRequest.findOneAndUpdate(
    { companyId, requestReference: cbRow.requestReference },
    {
      $set: {
        companyId,
        ...cbRow,
        shipperBookingId: demoSb?._id ?? null,
        shipperBookingIds: demoSb?._id ? [demoSb._id] : [],
        shipperBookingReference: demoSb?.bookingReference ?? "",
        shipperBookingReferences: demoSb?.bookingReference ? [demoSb.bookingReference] : [],
        customer: FLOW.booking.customer,
        shipper: FLOW.booking.shipper,
        consignee: FLOW.booking.consignee,
        contractualPartyId: clientIds.acmePrimary,
        supplyChainId: chainIds.euExport,
        operatingShipperPartyId: partyIds.shipperVal,
        operatingConsigneePartyId: partyIds.consigneeRtm,
        cargoLines: FLOW.booking.lines.map((line) => ({
          sourceShipperBookingReference: FLOW.booking.bookingReference,
          lineKey: line.lineKey,
          orderNumber: line.orderNumber,
          sku: line.sku,
          bookedQuantity: line.bookedQuantity,
          quantityUnit: line.quantityUnit,
          description: line.description,
        })),
        idempotencyKey: cbRow.requestReference,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await CarrierBookingEvent.create({
    companyId,
    carrierBookingRequestId: demoCb._id,
    kind: "created",
    message: `Carrier booking ${cbRow.requestReference} created from SB ${FLOW.booking.bookingReference}`,
    actorEmail: DEMO_STAFF_EMAIL,
    visibleToClient: true,
  });
  console.log(
    `  Carrier booking draft ${cbRow.requestReference} (linked to ${FLOW.booking.bookingReference})`
  );

  const totalClients = await Party.countDocuments({ companyId, accountTier: "contractual" });

  console.log("");
  console.log("=== Flujos demo OK ===");
  console.log("");
  console.log(`Clientes en workspace: ${totalClients} (con códigos contractuales)`);
  console.log("");
  console.log("Staff:");
  console.log(`  ${DEMO_STAFF_EMAIL} / ${DEMO_PASSWORD}`);
  console.log("");
  console.log("Portales cliente:");
  console.log(`  Acme:      ${DEMO_PORTAL_EMAIL} / ${DEMO_PASSWORD}`);
  if (portalPeninsula) {
    console.log(`  Península: ${DEMO_PORTAL_PENINSULA_EMAIL} / ${DEMO_PASSWORD}`);
  }
  console.log("");
  console.log("Trade import — Acme:");
  console.log(`  contractual be_code: ${DEMO_CLIENT_BE.ACME} | supply_chain_code: DEMO-EU-EXP`);
  console.log("Trade import — Península:");
  console.log(`  contractual be_code: ${DEMO_CLIENT_BE.PENINSULA} | supply_chain_code: DEMO-PEN-EXP`);
  console.log("");
  console.log(`UI: Trade setup → parties (${DEMO_CLIENT_BE.PENINSULA}, ${DEMO_CLIENT_BE.ACME}, …)`);
  console.log("");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
