import axios from "./axios";

export interface FavoriteResponse {
  message: string;
  isFavorite?: boolean;
}

export async function addFavorite(propertyId: string): Promise<FavoriteResponse> {
  const response = await axios.post(`/api/favorite/${propertyId}`);
  return response.data;
}

export async function removeFavorite(propertyId: string): Promise<FavoriteResponse> {
  const response = await axios.delete(`/api/favorite/${propertyId}`);
  return response.data;
}

export async function checkIfFavorite(propertyId: string): Promise<boolean> {
  try {
    const response = await axios.get(`/api/favorite/${propertyId}`);
    return response.data.isFavorite;
  } catch (error) {
    return false;
  }
}

export async function getUserFavorites(): Promise<any[]> {
  const response = await axios.get(`/api/favorite`);
  return response.data;
}