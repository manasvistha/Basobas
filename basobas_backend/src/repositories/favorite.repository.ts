import Favorite, { IFavorite } from "../models/favorite.model";

export class FavoriteRepository {
  async addFavorite(userId: string, propertyId: string): Promise<IFavorite> {
    const favorite = new Favorite({ user: userId, property: propertyId });
    return await favorite.save();
  }

  async removeFavorite(userId: string, propertyId: string): Promise<boolean> {
    const result = await Favorite.deleteOne({ user: userId, property: propertyId });
    return result.deletedCount > 0;
  }

  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    const favorite = await Favorite.findOne({ user: userId, property: propertyId });
    return !!favorite;
  }

  async getUserFavorites(userId: string): Promise<IFavorite[]> {
    return await Favorite.find({ user: userId })
      .populate('property')
      .sort({ createdAt: -1 });
  }

  async removeByProperty(propertyId: string): Promise<boolean> {
    const result = await Favorite.deleteMany({ property: propertyId });
    return result.deletedCount > 0;
  }
}
