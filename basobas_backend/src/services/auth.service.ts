import { UserModel } from "../models/user.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { sendEmail } from "../config/email";
import { JWT_SECRET } from "../config";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repository";
const CLIENT_URL = process.env.CLIENT_URL as string;

export class AuthService {
  private userRepository = new UserRepository();

  async login(data: any) {
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

    // 3. Generate JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "30d" }
    );

    // 4. Return keys that match what our Controller and Flutter expect
    return {
      user: user.toJSON(), // Converts _id to id and hides password
      token,
    };
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
            const decoded: any = jwt.verify(token, JWT_SECRET);
            const userId = decoded.id;
            const user = await this.userRepository.getUserById(userId);
            if (!user) {
                throw new HttpError(404, "User not found");
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await UserModel.findByIdAndUpdate(userId, { password: hashedPassword });
            return user;
        } catch (error) {
            throw new HttpError(400, "Invalid or expired token");
        }
    }
}