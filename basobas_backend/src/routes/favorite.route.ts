import { Router, Request, Response } from "express";
import { FavoriteController } from "../controllers/favorite.controller";
import { authorize } from "../middlewears/authorized.middlewears";
import { sensitiveLimiter } from "../middlewears/rate-limit.middlewears";
import { requirePermission } from "../middlewears/rbac.middlewears";
import { PERMISSIONS } from "../config/rbac";

const router = Router();
const favoriteController = new FavoriteController();

// Bind methods to preserve 'this' context
const addFavorite = favoriteController.addFavorite.bind(favoriteController);
const removeFavorite = favoriteController.removeFavorite.bind(favoriteController);
const isFavorite = favoriteController.isFavorite.bind(favoriteController);
const getUserFavorites = favoriteController.getUserFavorites.bind(favoriteController);

// POST /api/favorite/:propertyId - Add to favorites
router.post("/:propertyId", sensitiveLimiter, authorize, requirePermission(PERMISSIONS.FAVORITE_MANAGE), (req: Request, res: Response) => addFavorite(req, res));

// DELETE /api/favorite/:propertyId - Remove from favorites
router.delete("/:propertyId", authorize, requirePermission(PERMISSIONS.FAVORITE_MANAGE), (req: Request, res: Response) => removeFavorite(req, res));

// GET /api/favorite/:propertyId - Check if property is favorited
router.get("/:propertyId", authorize, requirePermission(PERMISSIONS.FAVORITE_MANAGE), (req: Request, res: Response) => isFavorite(req, res));

// GET /api/favorite/user - Get all user's favorite properties
router.get("/", authorize, requirePermission(PERMISSIONS.FAVORITE_MANAGE), (req: Request, res: Response) => getUserFavorites(req, res));

export default router;
