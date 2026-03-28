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
    // Código distinto al de empresa; prefijo C… para compartir con clientes finales.
    inviteCode: { type: String, required: true, unique: true, uppercase: true, index: true },
  },
  { timestamps: true }
);

clientSchema.index({ companyId: 1, name: 1 });

export const Client = mongoose.models.Client ?? mongoose.model("Client", clientSchema);
