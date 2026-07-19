import { Request, Response } from "express";
import { FavoriteService } from "../services/favorite.service";

export class FavoriteController {
  private favoriteService = new FavoriteService();

  async addFavorite(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { propertyId } = req.params;

      console.log(`❤️ Adding to favorites - UserID: ${userId}, PropertyID: ${propertyId}`);

      await this.favoriteService.addFavorite(userId, propertyId);
      console.log(`✅ Added to favorites successfully`);
      res.json({ message: "Added to favorites" });
    } catch (error: any) {
      console.error('❌ Add favorite error:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async removeFavorite(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { propertyId } = req.params;

      console.log(`💔 Removing from favorites - UserID: ${userId}, PropertyID: ${propertyId}`);

      await this.favoriteService.removeFavorite(userId, propertyId);
      console.log(`✅ Removed from favorites successfully`);
      res.json({ message: "Removed from favorites" });
    } catch (error: any) {
      console.error('❌ Remove favorite error:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async isFavorite(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { propertyId } = req.params;

      const isFavorite = await this.favoriteService.isFavorite(userId, propertyId);
      res.json({ isFavorite });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUserFavorites(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      console.log(`Getting favorites for user: ${userId}`);

      const favorites = await this.favoriteService.getUserFavorites(userId);
      res.json(favorites);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
