import { describe, expect, it } from "vitest";

import { isProtectedAdminPath } from "@/lib/auth/routes";

describe("admin route protection", () => {
  it("protects admin pages while leaving the login page public", () => {
    expect(isProtectedAdminPath("/admin")).toBe(true);
    expect(isProtectedAdminPath("/admin/bookings")).toBe(true);
    expect(isProtectedAdminPath("/admin/login")).toBe(false);
    expect(isProtectedAdminPath("/booking")).toBe(false);
  });
});
