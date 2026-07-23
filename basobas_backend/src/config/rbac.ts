// Role-Based Access Control matrix (least-privilege).
//
// Each role is granted only the permissions it needs. A normal `user` gets the
// permissions of a renter/lister; `admin` additionally gets moderation and user
// management. Route handlers gate on a permission, not on a role name, so access
// can be tightened without touching every route.

export type Role = "user" | "admin";

export const PERMISSIONS = {
  PROPERTY_CREATE: "property:create",       // list a new property
  PROPERTY_WRITE_OWN: "property:write:own", // update/delete own listing
  PROPERTY_MODERATE: "property:moderate",   // approve/reject/status/assign (admin)
  BOOKING_CREATE: "booking:create",         // request a booking
  BOOKING_MANAGE_OWN: "booking:manage:own", // cancel own / decide on own property's requests
  CONVERSATION_PARTICIPATE: "conversation:participate",
  FAVORITE_MANAGE: "favorite:manage",
  NOTIFICATION_READ: "notification:read",
  PROFILE_WRITE_OWN: "profile:write:own",   // edit own profile
  USER_MANAGE: "user:manage",               // admin CRUD on users
  USER_PROMOTE: "user:promote",             // grant admin
  ADMIN_ACCESS: "admin:access",             // read admin dashboards/data
  AUDIT_READ: "audit:read",                 // read the security audit log (admin)
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const userPermissions: Permission[] = [
  PERMISSIONS.PROPERTY_CREATE,
  PERMISSIONS.PROPERTY_WRITE_OWN,
  PERMISSIONS.BOOKING_CREATE,
  PERMISSIONS.BOOKING_MANAGE_OWN,
  PERMISSIONS.CONVERSATION_PARTICIPATE,
  PERMISSIONS.FAVORITE_MANAGE,
  PERMISSIONS.NOTIFICATION_READ,
  PERMISSIONS.PROFILE_WRITE_OWN,
];

const adminPermissions: Permission[] = [
  ...userPermissions,
  PERMISSIONS.PROPERTY_MODERATE,
  PERMISSIONS.USER_MANAGE,
  PERMISSIONS.USER_PROMOTE,
  PERMISSIONS.ADMIN_ACCESS,
  PERMISSIONS.AUDIT_READ,
];

export const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  user: new Set(userPermissions),
  admin: new Set(adminPermissions),
};

export function roleHasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role as Role];
  return perms ? perms.has(permission) : false;
}
