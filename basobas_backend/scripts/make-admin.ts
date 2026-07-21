/**
 * Create (or promote) an admin user.
 *
 * Usage (from basobas_backend):
 *   npx ts-node scripts/make-admin.ts
 *
 * Override defaults with env vars:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=Secret123 ADMIN_NAME="Your Name" npx ts-node scripts/make-admin.ts
 *   ADMIN_RESET_PASSWORD=true  -> also reset the password if the user already exists
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { UserModel } from "../src/models/user.model";

dotenv.config();

const MONGO_URI = process.env.LOCAL_DB_URI || "mongodb://localhost:27017/basobas";
const email = (process.env.ADMIN_EMAIL || "admin@basobas.com").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "Admin@123";
const name = process.env.ADMIN_NAME || "Admin";

async function main() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log(`Connected to ${MONGO_URI}`);

  const existing = await UserModel.findOne({ email });
  if (existing) {
    existing.role = "admin";
    if (process.env.ADMIN_RESET_PASSWORD === "true") {
      existing.password = password; // hashed automatically by the model's pre-save hook
      console.log("Password reset for existing user.");
    }
    await existing.save();
    console.log(`Promoted existing user to admin: ${email}`);
  } else {
    await UserModel.create({ name, email, password, role: "admin" });
    console.log(`Created admin user: ${email}`);
  }

  console.log("\n=== Admin login ===");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${process.env.ADMIN_RESET_PASSWORD === "true" || !existing ? password : "(unchanged)"}`);
  console.log("===================\n");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to create admin:", err?.message || err);
  process.exit(1);
});
