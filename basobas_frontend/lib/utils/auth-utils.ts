// Utility functions for authentication
"use client";

/**
 * Get current user from cookies (client-side only)
 */
export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  try {
    const userDataCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user_data="));

    if (!userDataCookie) return null;

    const userData = decodeURIComponent(userDataCookie.split("=")[1]);
    return JSON.parse(userData);
  } catch (error) {
    console.error("Error getting user from cookies:", error);
    return null;
  }
}

/**
 * Get auth token from cookies (client-side only)
 */
export function getAuthToken() {
  if (typeof window === "undefined") return null;

  try {
    const tokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="));

    if (!tokenCookie) return null;

    return tokenCookie.split("=")[1];
  } catch (error) {
    console.error("Error getting token from cookies:", error);
    return null;
  }
}

export function getUserData() {
  return getCurrentUser();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const user = getCurrentUser();
  const token = getAuthToken();
  return !!(user && token);
}
/**
 * Construct full image URL from relative path or profile picture string
 * Backend stores profile picture as /public/profile-pictures/filename.jpg
 * This function converts it to a full URL usable in img src
 */
export function getImageUrl(profilePicture: string | null | undefined): string | null {
  if (!profilePicture) return null;
  
  // If it's already a full URL, return as is
  if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
    return profilePicture;
  }
  
  // Use the same base URL as axios
  const baseUrl = "http://localhost:5000";
  
  // If it starts with '/', it's the old format with /public/..., use as is
  if (profilePicture.startsWith('/')) {
    return `${baseUrl}${profilePicture}`;
  }
  
  // New format: just filename, prepend the path
  return `${baseUrl}/public/profile-pictures/${profilePicture}`;
}

/**
 * Construct full image URL for property images
 * Backend stores property images as /public/property-images/filename.jpg
 * This function converts it to a full URL usable in img src
 */
export function getPropertyImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Use the same base URL as axios
  const baseUrl = "http://localhost:5000";
  
  // If it starts with '/', it's the format with /public/..., use as is
  if (imagePath.startsWith('/')) {
    return `${baseUrl}${imagePath}`;
  }
  
  // Fallback: just filename, prepend the path
  return `${baseUrl}/public/property-images/${imagePath}`;
}