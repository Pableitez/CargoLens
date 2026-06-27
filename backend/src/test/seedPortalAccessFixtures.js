import mongoose from "mongoose";
import { Company } from "../models/Company.js";
import { Order } from "../models/Order.js";
import { Party } from "../models/Party.js";
import { ShipperBooking } from "../models/ShipperBooking.js";

export async function seedPortalAccessFixtures() {
  const company = await Company.create({ name: "HTTP Test Co", inviteCode: "HTTPTEST" });

  const clientA = await Party.create({
    companyId: company._id,
    legalName: "Portal Client A",
    code: "PORTAL-A",
    accountTier: "contractual",
    contractualTier: "primary",
    inviteCode: "INV-PORTAL-A",
  });

  const clientB = await Party.create({
    companyId: company._id,
    legalName: "Portal Client B",
    code: "PORTAL-B",
    accountTier: "contractual",
    contractualTier: "primary",
    inviteCode: "INV-PORTAL-B",
  });

  const orderA = await Order.create({
    companyId: company._id,
    orderNumber: "ORD-PORTAL-A",
    customer: "Portal Client A",
    shipper: "Shipper A",
    consignee: "Consignee A",
    contractualPartyId: clientA._id,
    lines: [{ lineKey: "L1", sku: "SKU-A", quantity: 10, uom: "EA" }],
  });

  const orderB = await Order.create({
    companyId: company._id,
    orderNumber: "ORD-PORTAL-B",
    customer: "Portal Client B",
    shipper: "Shipper B",
    consignee: "Consignee B",
    contractualPartyId: clientB._id,
    lines: [{ lineKey: "L1", sku: "SKU-B", quantity: 5, uom: "EA" }],
  });

  const bookingB = await ShipperBooking.create({
    companyId: company._id,
    bookingReference: "SB-PORTAL-B",
    customer: "Portal Client B",
    shipper: "Shipper B",
    consignee: "Consignee B",
    contractualPartyId: clientB._id,
    lines: [
      { lineKey: "L1", orderNumber: "ORD-PORTAL-B", sku: "SKU-B", bookedQuantity: 2, quantityUnit: "EA" },
    ],
  });

  return {
    company,
    clientA,
    clientB,
    orderA,
    orderB,
    bookingB,
    staffUserId: new mongoose.Types.ObjectId(),
    portalUserId: new mongoose.Types.ObjectId(),
  };
}
