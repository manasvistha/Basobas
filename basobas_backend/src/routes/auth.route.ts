import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.ts";
import { authorize } from "../middlewears/authorized.middlewears.ts";
import { requirePermission } from "../middlewears/rbac.middlewears.ts";
import { PERMISSIONS } from "../config/rbac.ts";
import { uploadProfilePicture } from "../middlewears/uploadProfilePicture.middlewears.ts";
import { authLimiter, sensitiveLimiter } from "../middlewears/rate-limit.middlewears.ts";
import { requireCaptcha } from "../middlewears/captcha.middlewears.ts";
import multer from "multer";

// In-memory upload for the data-import JSON file (parsed, never persisted to disk).
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});


const router = Router();
const authController = new AuthController();

// Public routes — layered brute-force defence: rate limit (per-IP throttle) +
// CAPTCHA (proves a human) on the credential-accepting endpoints. Account
// lockout is enforced per-account inside the login service.
router.post("/register", authLimiter, requireCaptcha, authController.register);
router.post("/login", authLimiter, requireCaptcha, authController.login);
router.post("/login/verify-mfa", authLimiter, authController.verifyMfaLogin);
router.post("/logout", authController.logout);
router.post("/password/change-expired", authLimiter, authController.changeExpiredPassword);

// Protected routes (require JWT token)
router.get("/profile", authorize, authController.getProfile);
router.get("/current-user", authorize, authController.getProfile); // Alias for compatibility
router.get("/export-data", sensitiveLimiter, authorize, authController.exportMyData);
router.post("/import-data", sensitiveLimiter, authorize, requirePermission(PERMISSIONS.PROFILE_WRITE_OWN), importUpload.single("file"), authController.importMyData);
router.post("/mfa/setup", authorize, authController.mfaSetup);
router.post("/mfa/enable", authorize, authController.mfaEnable);
router.post("/mfa/disable", authorize, authController.mfaDisable);
router.post("/upload-photo", authorize, uploadProfilePicture.single('photo'), authController.uploadPhoto);
router.post("/user", authorize, requirePermission(PERMISSIONS.USER_MANAGE), uploadProfilePicture.single('photo'), authController.createUser);
router.put("/:id", sensitiveLimiter, authorize, requirePermission(PERMISSIONS.PROFILE_WRITE_OWN), uploadProfilePicture.single('photo'), authController.updateUser);
router.post("/request-password-reset", authLimiter, requireCaptcha, authController.sendResetPasswordEmail);
router.post("/reset-password/:token", authLimiter, authController.resetPassword);

export default router;
