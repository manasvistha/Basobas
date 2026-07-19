import { FavoriteRepository } from "../repositories/favorite.repository";

export class FavoriteService {
  private favoriteRepository = new FavoriteRepository();

  async addFavorite(userId: string, propertyId: string) {
    return await this.favoriteRepository.addFavorite(userId, propertyId);
  }

  async removeFavorite(userId: string, propertyId: string) {
    const success = await this.favoriteRepository.removeFavorite(userId, propertyId);
    if (!success) throw new Error("Favorite not found");
    return { message: "Favorite removed" };
  }

  async isFavorite(userId: string, propertyId: string) {
    return await this.favoriteRepository.isFavorite(userId, propertyId);
  }

  async getUserFavorites(userId: string) {
    return await this.favoriteRepository.getUserFavorites(userId);
  }

  async removeByProperty(propertyId: string) {
    return await this.favoriteRepository.removeByProperty(propertyId);
  }
}
