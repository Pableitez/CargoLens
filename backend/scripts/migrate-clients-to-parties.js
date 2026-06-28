/**
 * Migra documentos Client → Party (accountTier: contractual) conservando _id.
 * Actualiza referencias clientId → contractualPartyId en colecciones enlazadas.
 *
 * Uso: node scripts/migrate-clients-to-parties.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import { Client } from "../src/models/Client.js";
import { Party } from "../src/models/Party.js";
import { SupplyChain } from "../src/models/SupplyChain.js";
import { Order } from "../src/models/Order.js";
import { Conversation } from "../src/models/Conversation.js";

async function migrateCollection(db, fromField, toField) {
  const col = db.collection(
    fromField === "clientId" && toField === "contractualPartyId"
      ? fromField.includes("Order")
        ? "orders"
        : fromField
      : null
  );
  void col;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Falta MONGODB_URI");
    process.exit(1);
  }
  await mongoose.connect(uri);

  const clients = await Client.find({}).lean();
  console.log(`Migrating ${clients.length} client(s) to contractual parties…`);

  for (const client of clients) {
    const existing = await Party.findById(client._id).lean();
    if (!existing) {
      await Party.create({
        _id: client._id,
        companyId: client.companyId,
        code: client.code || `CLI-${String(client._id).slice(-6)}`.toUpperCase(),
        legalName: client.name,
        accountTier: "contractual",
        contractualTier: client.contractualTier ?? "primary",
        parentPartyId: client.parentClientId ?? null,
        inviteCode: client.inviteCode ?? "",
        country: "",
        city: "",
        address: "",
        notes: "Migrated from Client collection.",
      });
      console.log(`  Created party ${client.code || client.name}`);
    } else if ((existing.accountTier ?? "operational") !== "contractual") {
      await Party.updateOne(
        { _id: client._id },
        {
          $set: {
            accountTier: "contractual",
            contractualTier: client.contractualTier ?? existing.contractualTier ?? "primary",
            parentPartyId: client.parentClientId ?? existing.parentPartyId ?? null,
            inviteCode: client.inviteCode || existing.inviteCode || "",
            legalName: existing.legalName || client.name,
          },
        }
      );
      console.log(`  Upgraded party ${existing.code} to contractual`);
    }
  }

  const chainResult = await SupplyChain.updateMany(
    { clientId: { $exists: true }, contractualPartyId: { $exists: false } },
    [{ $set: { contractualPartyId: "$clientId" } }]
  );
  console.log(`Supply chains: ${chainResult.modifiedCount} updated`);

  await SupplyChain.updateMany({}, { $unset: { clientId: "" } });

  const orderResult = await Order.updateMany(
    { clientId: { $exists: true }, contractualPartyId: { $exists: false } },
    [{ $set: { contractualPartyId: "$clientId" } }]
  );
  console.log(`Orders: ${orderResult.modifiedCount} updated`);
  await Order.updateMany({}, { $unset: { clientId: "" } });

  const convResult = await Conversation.updateMany(
    { clientId: { $exists: true }, contractualPartyId: { $exists: false } },
    [{ $set: { contractualPartyId: "$clientId" } }]
  );
  console.log(`Conversations: ${convResult.modifiedCount} updated`);
  await Conversation.updateMany({}, { $unset: { clientId: "" } });

  await Party.updateMany({}, { $unset: { ownerClientId: "" } });

  console.log("Done. Client collection kept for rollback — remove manually when verified.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
