import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS, UserRole, PermissionAction } from "../context/task-context";

describe("RBAC Permissions Matrix", () => {
  it("allows owner to perform all critical and sensitive operations", () => {
    const ownerPerms = ROLE_PERMISSIONS["owner"];
    expect(ownerPerms).toContain("view_telemetry");
    expect(ownerPerms).toContain("manage_members");
    expect(ownerPerms).toContain("manage_settings");
    expect(ownerPerms).toContain("change_member_role");
    expect(ownerPerms).toContain("manage_ai_tokens");
    expect(ownerPerms).toContain("delete_team");
  });

  it("allows admin to view telemetry and manage members, but restricts owner-exclusive privileges", () => {
    const adminPerms = ROLE_PERMISSIONS["admin"];
    expect(adminPerms).toContain("view_telemetry");
    expect(adminPerms).toContain("manage_members");
    expect(adminPerms).toContain("manage_settings");
    expect(adminPerms).not.toContain("manage_ai_tokens");
    expect(adminPerms).not.toContain("delete_team");
  });

  it("strictly forbids members and guests from accessing telemetry and user management", () => {
    const memberPerms = ROLE_PERMISSIONS["member"];
    expect(memberPerms).not.toContain("view_telemetry");
    expect(memberPerms).not.toContain("manage_members");
    expect(memberPerms).not.toContain("manage_settings");
    expect(memberPerms).not.toContain("change_member_role");
    expect(memberPerms).toContain("create_task");
    expect(memberPerms).toContain("edit_task");

    const guestPerms = ROLE_PERMISSIONS["guest"];
    expect(guestPerms).toHaveLength(0);
  });

  it("verifies hasPermission helper evaluation for all roles", () => {
    const checkPerm = (role: UserRole, action: PermissionAction): boolean => {
      return ROLE_PERMISSIONS[role].includes(action);
    };

    expect(checkPerm("owner", "view_telemetry")).toBe(true);
    expect(checkPerm("admin", "view_telemetry")).toBe(true);
    expect(checkPerm("member", "view_telemetry")).toBe(false);
    expect(checkPerm("guest", "view_telemetry")).toBe(false);

    expect(checkPerm("owner", "create_task")).toBe(true);
    expect(checkPerm("admin", "create_task")).toBe(true);
    expect(checkPerm("member", "create_task")).toBe(true);
    expect(checkPerm("guest", "create_task")).toBe(false);
  });
});
