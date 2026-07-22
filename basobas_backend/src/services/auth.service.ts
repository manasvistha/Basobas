import { UserModel } from "../models/user.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { sendEmail } from "../config/email";
import { JWT_SECRET } from "../config";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repository";
import { assertStrongPassword, isPasswordExpired } from "../utils/password-policy";
import { isPasswordReused, nextPasswordHistory } from "../utils/password-history";
import { hashUserAgent, SESSION_TTL } from "../config/session";
import { hashPassword, decrypt } from "../utils/crypto";
const CLIENT_URL = process.env.CLIENT_URL as string;

export class AuthService {
  private userRepository = new UserRepository();

  async login(data: any, userAgent?: string) {
    const email = (data?.email || "").trim().toLowerCase();
    const password = data?.password;

    // 1. Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new Error("Invalid credentials"); // Email not found
    }

    // 2. Compare password using the method in our Model
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error("Invalid credentials"); // Password wrong
    }

    // 3. If the account has MFA enabled, stop here — the controller will issue a
    //    short-lived MFA token and the client must complete the second step.
    if (user.mfaEnabled) {
      return { mfaRequired: true as const, passwordExpired: false as const, userId: user._id.toString() };
    }

    // 4. If the password has expired, force a change before issuing a token.
    if (isPasswordExpired(user.passwordChangedAt)) {
      return { mfaRequired: false as const, passwordExpired: true as const, userId: user._id.toString() };
    }

    // 5. Generate JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role, ua: hashUserAgent(userAgent) },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: SESSION_TTL }
    );

    // 6. Return keys that match what our Controller and Flutter expect
    return {
      mfaRequired: false as const,
      passwordExpired: false as const,
      user: user.toJSON(), // Converts _id to id and hides password
      token,
    };
  }

  // Second step of an MFA login: verify the TOTP code, then issue the real JWT.
  async completeMfaLogin(userId: string, otp: string, userAgent?: string) {
    const user = await UserModel.findById(userId);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new Error("MFA is not set up for this account");
    }

    const isValid = authenticator.check(String(otp).trim(), decrypt(user.mfaSecret));
    if (!isValid) {
      throw new Error("Invalid authentication code");
    }

    // Even after 2FA, force a password change if it has expired.
    if (isPasswordExpired(user.passwordChangedAt)) {
      return { passwordExpired: true as const, userId: user._id.toString() };
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, ua: hashUserAgent(userAgent) },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: SESSION_TTL }
    );

    return { passwordExpired: false as const, user: user.toJSON(), token };
  }

  // Set a new password when the current one has expired, then issue the real JWT.
  async changeExpiredPassword(userId: string, newPassword: string, userAgent?: string) {
    assertStrongPassword(newPassword);
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");
    if (await isPasswordReused(user, newPassword)) {
      throw new Error("You cannot reuse a recent password. Please choose a new one.");
    }
    const hashedPassword = await hashPassword(newPassword);
    const passwordHistory = nextPasswordHistory(user.password, user.passwordHistory, hashedPassword);
    await UserModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      passwordHistory,
      passwordChangedAt: new Date(),
    });
    const token = jwt.sign(
      { id: user._id, role: user.role, ua: hashUserAgent(userAgent) },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: SESSION_TTL }
    );
    const updated = await UserModel.findById(userId);
    return { user: (updated || user).toJSON(), token };
  }

  async register(data: any) {
    const payload: any = {
      ...data,
      email: (data?.email || "").trim().toLowerCase(),
    };

    // Only add username if it's provided
    if (data?.username) {
      payload.username = data.username.trim().toLowerCase();
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: payload.email });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create user (password is hashed automatically by our Model's pre-save hook)
    const user = await UserModel.create(payload);
    return user;
  }

  async getUserById(userId: string) {
    // Find user by ID and exclude password
    const user = await UserModel.findById(userId).select("-password");
    return user ? user.toJSON() : null;
  }

  async updateProfilePicture(userId: string, photoUrl: string) {
    // Update user's profilePicture field
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { profilePicture: photoUrl },
      { new: true } // Return the updated document
    ).select("-password");
    
    return user ? user.toJSON() : null;
  }
  async sendResetPasswordEmail(email?: string) {
        if (!email) {
            throw new HttpError(400, "Email is required");
        }
        const user = await this.userRepository.getUserByEmail(email);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' }); // 1 hour expiry
        const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
        const html = `<p>Click<a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`;
        await sendEmail(user.email, "Password Reset", html);
        return user;

    }

    async resetPassword(token?: string, newPassword?: string) {
        try {
            if (!token || !newPassword) {
                throw new HttpError(400, "Token and new password are required");
            }
            try {
                assertStrongPassword(newPassword);
            } catch (e: any) {
                throw new HttpError(400, e.message);
            }
            const decoded: any = jwt.verify(token, JWT_SECRET);
            const userId = decoded.id;
            const user = await UserModel.findById(userId);
            if (!user) {
                throw new HttpError(404, "User not found");
            }
            if (await isPasswordReused(user, newPassword)) {
                throw new HttpError(400, "You cannot reuse a recent password. Please choose a new one.");
            }
            const hashedPassword = await hashPassword(newPassword);
            const passwordHistory = nextPasswordHistory(user.password, user.passwordHistory, hashedPassword);
            await UserModel.findByIdAndUpdate(userId, { password: hashedPassword, passwordHistory, passwordChangedAt: new Date() });
            return user.toJSON();
        } catch (error) {
            // Preserve explicit HttpErrors (e.g. weak password, missing fields);
            // only unexpected failures (bad/expired JWT) become the generic message.
            if (error instanceof HttpError) throw error;
            throw new HttpError(400, "Invalid or expired token");
        }
    }
}