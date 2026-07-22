import { UserModel } from "../models/user.model";
import bcrypt from "bcryptjs";
import { isPasswordReused, nextPasswordHistory } from "../utils/password-history";
import { hashPassword } from "../utils/crypto";

export class UserService {
  async createUser(data: any) {
    const payload = {
      ...data,
      email: data?.email ? data.email.trim().toLowerCase() : undefined,
      username: data?.username ? data.username.trim().toLowerCase() : undefined,
    };

    if (payload?.email) {
      const existingUser = await UserModel.findOne({ email: payload.email });
      if (existingUser) {
        throw new Error("User with this email already exists");
      }
    }

    const user = await UserModel.create(payload);
    return user ? user.toJSON() : null;
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const users = await UserModel.find().select("-password").skip(skip).limit(limit);
    const total = await UserModel.countDocuments();
    return {
      users: users.map((user) => (user.toJSON ? user.toJSON() : user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getUserById(userId: string) {
    const user = await UserModel.findById(userId).select("-password");
    return user ? user.toJSON() : null;
  }

  async updateUserById(userId: string, data: any) {
    const updateData: any = { ...data };

    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();
    }
    if (updateData.username) {
      updateData.username = updateData.username.trim().toLowerCase();
    }

    if (updateData.password) {
      const existing = await UserModel.findById(userId);
      if (existing) {
        const plain = updateData.password;
        if (await isPasswordReused(existing, plain)) {
          throw new Error("You cannot reuse a recent password. Please choose a new one.");
        }
        const newHash = await hashPassword(plain);
        updateData.password = newHash;
        updateData.passwordHistory = nextPasswordHistory(existing.password, existing.passwordHistory, newHash);
        updateData.passwordChangedAt = new Date();
      }
    }

    const user = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    return user ? user.toJSON() : null;
  }

  async deleteUserById(userId: string) {
    const user = await UserModel.findByIdAndDelete(userId).select("-password");
    return user ? user.toJSON() : null;
  }

  async updateUserRole(userId: string, role: string) {
    const user = await UserModel.findByIdAndUpdate(userId, { role }, {
      new: true,
    }).select("-password");

    return user ? user.toJSON() : null;
  }
}
