import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { connectDb } from "../db.js";

let mongod;

export async function startMemoryDb() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = "test-jwt-secret-for-http-tests";
  const ok = await connectDb();
  if (!ok) {
    throw new Error("Could not connect to in-memory MongoDB.");
  }
}

export async function stopMemoryDb() {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}

export async function clearCollections() {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
}

export function signTestToken({ userId, companyId, email = "test@example.com", clientId = null }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing for tests");
  return jwt.sign(
    {
      sub: String(userId),
      companyId: String(companyId),
      email,
      clientId: clientId ? String(clientId) : null,
    },
    secret,
    { expiresIn: "1h" }
  );
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}
