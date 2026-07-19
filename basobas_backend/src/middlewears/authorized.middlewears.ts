import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.ts';

export const authorize = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log(' No Authorization header found');
      return res.status(401).json({ message: 'No token' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log(' No token in Authorization header');
      return res.status(401).json({ message: 'No token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log(' Token verified for user:', (decoded as any).id);
    next();
  } catch (error: any) {
    console.log(' Token verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};
