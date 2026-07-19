import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.ts";
import { authorize } from "../middlewears/authorized.middlewears.ts";
import { requireAdmin } from "../middlewears/admin.middlewears.ts";
import { uploadProfilePicture } from "../middlewears/uploadProfilePicture.middlewears.ts";

const router = Router();
const adminController = new AdminController();

router.post(
  "/users",
  authorize,
  requireAdmin,
  uploadProfilePicture.single("photo"),
  adminController.createUser
);

router.get("/users", authorize, requireAdmin, adminController.getUsers);

router.get("/users/:id", authorize, requireAdmin, adminController.getUserById);

router.put(
  "/users/:id",
  authorize,
  requireAdmin,
  uploadProfilePicture.single("photo"),
  adminController.updateUser
);

router.delete("/users/:id", authorize, requireAdmin, adminController.deleteUser);

// Admin user promotion route
router.post("/users/:id/promote", authorize, requireAdmin, adminController.promoteToAdmin);

// Admin property management routes
router.get("/properties", authorize, requireAdmin, adminController.getAllProperties);
router.put("/properties/:id/status", authorize, requireAdmin, adminController.updatePropertyStatus);
router.delete("/properties/:id", authorize, requireAdmin, adminController.deleteProperty);
router.get("/bookings", authorize, requireAdmin, adminController.getAllBookings);

export default router;
