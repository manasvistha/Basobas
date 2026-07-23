import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.ts";
import { authorize } from "../middlewears/authorized.middlewears.ts";
import { requirePermission } from "../middlewears/rbac.middlewears.ts";
import { PERMISSIONS } from "../config/rbac.ts";
import { uploadProfilePicture } from "../middlewears/uploadProfilePicture.middlewears.ts";

const router = Router();
const adminController = new AdminController();

router.post(
  "/users",
  authorize,
  requirePermission(PERMISSIONS.USER_MANAGE),
  uploadProfilePicture.single("photo"),
  adminController.createUser
);

router.get("/users", authorize, requirePermission(PERMISSIONS.USER_MANAGE), adminController.getUsers);

router.get("/users/:id", authorize, requirePermission(PERMISSIONS.USER_MANAGE), adminController.getUserById);

router.put(
  "/users/:id",
  authorize,
  requirePermission(PERMISSIONS.USER_MANAGE),
  uploadProfilePicture.single("photo"),
  adminController.updateUser
);

router.delete("/users/:id", authorize, requirePermission(PERMISSIONS.USER_MANAGE), adminController.deleteUser);

// Admin user promotion route
router.post("/users/:id/promote", authorize, requirePermission(PERMISSIONS.USER_PROMOTE), adminController.promoteToAdmin);

// Admin property management routes
router.get("/properties", authorize, requirePermission(PERMISSIONS.PROPERTY_MODERATE), adminController.getAllProperties);
router.put("/properties/:id/status", authorize, requirePermission(PERMISSIONS.PROPERTY_MODERATE), adminController.updatePropertyStatus);
router.delete("/properties/:id", authorize, requirePermission(PERMISSIONS.PROPERTY_MODERATE), adminController.deleteProperty);
router.get("/bookings", authorize, requirePermission(PERMISSIONS.ADMIN_ACCESS), adminController.getAllBookings);

// Security audit log (admin only)
router.get("/audit-logs", authorize, requirePermission(PERMISSIONS.AUDIT_READ), adminController.getAuditLogs);

export default router;
