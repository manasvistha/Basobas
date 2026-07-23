/**
 * Diagnose login problems (read-only unless you pass CHECK_PASSWORD/RESET).
 *
 * Usage (from basobas_backend):
 *   List all accounts + lock state:
 *     npx ts-node scripts/check-login.ts
 *
 *   Test a specific email+password against the stored hash:
 *     CHECK_EMAIL=you@example.com CHECK_PASSWORD='YourPass1!' npx ts-node scripts/check-login.ts
 *
 *   Reset a password to a known value (writes):
 *     RESET_EMAIL=you@example.com RESET_TO='NewPass1!' npx ts-node scripts/check-login.ts
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { UserModel } from "../src/models/user.model";

dotenv.config();

const MONGO_URI = process.env.LOCAL_DB_URI || "mongodb://localhost:27017/basobas";

function looksHashed(pw?: string): boolean {
  return !!pw && /^\$2[aby]\$\d{2}\$/.test(pw);
}

async function main() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log(`Connected to ${MONGO_URI}\n`);

  // --- Optional: reset a password to a known value ---
  const resetEmail = process.env.RESET_EMAIL?.trim().toLowerCase();
  if (resetEmail && process.env.RESET_TO) {
    const u = await UserModel.findOne({ email: resetEmail });
    if (!u) {
      console.log(`RESET: no user with email ${resetEmail}`);
    } else {
      u.password = process.env.RESET_TO;          // hook re-hashes on save
      u.failedLoginAttempts = 0;
      u.lockUntil = undefined;
      await u.save();
      console.log(`RESET: password updated + lock cleared for ${resetEmail}\n`);
    }
  }

  // --- Optional: test a specific credential pair ---
  const checkEmail = process.env.CHECK_EMAIL?.trim().toLowerCase();
  if (checkEmail && process.env.CHECK_PASSWORD) {
    const u = await UserModel.findOne({ email: checkEmail }).select("+password");
    if (!u) {
      console.log(`CHECK: no user with email ${checkEmail} (so login => "Invalid credentials")`);
    } else {
      const match = await bcrypt.compare(process.env.CHECK_PASSWORD, u.password);
      console.log(`CHECK: email found. bcrypt.compare => ${match ? "MATCH ✅" : "NO MATCH ❌"}`);
      console.log(`       stored hash prefix: ${u.password.slice(0, 7)} (looksHashed=${looksHashed(u.password)})`);
    }
    console.log("");
  }

  // --- Always: list accounts + brute-force state ---
  const users = await UserModel.find({}).select("email role password failedLoginAttempts lockUntil passwordChangedAt");
  console.log(`=== ${users.length} account(s) ===`);
  for (const u of users as any[]) {
    const locked = u.lockUntil && u.lockUntil.getTime() > Date.now();
    console.log(
      `- ${u.email}  [${u.role}]  hashed=${looksHashed(u.password)}  ` +
      `failed=${u.failedLoginAttempts ?? 0}  ` +
      `${locked ? `LOCKED until ${u.lockUntil.toISOString()}` : "unlocked"}  ` +
      `pwdChangedAt=${u.passwordChangedAt ? new Date(u.passwordChangedAt).toISOString() : "(none)"}`
    );
  }
  console.log("");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("check-login failed:", err?.message || err);
  process.exit(1);
});
