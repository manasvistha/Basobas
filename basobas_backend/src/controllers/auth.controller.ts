import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";
import { PropertyService } from "../services/property.service";
import { BookingService } from "../services/booking.service";
import { FavoriteService } from "../services/favorite.service";
import { NotificationService } from "../services/notification.service";
import { ConversationService } from "../services/conversation.service";
import { MfaService } from "../services/mfa.service";
import { registerDTO, loginDTO } from "../dtos/user.dto";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { assertStrongPassword } from "../utils/password-policy";
import { recordFailedLogin, clearFailedLogins } from "../middlewears/failed-login.middlewears";

const authService = new AuthService();
const userService = new UserService();
const propertyService = new PropertyService();
const bookingService = new BookingService();
const favoriteService = new FavoriteService();
const notificationService = new NotificationService();
const conversationService = new ConversationService();
const mfaService = new MfaService();

export class AuthController {
  // src/controllers/auth.controller.ts
  async register(req: Request, res: Response) {
    try {
      // 1. Validate incoming data with Zod
      const parseResult = registerDTO.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          success: false,
          message: "Validation failed",
          errors: parseResult.error.issues
        });
      }
      
      const validatedData = parseResult.data;
      
      // 2. Call service to create user
      const user = await authService.register(validatedData);
      
      // 3. Return response - Flutter looks for 'success' and 'user'
      return res.status(201).json({ 
        success: true,
        message: "Registration successful", 
        user: user // user object is already serialized without password
      });
    } catch (error: any) {
      console.error("Registration Error Details:", error.message); 
      
      return res.status(400).json({ 
        success: false,
        message: error.message || "Registration failed",
        error: error.message 
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      // 1. Validate credentials
      const parseResult = loginDTO.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          success: false,
          message: "Validation failed",
          errors: parseResult.error.issues
        });
      }
      
      const validatedData = parseResult.data;
      
      // 2. Perform login via service
      const result = await authService.login(validatedData);

      // Credentials are valid at this point — reset the failed-attempt counter.
      clearFailedLogins(req);

      // 2a. If MFA is enabled, don't issue the real token yet. Hand back a
      //     short-lived MFA token; the client must call /login/verify-mfa.
      if (result.mfaRequired) {
        const mfaToken = jwt.sign(
          { id: result.userId, purpose: "mfa" },
          JWT_SECRET,
          { expiresIn: "5m" }
        );
        return res.status(200).json({
          success: true,
          mfaRequired: true,
          mfaToken,
        });
      }

      // 2b. If the password has expired, issue a short-lived change token and
      //     require the client to set a new password before logging in.
      if (result.passwordExpired) {
        const changeToken = jwt.sign(
          { id: result.userId, purpose: "password-change" },
          JWT_SECRET,
          { expiresIn: "10m" }
        );
        return res.status(200).json({
          success: true,
          passwordExpired: true,
          changeToken,
        });
      }

      console.log('✅ Login successful for user:', (result.user as any).id);
      console.log('📝 Token generated (first 20 chars):', result.token.substring(0, 20) + '...');

      // 3. Return response - Flutter looks for 'token' and 'data'
      // result should be { user: IUser, token: string }
      // Note: authService.login already calls toJSON(), so result.user is already serialized
      return res.status(200).json({
        success: true,
        token: result.token, // Matching: response.data['token'] in Flutter login()
        data: result.user    // Matching: response.data['data'] in Flutter login()
      });
    } catch (error: any) {
      console.error("Login Error Details:", error.message);

      // Failed authentication — count it toward the auto-block threshold.
      recordFailedLogin(req);

      return res.status(401).json({
        success: false,
        message: error.message || "Login failed",
        error: error.message
      });
    }
  }

  // Second step of MFA login: exchange the short-lived mfaToken + OTP for a real JWT.
  async verifyMfaLogin(req: Request, res: Response) {
    try {
      const { mfaToken, otp } = req.body || {};
      if (!mfaToken || !otp) {
        return res.status(400).json({ success: false, message: "mfaToken and otp are required" });
      }

      let decoded: any;
      try {
        decoded = jwt.verify(mfaToken, JWT_SECRET);
      } catch {
        return res.status(401).json({ success: false, message: "MFA session expired, please log in again" });
      }

      if (decoded?.purpose !== "mfa" || !decoded?.id) {
        return res.status(401).json({ success: false, message: "Invalid MFA token" });
      }

      const result = await authService.completeMfaLogin(decoded.id, String(otp));
      clearFailedLogins(req);
      if (result.passwordExpired) {
        const changeToken = jwt.sign(
          { id: result.userId, purpose: "password-change" },
          JWT_SECRET,
          { expiresIn: "10m" }
        );
        return res.status(200).json({ success: true, passwordExpired: true, changeToken });
      }
      return res.status(200).json({ success: true, token: result.token, data: result.user });
    } catch (error: any) {
      recordFailedLogin(req);
      return res.status(401).json({ success: false, message: error.message || "MFA verification failed" });
    }
  }

  // Set a new password when the current one has expired (uses the change token
  // issued by /login or /login/verify-mfa), then issue a real session token.
  async changeExpiredPassword(req: Request, res: Response) {
    try {
      const { changeToken, newPassword } = req.body || {};
      if (!changeToken || !newPassword) {
        return res.status(400).json({ success: false, message: "changeToken and newPassword are required" });
      }

      let decoded: any;
      try {
        decoded = jwt.verify(changeToken, JWT_SECRET);
      } catch {
        return res.status(401).json({ success: false, message: "Session expired, please log in again" });
      }

      if (decoded?.purpose !== "password-change" || !decoded?.id) {
        return res.status(401).json({ success: false, message: "Invalid change token" });
      }

      const result = await authService.changeExpiredPassword(decoded.id, String(newPassword));
      return res.status(200).json({ success: true, token: result.token, data: result.user });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || "Failed to change password" });
    }
  }

  // Begin MFA enrollment — returns otpauth URL + QR data-url to scan.
  async mfaSetup(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = await mfaService.generateSetup(userId);
      return res.status(200).json({ success: true, ...data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || "Failed to start MFA setup" });
    }
  }

  // Confirm enrollment with the first code.
  async mfaEnable(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { otp } = req.body || {};
      if (!otp) return res.status(400).json({ success: false, message: "otp is required" });
      const data = await mfaService.enable(userId, String(otp));
      return res.status(200).json({ success: true, message: "Two-factor authentication enabled", ...data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || "Failed to enable MFA" });
    }
  }

  // Turn MFA off (requires a current code).
  async mfaDisable(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { otp } = req.body || {};
      if (!otp) return res.status(400).json({ success: false, message: "otp is required" });
      const data = await mfaService.disable(userId, String(otp));
      return res.status(200).json({ success: true, message: "Two-factor authentication disabled", ...data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || "Failed to disable MFA" });
    }
  }

  // Get current user profile (protected route)
  async getProfile(req: Request, res: Response) {
    try {
      // User is attached to req by the authorize middleware
      // The JWT payload has 'id' property (not '_id')
      const userId = (req as any).user.id;
      
      console.log('🔍 Fetching profile for user ID:', userId);
      
      const user = await authService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      console.log('📸 User profile data:', {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || 'NOT SET'
      });
      
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error: any) {
      console.error("Get Profile Error:", error.message);
      
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get profile"
      });
    }
  }

  // Export all of the authenticated user's own data (privacy: "download my data").
  // Uses the id from the JWT only — never a URL param — so no user can export
  // another user's data (no IDOR). Passwords are never included.
  async exportMyData(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const [
        profile,
        properties,
        bookings,
        bookingRequests,
        favorites,
        notifications,
        conversations,
      ] = await Promise.all([
        authService.getUserById(userId),
        propertyService.getPropertiesByOwner(userId),
        bookingService.getBookingsByUser(userId),
        bookingService.getOwnerBookingRequests(userId),
        favoriteService.getUserFavorites(userId),
        notificationService.getNotificationsByUser(userId, 1, 100000),
        conversationService.getConversationsByUser(userId),
      ]);

      if (!profile) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const exportPayload = {
        meta: {
          format: "basobas-user-data-export/v1",
          exportedAt: new Date().toISOString(),
          userId,
        },
        profile,
        properties,
        bookings,
        bookingRequests,
        favorites,
        notifications: (notifications as any)?.data ?? notifications,
        conversations,
      };

      const filename = `basobas-data-${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.status(200).send(JSON.stringify(exportPayload, null, 2));
    } catch (error: any) {
      console.error("Export Data Error:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to export data",
      });
    }
  }

  // Upload profile picture (protected route)
  async uploadPhoto(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const file = (req as any).file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      // Construct the URL for the uploaded file
      // The file is saved in uploads/profile-pictures/
      const photoUrl = `/public/profile-pictures/${file.filename}`;

      // Update user's profilePicture in database
      const updatedUser = await authService.updateProfilePicture(userId, photoUrl);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      console.log('📸 Profile picture uploaded:', photoUrl);

      return res.status(200).json({
        success: true,
        message: "Profile picture uploaded successfully",
        data: {
          photoUrl: photoUrl,
          user: updatedUser
        }
      });
    } catch (error: any) {
      console.error("Upload Photo Error:", error.message);
      
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to upload photo"
      });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const file = (req as any).file;

      const userData: any = {
        name: req.body?.name,
        email: req.body?.email,
        password: req.body?.password,
        username: req.body?.username || undefined,
        role: req.body?.role || "user",
      };

      if (file) {
        userData.profilePicture = file.filename;
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
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create user",
      });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const requester = (req as any).user;

      if (!requester || (requester.role !== "admin" && requester.id !== userId)) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to update this user",
        });
      }

      const file = (req as any).file;

      // Enforce the strong-password policy on any password change.
      if (req.body?.password) {
        try {
          assertStrongPassword(req.body.password);
        } catch (e: any) {
          return res.status(400).json({ success: false, message: e.message });
        }
      }

      const updateData: any = {
        name: req.body?.name,
        email: req.body?.email,
        password: req.body?.password,
        username: req.body?.username,
      };

      if (requester.role === "admin") {
        updateData.role = req.body?.role;
      }

      if (file) {
        updateData.profilePicture = file.filename;
      }

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined || updateData[key] === "") {
          delete updateData[key];
        }
      });

      const updatedUser = await userService.updateUserById(userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update user",
      });
    }
  }

  async sendResetPasswordEmail(req: Request, res: Response) {
        try {
            const email = req.body.email;
            const user = await authService.sendResetPasswordEmail(email);
            return res.status(200).json(
                { success: true,
                    data: user,
                    message: "If the email is registered, a reset link has been sent." }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async resetPassword(req: Request, res: Response) {
        try {

           const token = req.params.token;
            const { newPassword } = req.body;
            await authService.resetPassword(token, newPassword);
            return res.status(200).json(
                { success: true, message: "Password has been reset successfully." }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}