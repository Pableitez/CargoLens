import mongoose from "mongoose";
import { migrateCompanyBookingCounters } from "./services/bookingCounterMigrations.js";

let connected = false;
export function isDbConnected() {
  return connected && mongoose.connection.readyState === 1;
}

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("[db] MONGODB_URI not set — auth, orders, and workspace data are disabled.");
    return false;
  }
  try {
    const maxPoolSize = Math.min(50, Math.max(5, Number(process.env.MONGODB_MAX_POOL_SIZE) || 10));
    await mongoose.connect(uri, { maxPoolSize });
    connected = true;
    try {
      await migrateCompanyBookingCounters();
    } catch (err) {
      console.error("[db] CompanyBookingCounter migration failed:", err.message);
    }
    console.log("[db] MongoDB connected");
    return true;
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    return false;
  }
}
