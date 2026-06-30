import mongoose from "mongoose";
import { Company } from "../models/Company.js";
import { CarrierBookingRequest } from "../models/CarrierBookingRequest.js";
import { Order } from "../models/Order.js";
import { Party } from "../models/Party.js";
import { ShipperBooking } from "../models/ShipperBooking.js";
import { SupplyChain } from "../models/SupplyChain.js";

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

  const shipperOpA = await Party.create({
    companyId: company._id,
    legalName: "Shipper A",
    code: "PORTAL-SHP-A",
    accountTier: "operational",
  });

  const consigneeOpA = await Party.create({
    companyId: company._id,
    legalName: "Consignee A",
    code: "PORTAL-CON-A",
    accountTier: "operational",
  });

  await Party.updateOne(
    { _id: clientA._id },
    {
      $set: {
        relatedParties: [
          {
            relatedPartyId: shipperOpA._id,
            relationshipType: "shipper",
            clientAlias: "PORTAL-SHP-A",
          },
          {
            relatedPartyId: consigneeOpA._id,
            relationshipType: "consignee",
            clientAlias: "PORTAL-CON-A",
          },
        ],
      },
    }
  );

  const chainA = await SupplyChain.create({
    companyId: company._id,
    contractualPartyId: clientA._id,
    primaryPartyId: shipperOpA._id,
    code: "CHAIN-PORTAL-A",
    name: "Portal A export",
    direction: "export",
    primaryRole: "shipper",
    nodes: [
      { partyId: shipperOpA._id, role: "shipper" },
      { partyId: consigneeOpA._id, role: "consignee" },
    ],
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

  const bookingA = await ShipperBooking.create({
    companyId: company._id,
    bookingReference: "SB-PORTAL-A",
    customer: "Portal Client A",
    shipper: "Shipper A",
    consignee: "Consignee A",
    contractualPartyId: clientA._id,
    operatingShipperPartyId: shipperOpA._id,
    operatingConsigneePartyId: consigneeOpA._id,
    supplyChainId: chainA._id,
    transportMode: "ocean",
    portOfLoading: "ESVLC",
    portOfDischarge: "NLRTM",
    lines: [
      { lineKey: "L1", orderNumber: "ORD-PORTAL-A", sku: "SKU-A", bookedQuantity: 2, quantityUnit: "EA" },
    ],
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

  const carrierBookingA = await CarrierBookingRequest.create({
    companyId: company._id,
    requestReference: "CB-PORTAL-A",
    shipperBookingId: bookingA._id,
    shipperBookingIds: [bookingA._id],
    shipperBookingReference: bookingA.bookingReference,
    shipperBookingReferences: [bookingA.bookingReference],
    carrierScac: "MAEU",
    carrierName: "Maersk",
    contractualPartyId: clientA._id,
    status: "submitted",
  });

  const carrierBookingB = await CarrierBookingRequest.create({
    companyId: company._id,
    requestReference: "CB-PORTAL-B",
    shipperBookingId: bookingB._id,
    shipperBookingIds: [bookingB._id],
    shipperBookingReference: bookingB.bookingReference,
    shipperBookingReferences: [bookingB.bookingReference],
    carrierScac: "MSCU",
    carrierName: "MSC",
    contractualPartyId: clientB._id,
    status: "submitted",
  });

  return {
    company,
    clientA,
    clientB,
    orderA,
    orderB,
    bookingA,
    bookingB,
    carrierBookingA,
    carrierBookingB,
    staffUserId: new mongoose.Types.ObjectId(),
    portalUserId: new mongoose.Types.ObjectId(),
  };
}
