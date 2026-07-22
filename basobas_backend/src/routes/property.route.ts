import { Router } from "express";
import multer from "multer";
import path from "path";
import { PropertyController } from "../controllers/property.controller";
import { authorize } from "../middlewears/authorized.middlewears";
import { sensitiveLimiter } from "../middlewears/rate-limit.middlewears";
import { requirePermission } from "../middlewears/rbac.middlewears";
import { PERMISSIONS } from "../config/rbac";

const router = Router();
const propertyController = new PropertyController();

// Configure multer for property images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'property-images'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported image format. Use JPG, PNG, WEBP, or HEIC.'));
    }
  },
});

router.post("/", sensitiveLimiter, authorize, requirePermission(PERMISSIONS.PROPERTY_CREATE), upload.array('images', 10), (req, res, next) => {
  console.log('Property create route hit:', {
    body: req.body,
    files: req.files,
    user: (req as any).user
  });
  propertyController.createProperty(req, res);
});
router.get("/", propertyController.getAllProperties.bind(propertyController));
router.get("/my", authorize, propertyController.getMyProperties.bind(propertyController));
router.get("/search", propertyController.searchByQuery.bind(propertyController));
router.get("/filter", propertyController.filterProperties.bind(propertyController));
router.get("/:id", propertyController.getPropertyById.bind(propertyController));
router.put("/:id", sensitiveLimiter, authorize, requirePermission(PERMISSIONS.PROPERTY_WRITE_OWN), upload.array('images', 10), propertyController.updateProperty.bind(propertyController));
router.delete("/:id", sensitiveLimiter, authorize, requirePermission(PERMISSIONS.PROPERTY_WRITE_OWN), propertyController.deleteProperty.bind(propertyController));

// Admin routes
import { AdminController } from "../controllers/admin.controller";
const adminController = new AdminController();
router.put("/:id/assign", authorize, requirePermission(PERMISSIONS.PROPERTY_MODERATE), propertyController.assignProperty.bind(propertyController));
// Moderation endpoints — admin only (property:moderate)
router.put("/admin/:id/approve", authorize, requirePermission(PERMISSIONS.PROPERTY_MODERATE), adminController.approveProperty.bind(adminController));
router.put("/admin/:id/reject", authorize, requirePermission(PERMISSIONS.PROPERTY_MODERATE), adminController.rejectProperty.bind(adminController));
router.put("/admin/:id/status", authorize, requirePermission(PERMISSIONS.PROPERTY_MODERATE), adminController.updatePropertyStatus.bind(adminController));

export default router;