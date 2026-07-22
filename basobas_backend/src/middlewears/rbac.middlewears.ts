import { Request, Response, NextFunction } from "express";
import { Permission, roleHasPermission } from "../config/rbac";

/**
 * Require the authenticated user's role to hold a specific permission.
 * Must run AFTER `authorize` (which attaches req.user with { id, role }).
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!roleHasPermission(user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
}
