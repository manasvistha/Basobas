import { UserModel } from "../models/user.model";
import bcrypt from "bcryptjs";

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
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
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
