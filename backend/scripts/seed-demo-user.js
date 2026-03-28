/**
 * Crea (o restablece) un usuario demo con empresa y contenedores guardados.
 * Los números deben ser ISO 6346 válidos; la respuesta de tracking en vivo
 * depende de que el operador publique datos (o del modo mock sin API).
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
import { Client } from "../src/models/Client.js";
import { SavedContainer } from "../src/models/SavedContainer.js";
import { generateClientInviteCode } from "../src/utils/clientInviteCode.js";

const SALT_ROUNDS = 10;

/** Base de contenedores demo (orden fijo). Cliente/notas coherentes por prefijo de operador. */
const DEMO_CONTAINER_NUMBERS = `
TCKU6566697 HAMU1937438 HAMU1321988 FANU3800338 FANU3674245 FANU1798709 FANU1819967 HAMU2069269
BSIU8100430 ONEU0827720 CAAU7951551 FFAU5714702 TCNU7335526 CAAU6236585 CAAU7773948 MRSU4973560
GAOU7142780 MRSU6759599 MRSU4584320 MRSU3435683 GAOU7157970 MRSU6556713 SELU4102779 MRSU6999938
HASU4997068 MRSU7055932 MRSU7053457 MRSU5579550 MRSU3203076 CAAU9004557 MRSU4298667 MRSU5466575
MRSU6121480 MRSU5412352 TCKU7750348 TCKU6720987 MRSU5935224 MRSU3635378 BEAU5732167 FANU1580147
SUDU6984099 MRSU6060220 CAAU6640494 HASU5126940 ONEU0620780 ONEU5200435 TIIU4728961 FFAU2290046
CAAU9282584 MRSU6650015 MRSU6657895 CAAU7175416 TIIU5220023 FFAU4800088 CAAU9018648
`
  .trim()
  .split(/\s+/)
  .filter(Boolean);

/** Nombre de cliente + nota por prefijo ISO (4 primeros caracteres). */
const DEMO_CLIENT_BY_PREFIX = {
  TCKU: {
    clientName: "TEX Feedering — TCKU",
    notes: "Pool alquiler / feedering — prefijo TCKU.",
  },
  HAMU: {
    clientName: "Hamburg Süd Iberia",
    notes: "HAMU — transpacific y temperatura.",
  },
  FANU: {
    clientName: "Fan Cargo Mediterranean",
    notes: "FANU — rutas FE–Med.",
  },
  BSIU: {
    clientName: "Blue Sky Logistics",
    notes: "BSIU — línea dedicada.",
  },
  ONEU: {
    clientName: "Ocean Network Express Spain",
    notes: "ONEU — Asia–Europa.",
  },
  CAAU: {
    clientName: "Hub CMA CGM Valencia",
    notes: "CAAU — importación consolidada.",
  },
  FFAU: {
    clientName: "Florens pool",
    notes: "FFAU — equipamiento pool genérico.",
  },
  TCNU: {
    clientName: "Textainer TCNU",
    notes: "TCNU — pool textil / dry.",
  },
  MRSU: {
    clientName: "Distribuidora Peninsular S.A.",
    notes: "MRSU — mayor volumen demo; rutas peninsulares.",
  },
  GAOU: {
    clientName: "GAO Container Lines",
    notes: "GAOU — corto recorrido.",
  },
  SELU: {
    clientName: "Seaco Iberia",
    notes: "SELU — pool Seaco.",
  },
  HASU: {
    clientName: "Hascon Warehousing",
    notes: "HASU — almacén y última milla.",
  },
  BEAU: {
    clientName: "Beacon Trading",
    notes: "BEAU — importación UK / North Sea.",
  },
  SUDU: {
    clientName: "Sud Atlantic Lines",
    notes: "SUDU — transatlántico.",
  },
  TIIU: {
    clientName: "Triton Equipment Pool",
    notes: "TIIU — pool Triton.",
  },
};

function demoRowForNumber(containerNumber) {
  const upper = containerNumber.toUpperCase();
  const prefix = upper.slice(0, 4);
  const meta = DEMO_CLIENT_BY_PREFIX[prefix] ?? {
    clientName: "Cliente demo",
    notes: `Prefijo ${prefix} — contenedor base demo.`,
  };
  return {
    containerNumber: upper,
    clientName: meta.clientName,
    notes: meta.notes,
  };
}

const DEMO = {
  companyName: "FreightBoard Demo S.L.",
  email: "demo@freightboard.local",
  password: "FreightDemo2026!",
  /** Código fijo si está libre; si choca, se genera otro. */
  preferredInvite: "DEMOFB26",
  containers: DEMO_CONTAINER_NUMBERS.map(demoRowForNumber),
};

async function ensureInviteCode() {
  const existing = await Company.findOne({ inviteCode: DEMO.preferredInvite });
  if (!existing) return DEMO.preferredInvite;
  const crypto = await import("crypto");
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function uniqueClientInviteCode() {
  for (let i = 0; i < 24; i += 1) {
    const code = generateClientInviteCode();
    const clash = await Client.findOne({ inviteCode: code });
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

  await SavedContainer.updateMany({ entrySource: "api" }, { $set: { entrySource: "manual" } });

  await SavedContainer.deleteMany({ companyId: company._id });
  await Client.deleteMany({ companyId: company._id });

  const uniqueNames = [...new Set(DEMO.containers.map((c) => c.clientName.trim()).filter(Boolean))];
  const clientIdByName = new Map();
  for (const name of uniqueNames) {
    const inviteCode = await uniqueClientInviteCode();
    const doc = await Client.create({ companyId: company._id, name, inviteCode });
    clientIdByName.set(name, doc._id);
  }

  const rows = DEMO.containers.map((c) => {
    const name = c.clientName.trim();
    const clientId = clientIdByName.get(name) ?? null;
    return {
      companyId: company._id,
      containerNumber: c.containerNumber.toUpperCase(),
      clientId,
      clientName: c.clientName,
      notes: c.notes,
      entrySource: "seed",
    };
  });

  await SavedContainer.insertMany(rows);

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
  console.log(`Clientes (entidad Client, visibles en lista y desplegables): ${uniqueNames.length}`);
  console.log(`Contenedores guardados: ${DEMO.containers.length} (tracking en vivo si hay SAFECUBE_API_KEY).`);
  for (const c of DEMO.containers) {
    console.log(`  • ${c.containerNumber}  →  ${c.clientName}`);
  }
  console.log("");
  console.log(
    "Nota: sin clave API el backend sirve datos mock deterministas; con clave, depende del operador."
  );
  console.log("");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
