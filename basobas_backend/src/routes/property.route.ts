import { Router } from "express";
import multer from "multer";
import path from "path";
import { PropertyController } from "../controllers/property.controller";
import { authorize } from "../middlewears/authorized.middlewears";

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

router.post("/", authorize, upload.array('images', 10), (req, res, next) => {
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
router.put("/:id", authorize, upload.array('images', 10), propertyController.updateProperty.bind(propertyController));
router.delete("/:id", authorize, propertyController.deleteProperty.bind(propertyController));

// Admin routes
import { AdminController } from "../controllers/admin.controller";
const adminController = new AdminController();
router.put("/:id/assign", authorize, propertyController.assignProperty.bind(propertyController));
// Moderation endpoints
router.put("/admin/:id/approve", authorize, adminController.approveProperty.bind(adminController));
router.put("/admin/:id/reject", authorize, adminController.rejectProperty.bind(adminController));
router.put("/admin/:id/status", authorize, adminController.updatePropertyStatus.bind(adminController));

export default router;