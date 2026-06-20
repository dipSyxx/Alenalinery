export function isProtectedAdminPath(pathname: string): boolean {
  return pathname === "/admin" || (pathname.startsWith("/admin/") && pathname !== "/admin/login");
}
