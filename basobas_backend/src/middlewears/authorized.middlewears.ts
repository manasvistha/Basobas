import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.ts';
import { AUTH_COOKIE, hashUserAgent } from '../config/session.ts';
import { UserModel } from '../models/user.model.ts';
import { isAccountLocked } from '../utils/account-lockout.ts';

// Zero-trust request authorization: a valid signature is necessary but NOT
// sufficient. Every protected request re-derives identity and authority from
// the database rather than trusting the (potentially stale) token claims —
// "verify every request, trust nothing by default".
export const authorize = async (req: any, res: any, next: any) => {
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

    // Trust nothing: confirm the subject still exists and is still allowed.
    // A deleted user, or a user locked out for brute-force, cannot ride an
    // already-issued token. Role/permissions are read fresh from the DB so a
    // demotion takes effect immediately, not at token expiry.
    // .lean() returns the RAW stored document. This is deliberate: a non-lean
    // read would let Mongoose apply the `passwordChangedAt` schema default
    // (Date.now) to accounts that have no stored value, making every session
    // look "issued before the last password change" and falsely revoking it.
    const user = await UserModel.findById(decoded.id)
      .select('role lockUntil passwordChangedAt')
      .lean<{ role?: string; lockUntil?: Date; passwordChangedAt?: Date }>();
    if (!user) {
      return res.status(401).json({ message: 'Account no longer exists' });
    }
    if (isAccountLocked(user)) {
      return res.status(403).json({ message: 'Account is temporarily locked' });
    }

    // Session revocation on credential change: any token issued BEFORE the
    // password was last changed is dead (covers reset / forced change). Only
    // enforced when a real timestamp is stored; iat is in seconds, with a small
    // clock-skew margin.
    if (user.passwordChangedAt && typeof decoded.iat === 'number') {
      const changedAtSec = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
      if (changedAtSec > decoded.iat + 5) {
        return res.status(401).json({ message: 'Session expired, please log in again' });
      }
    }

    // Attach the freshly-verified identity (authoritative role from the DB).
    req.user = { id: decoded.id, role: user.role, ua: decoded.ua };
    next();
  } catch (error: any) {
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};
