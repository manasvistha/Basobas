import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models to register them
import './models/user.model';
import './models/property.model';
import './models/conversation.model';
import './models/notification.model';
import './models/booking.model';
import './models/favorite.model';

// Create upload directories if they don't exist
import fs from 'fs';
const uploadDirs = ['uploads/profile-pictures', 'uploads/property-images'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// If your file is src/database/database.db.ts
import { connectDB } from './database/database.db';
import { PORT, ALLOWED_ORIGINS } from './config/index.ts'; 
import authRoutes from './routes/auth.route.ts';
import adminUserRoutes from './routes/admin.user.route.ts';
import propertyRoutes from './routes/property.route.ts';
import bookingRoutes from './routes/booking.route.ts';
import conversationRoutes from './routes/conversation.route.ts';
import notificationRoutes from './routes/notification.route.ts';
import favoriteRoutes from './routes/favorite.route.ts';

const app: Application = express();

// 1. DATABASE CONNECTION
connectDB();

// 2. BODY PARSERS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. SECURITY & LOGGING
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
})); 
app.use(morgan('dev')); 

// 4. CORS CONFIGURATION
app.use(cors({
  origin: (origin, callback) => {
    // Crucial for Flutter: Mobile apps often send requests with no origin
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 5. SANITIZATION MIDDLEWARE
app.use((req: Request, res: Response, next: NextFunction) => {
  const skipFields = ["email", "password", "profilePicture"];
  
  const sanitize = (obj: any): any => {
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      for (const key in obj) {
        if (skipFields.includes(key) || typeof obj[key] !== "string") {
          continue;
        }
        let value = obj[key];
        value = value.replace(/\$/g, ""); // Remove $ to prevent NoSQL injection
        if (!value.includes("@")) {
          value = value.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Simple XSS escape
        }
        obj[key] = value;
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  next();
});

// 6. RATE LIMITER (higher limit for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000,  // Increased from 100 for development
  message: { success: false, message: "Too many requests, please try again later." },
  skip: (req) => process.env.NODE_ENV === 'development' // Skip in dev mode
});
app.use('/api/', limiter);

// 7. ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/property', propertyRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/notification', notificationRoutes);

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: "Rentora API is live" });
});

// Static files for images with proper CORS headers
// Add CORS headers for all static file responses
app.use((req, res, next) => {
  if (req.path.startsWith('/public')) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
  next();
});

// Serve uploaded files from the uploads directory
app.use('/public/profile-pictures', express.static(path.join(__dirname, '../uploads/profile-pictures')));
app.use('/public/property-images', express.static(path.join(__dirname, '../uploads/property-images')));

// 8. ERROR HANDLER
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 9. EXPORT APP & OPTIONAL SERVER START
const port = PORT || 5000;

// Export the Express app for testing
export default app;

// Start server only when running index.ts directly
if (require.main === module) {
  app.listen(Number(port), "0.0.0.0", () => {
    console.log(`\n✅ Rentora Server Started`);
    console.log(`📡 Port: ${port}`);
    console.log(`📱 For Flutter connection, use your machine's IP address.`);
  });
}