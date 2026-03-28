import mongoose from "mongoose";

let connected = false;

export function isDbConnected() {
  return connected && mongoose.connection.readyState === 1;
}

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("[db] MONGODB_URI not set — registration and saved containers are disabled.");
    return false;
  }
  try {
    const maxPoolSize = Math.min(50, Math.max(5, Number(process.env.MONGODB_MAX_POOL_SIZE) || 10));
    await mongoose.connect(uri, { maxPoolSize });
    connected = true;
    console.log("[db] MongoDB connected");
    return true;
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    return false;
  }
}
