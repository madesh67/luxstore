export type Permission =
  | "MANAGE_OWN_ACCOUNT"
  | "VIEW_OWN_ORDERS"
  | "MANAGE_PRODUCTS"
  | "MANAGE_ORDERS"
  | "FULL_ACCESS";

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  GUEST: [],
  CUSTOMER: ["MANAGE_OWN_ACCOUNT", "VIEW_OWN_ORDERS"],
  ADMIN: [
    "MANAGE_OWN_ACCOUNT",
    "VIEW_OWN_ORDERS",
    "MANAGE_PRODUCTS",
    "MANAGE_ORDERS",
  ],
  SUPERADMIN: [
    "MANAGE_OWN_ACCOUNT",
    "VIEW_OWN_ORDERS",
    "MANAGE_PRODUCTS",
    "MANAGE_ORDERS",
    "FULL_ACCESS",
  ],
};

/**
 * Checks if a role has the required permission, falling back to full access.
 */
export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role.toUpperCase()] || [];
  return permissions.includes(permission) || permissions.includes("FULL_ACCESS");
}

/**
 * Checks if a user's role meets the minimum required role hierarchy level.
 */
export function hasRole(userRole: string | undefined, requiredRole: "CUSTOMER" | "ADMIN" | "SUPERADMIN"): boolean {
  if (!userRole) return false;
  const roleHierarchy = {
    CUSTOMER: 1,
    ADMIN: 2,
    SUPERADMIN: 3,
  };

  const userWeight = roleHierarchy[userRole.toUpperCase() as keyof typeof roleHierarchy] || 0;
  const requiredWeight = roleHierarchy[requiredRole] || 99;

  return userWeight >= requiredWeight;
}
