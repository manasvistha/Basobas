import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.ts';
import { AUTH_COOKIE, hashUserAgent } from '../config/session.ts';

export const authorize = (req: any, res: any, next: any) => {
  try {
    // Prefer the HttpOnly auth cookie; fall back to the Authorization header
    // (used by non-browser clients such as the Flutter app).
    const cookieToken = req.cookies?.[AUTH_COOKIE];
    const authHeader = req.headers.authorization;
    const headerToken = authHeader ? authHeader.split(' ')[1] : undefined;
    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ message: 'No token' });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Session-hijacking defence: a token bound to a User-Agent must be replayed
    // from the same User-Agent. Tokens without the claim (legacy) skip this.
    if (decoded && decoded.ua) {
      if (decoded.ua !== hashUserAgent(req.headers['user-agent'])) {
        return res.status(401).json({ message: 'Session validation failed' });
      }
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};
