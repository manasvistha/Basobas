import mongoose from "mongoose";
import { MONGO_URI } from "../config/index"; 

export async function connectDB() {
  try {

    mongoose.set('strictQuery', false);
    
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected (Rentora)");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    console.log("Continuing without database connection for development...");
  }
}