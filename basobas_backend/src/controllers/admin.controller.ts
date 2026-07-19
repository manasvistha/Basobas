import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { PropertyService } from "../services/property.service";
import { BookingService } from "../services/booking.service";

const userService = new UserService();
const propertyService = new PropertyService();
const bookingService = new BookingService();

export class AdminController {
  async createUser(req: Request, res: Response) {
    try {
      const file = (req as any).file;

      // Validate required fields
      if (!req.body?.name || !req.body?.email || !req.body?.password) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and password are required",
        });
      }

      const userData: any = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        username: req.body.username || undefined,
        role: req.body.role || "user",
      };

      if (file) {
        userData.profilePicture = `/public/profile-pictures/${file.filename}`;
      }

      const user = await userService.createUser(userData);

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Failed to create user",
        });
      }

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error: any) {
      console.error("Admin create user error:", error.message);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create user",
      });
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await userService.getAllUsers(page, limit);
      return res.status(200).json({
        success: true,
        data: result.users,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get users",
      });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const user = await userService.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: user, // Service already serializes - no .toJSON() call
      });
    } catch (error: any) {
      console.error("Error fetching user by ID:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get user",
      });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const file = (req as any).file;

      const updateData: any = {
        name: req.body?.name,
        email: req.body?.email,
        password: req.body?.password,
        username: req.body?.username,
        role: req.body?.role,
      };

      if (file) {
        updateData.profilePicture = `/public/profile-pictures/${file.filename}`;
      }

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined || updateData[key] === "") {
          delete updateData[key];
        }
      });

      const user = await userService.updateUserById(userId, updateData);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update user",
      });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const user = await userService.deleteUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
        data: user,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to delete user",
      });
    }
  }

  // Property management methods for admin
  async getAllProperties(req: Request, res: Response) {
    try {
      const properties = await propertyService.getAllProperties();
      // Debug: log images arrays returned for frontend troubleshooting
      console.log('Admin getAllProperties - images preview:', properties.map(p => ({ id: p._id, images: p.images.slice(0,5) })));
      return res.status(200).json({
        success: true,
        data: properties,
      });
    } catch (error: any) {
      console.error("Admin get properties error:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get properties",
      });
    }
  }

  async promoteToAdmin(req: Request, res: Response) {
    try {
      const userId = req.params.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      // Update user role to admin
      const updatedUser = await userService.updateUserRole(userId, 'admin');

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User promoted to admin successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      console.error("Admin promote to admin error:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to promote user to admin",
      });
    }
  }

  async approveProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = (req as any).user.id;
      const property = await propertyService.updatePropertyStatus(id, 'approved', adminId);
      return res.status(200).json({
        success: true,
        message: "Property approved successfully",
        data: property,
      });
    } catch (error: any) {
      console.error("Admin approve property error:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to approve property",
      });
    }
  }

  async rejectProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = (req as any).user.id;
      const property = await propertyService.updatePropertyStatus(id, 'rejected', adminId);
      return res.status(200).json({
        success: true,
        message: "Property rejected successfully",
        data: property,
      });
    } catch (error: any) {
      console.error("Admin reject property error:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to reject property",
      });
    }
  }

  async updatePropertyStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminId = (req as any).user.id;

      if (!['pending', 'approved', 'rejected', 'available', 'assigned', 'booked'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be one of: 'pending', 'approved', 'rejected', 'available', 'assigned', 'booked'",
        });
      }

      const property = await propertyService.updatePropertyStatus(id, status, adminId);
      return res.status(200).json({
        success: true,
        message: "Property status updated successfully",
        data: property,
      });
    } catch (error: any) {
      console.error("Admin update property status error:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update property status",
      });
    }
  }

  async deleteProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = (req as any).user.id;

      // Admins are allowed to delete any property
      await propertyService.deletePropertyByAdmin(id);
      return res.status(200).json({
        success: true,
        message: "Property deleted successfully",
      });
    } catch (error: any) {
      console.error("Admin delete property error:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to delete property",
      });
    }
  }

  async getAllBookings(req: Request, res: Response) {
    try {
      const bookings = await bookingService.getAllBookingsForAdmin();
      return res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch bookings",
      });
    }
  }
}
