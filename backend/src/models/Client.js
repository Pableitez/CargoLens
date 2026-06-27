import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    /** Código contractual (único por empresa) — usado en import de pedidos. */
    code: { type: String, trim: true, uppercase: true, default: "" },
    /** primary = contractual account owner; subsidiary = linked to a primary. */
    contractualTier: {
      type: String,
      enum: ["primary", "subsidiary"],
      default: "primary",
    },
    parentClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },
    // Código distinto al de empresa; prefijo C… para compartir con clientes finales.
    inviteCode: { type: String, required: true, unique: true, uppercase: true, index: true },
  },
  { timestamps: true }
);

clientSchema.index({ companyId: 1, name: 1 });
clientSchema.index(
  { companyId: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: { code: { $type: "string", $ne: "" } },
  }
);

export const Client = mongoose.models.Client ?? mongoose.model("Client", clientSchema);
