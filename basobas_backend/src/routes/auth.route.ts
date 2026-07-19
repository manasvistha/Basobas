import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.ts";
import { authorize } from "../middlewears/authorized.middlewears.ts";
import { requireAdmin } from "../middlewears/admin.middlewears.ts";
import { uploadProfilePicture } from "../middlewears/uploadProfilePicture.middlewears.ts";


const router = Router();
const authController = new AuthController();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected routes (require JWT token)
router.get("/profile", authorize, authController.getProfile);
router.get("/current-user", authorize, authController.getProfile); // Alias for compatibility
router.post("/upload-photo", authorize, uploadProfilePicture.single('photo'), authController.uploadPhoto);
router.post("/user", authorize, requireAdmin, uploadProfilePicture.single('photo'), authController.createUser);
router.put("/:id", authorize, uploadProfilePicture.single('photo'), authController.updateUser);
router.post("/request-password-reset", authController.sendResetPasswordEmail);
router.post("/reset-password/:token", authController.resetPassword);

export default router;
