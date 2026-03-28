import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";
import { isDbConnected } from "../db.js";
import { Client } from "../models/Client.js";
import { Company } from "../models/Company.js";
import { User } from "../models/User.js";
import { generateInviteCode } from "../utils/inviteCode.js";
import { jsonError } from "../utils/jsonError.js";
import { devError } from "../utils/devLog.js";

const SALT_ROUNDS = 10;

function signToken(user) {
  const secret = getEnv().jwtSecret;
  if (!secret) throw new Error("JWT_SECRET missing");
  const clientId = user.clientId ? user.clientId.toString() : null;
  return jwt.sign(
    { sub: user._id.toString(), companyId: user.companyId.toString(), email: user.email, clientId },
    secret,
    { expiresIn: "7d" }
  );
}

async function buildUserPayload(user) {
  const company = await Company.findById(user.companyId).lean();
  let client = null;
  if (user.clientId) {
    client = await Client.findById(user.clientId).lean();
  }
  return {
    id: user._id,
    email: user.email,
    companyId: user.companyId,
    companyName: company?.name ?? "",
    inviteCode: company?.inviteCode ?? "",
    clientId: user.clientId ?? null,
    clientName: client?.name ?? null,
    clientInviteCode: client?.inviteCode ?? null,
    isClientPortal: !!user.clientId,
  };
}

function dbUnavailable(res) {
  return jsonError(
    res,
    503,
    "DB_UNAVAILABLE",
    "Database not configured or unreachable. Set MONGODB_URI."
  );
}

export async function register(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const companyName = String(req.body?.companyName ?? "").trim();
  const companyInviteCode = String(req.body?.companyInviteCode ?? req.body?.inviteCode ?? "")
    .trim()
    .toUpperCase();
  const clientInviteCode = String(req.body?.clientInviteCode ?? "").trim().toUpperCase();

  if (!email || !password || password.length < 8) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: "Valid email and password (min 8 characters) required.",
    });
  }

  if (companyInviteCode && clientInviteCode) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: "Use either a company invite code or a client invite code, not both.",
    });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "EMAIL_IN_USE", message: "Email already registered." });
    }

    let company;
    let clientId = null;

    if (clientInviteCode) {
      const client = await Client.findOne({ inviteCode: clientInviteCode });
      if (!client) {
        return res.status(400).json({
          error: "INVALID_INVITE",
          message: "Client invite code not found.",
        });
      }
      company = await Company.findById(client.companyId);
      if (!company) {
        return res.status(400).json({ error: "INVALID_INVITE", message: "Client workspace invalid." });
      }
      clientId = client._id;
    } else if (companyInviteCode) {
      company = await Company.findOne({ inviteCode: companyInviteCode });
      if (!company) {
        return res.status(400).json({
          error: "INVALID_INVITE",
          message: "Company invite code not found.",
        });
      }
    } else {
      if (!companyName) {
        return res.status(400).json({
          error: "INVALID_INPUT",
          message: "Company name is required when not using an invite code.",
        });
      }
      let code = generateInviteCode();
      for (let i = 0; i < 5; i += 1) {
        const clash = await Company.findOne({ inviteCode: code });
        if (!clash) break;
        code = generateInviteCode();
      }
      company = await Company.create({ name: companyName, inviteCode: code });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      email,
      passwordHash,
      companyId: company._id,
      clientId,
    });

    const token = signToken(user);
    const payload = await buildUserPayload(user);

    return res.status(201).json({
      token,
      user: payload,
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Registration failed." });
  }
}

export async function login(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!email || !password) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: "Email and password required.",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid email or password." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid email or password." });
    }

    const token = signToken(user);
    const payload = await buildUserPayload(user);

    return res.json({
      token,
      user: payload,
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Login failed." });
  }
}

export async function me(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  if (!req.user?.userId) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Not authenticated." });
  }

  try {
    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      return res.status(404).json({ error: "NOT_FOUND", message: "User not found." });
    }
    const payload = await buildUserPayload(user);
    return res.json({ user: payload });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load profile." });
  }
}
