import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/rentora";
export const ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000","http://10.0.2.2:3000", "http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3002", "http://127.0.0.1:3002"];
// Add your JWT secret here for later use in routes
export const JWT_SECRET = process.env.JWT_SECRET || "supersecretkeynn";


