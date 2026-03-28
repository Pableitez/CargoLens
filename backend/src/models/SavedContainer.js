import mongoose from "mongoose";

const savedContainerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },
    containerNumber: { type: String, required: true, trim: true, uppercase: true },
    // Nombre cliente denormalizado (UI / imports antiguos).
    clientName: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    // Origen de la fila (no es “API operador” en bloque; el overview distingue live vs mock).
    entrySource: {
      type: String,
      enum: ["manual", "import", "seed", "api"],
      default: "manual",
    },
    // active | completed para listas e histórico (tracking Sinay sigue siendo bajo demanda).
    lifecycleStatus: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

savedContainerSchema.index({ companyId: 1, containerNumber: 1 }, { unique: true });

export const SavedContainer =
  mongoose.models.SavedContainer ?? mongoose.model("SavedContainer", savedContainerSchema);
