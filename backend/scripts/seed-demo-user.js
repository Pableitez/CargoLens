/**
 * Crea (o restablece) un usuario demo con empresa y clientes contractuales.
 *
 * Uso (desde la carpeta backend):
 *   node scripts/seed-demo-user.js
 *   npm run seed:demo
 *
 * Requiere MONGODB_URI en .env
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Company } from "../src/models/Company.js";
import { User } from "../src/models/User.js";
import { Party } from "../src/models/Party.js";
import { suggestBeCode } from "../../shared/domain/beCode.js";
import { generateClientInviteCode } from "../src/utils/clientInviteCode.js";
import { DEMO_CLIENT_CONTRACT_BY_NAME, DEMO_EXTRA_CLIENTS } from "./demoBeCodes.js";

const SALT_ROUNDS = 10;

/** Definición contractual por nombre de cliente demo. */
const DEMO_CLIENT_CONTRACT = DEMO_CLIENT_CONTRACT_BY_NAME;

/** Clientes demo por prefijo operador (solo para crear parties contractuales). */
const DEMO_CLIENT_BY_PREFIX = {
  TCKU: { clientName: "TEX Feedering — TCKU" },
  HAMU: { clientName: "Hamburg Süd Iberia" },
  FANU: { clientName: "Fan Cargo Mediterranean" },
  BSIU: { clientName: "Blue Sky Logistics" },
  ONEU: { clientName: "Ocean Network Express Spain" },
  CAAU: { clientName: "Hub CMA CGM Valencia" },
  FFAU: { clientName: "Florens pool" },
  TCNU: { clientName: "Textainer TCNU" },
  MRSU: { clientName: "Distribuidora Peninsular S.A." },
  GAOU: { clientName: "GAO Container Lines" },
  SELU: { clientName: "Seaco Iberia" },
  HASU: { clientName: "Hascon Warehousing" },
  BEAU: { clientName: "Beacon Trading" },
  SUDU: { clientName: "Sud Atlantic Lines" },
  TIIU: { clientName: "Triton Equipment Pool" },
};

const DEMO = {
  companyName: "FreightBoard Demo S.L.",
  email: "demo@naolab.local",
  password: "FreightDemo2026!",
  /** Código fijo si está libre; si choca, se genera otro. */
  preferredInvite: "DEMOFB26",
};

async function ensureInviteCode() {
  const existing = await Company.findOne({ inviteCode: DEMO.preferredInvite });
  if (!existing) return DEMO.preferredInvite;
  const crypto = await import("crypto");
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function contractForClientName(name) {
  const meta = DEMO_CLIENT_CONTRACT[name.trim()];
  if (meta) return meta;
  const code = suggestBeCode({ country: "XX", legalName: name, functionCode: "HQ" });
  return { code: code || "XXCLIENTHQ", tier: "primary" };
}

async function ensureClientInvite(preferred) {
  if (!preferred) return uniqueClientInviteCode();
  const clash = await Party.findOne({ inviteCode: preferred, accountTier: "contractual" });
  if (!clash) return preferred;
  return uniqueClientInviteCode();
}

async function uniqueClientInviteCode() {
  for (let i = 0; i < 24; i += 1) {
    const code = generateClientInviteCode();
    const clash = await Party.findOne({ inviteCode: code, accountTier: "contractual" });
    if (!clash) return code;
  }
  const crypto = await import("crypto");
  return `C${crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 7)}`;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Falta MONGODB_URI en .env");
    process.exit(1);
  }

  await mongoose.connect(uri);

  let company = await Company.findOne({ name: DEMO.companyName });
  if (!company) {
    const inviteCode = await ensureInviteCode();
    company = await Company.create({ name: DEMO.companyName, inviteCode });
  }

  const passwordHash = await bcrypt.hash(DEMO.password, SALT_ROUNDS);
  let user = await User.findOne({ email: DEMO.email });

  if (user && String(user.companyId) !== String(company._id)) {
    console.error(
      `El email ${DEMO.email} ya existe en otra empresa. Elimínalo manualmente o usa otro email en el script.`
    );
    process.exit(1);
  }

  if (!user) {
    user = await User.create({
      email: DEMO.email,
      passwordHash,
      companyId: company._id,
      displayName: "Usuario demo",
    });
  } else {
    await User.updateOne({ _id: user._id }, { $set: { passwordHash } });
  }

  await Party.deleteMany({ companyId: company._id, accountTier: "contractual" });

  const uniqueNames = [
    ...new Set([
      ...Object.values(DEMO_CLIENT_BY_PREFIX).map((m) => m.clientName.trim()),
      ...DEMO_EXTRA_CLIENTS.map((e) => e.name.trim()),
    ]),
  ];
  const clientIdByName = new Map();
  for (const name of uniqueNames) {
    const inviteCode = await uniqueClientInviteCode();
    const { code, tier } = contractForClientName(name);
    const doc = await Party.create({
      companyId: company._id,
      legalName: name,
      code,
      inviteCode,
      accountTier: "contractual",
      contractualTier: tier,
      parentPartyId: null,
    });
    clientIdByName.set(name, doc._id);
  }

  for (const extra of DEMO_EXTRA_CLIENTS) {
    const parentId = clientIdByName.get(extra.parentName);
    if (!parentId) continue;
    const inviteCode = await ensureClientInvite(extra.preferredInvite);
    const doc = await Party.create({
      companyId: company._id,
      legalName: extra.name,
      code: extra.code,
      inviteCode,
      accountTier: "contractual",
      contractualTier: extra.tier,
      parentPartyId: parentId,
    });
    clientIdByName.set(extra.name, doc._id);
  }

  const freshCompany = await Company.findById(company._id).lean();

  console.log("");
  console.log("=== FreightBoard — demo seed OK ===");
  console.log("");
  console.log("Credenciales:");
  console.log(`  Email:    ${DEMO.email}`);
  console.log(`  Password: ${DEMO.password}`);
  console.log("");
  console.log("Empresa:");
  console.log(`  Nombre:       ${freshCompany.name}`);
  console.log(`  Código invitación: ${freshCompany.inviteCode}`);
  console.log("");
  console.log(`Clientes contractuales: ${clientIdByName.size} (con código y tipo primary/subsidiary)`);
  console.log("");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
