export function isProtectedAdminPath(pathname: string): boolean {
  return pathname === "/admin" || (pathname.startsWith("/admin/") && pathname !== "/admin/login");
}

export function getSafeAdminRedirectPath(value: FormDataEntryValue | string | null | undefined): string {
  if (typeof value !== "string" || value.trim() === "") {
    return "/admin";
  }

  try {
    const url = new URL(value, "https://alenalinery.local");
    if (url.origin !== "https://alenalinery.local" || !isProtectedAdminPath(url.pathname)) {
      return "/admin";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin";
  }
}
