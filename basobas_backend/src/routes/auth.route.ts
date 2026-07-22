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
router.post("/login/verify-mfa", authController.verifyMfaLogin);
router.post("/password/change-expired", authController.changeExpiredPassword);

// Protected routes (require JWT token)
router.get("/profile", authorize, authController.getProfile);
router.get("/current-user", authorize, authController.getProfile); // Alias for compatibility
router.get("/export-data", authorize, authController.exportMyData);
router.post("/mfa/setup", authorize, authController.mfaSetup);
router.post("/mfa/enable", authorize, authController.mfaEnable);
router.post("/mfa/disable", authorize, authController.mfaDisable);
router.post("/upload-photo", authorize, uploadProfilePicture.single('photo'), authController.uploadPhoto);
router.post("/user", authorize, requireAdmin, uploadProfilePicture.single('photo'), authController.createUser);
router.put("/:id", authorize, uploadProfilePicture.single('photo'), authController.updateUser);
router.post("/request-password-reset", authController.sendResetPasswordEmail);
router.post("/reset-password/:token", authController.resetPassword);

export default router;
