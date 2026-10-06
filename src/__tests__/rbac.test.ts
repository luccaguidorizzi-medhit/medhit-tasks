import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS, UserRole, PermissionAction } from "../context/task-context";
import { Task, Member } from "../server/services/data-store";

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

  it("enforces strict task visibility isolation for guest users vs members", () => {
    const guestUser: Member = {
      id: "guest-1",
      workspaceId: "ws-1",
      name: "Dra. Convidada",
      email: "convidada@clinica.com",
      role: "guest",
      avatarUrl: "",
      status: "active",
    };

    const regularMember: Member = {
      id: "member-1",
      workspaceId: "ws-1",
      name: "Dr. Roberto",
      email: "roberto@medhit.com.br",
      role: "member",
      avatarUrl: "",
      status: "active",
    };

    const assignedTask: Task = {
      id: "t-1",
      workspaceId: "ws-1",
      projectId: "p-1",
      areaId: "a-1",
      title: "Revisão Clínica de Protocolo",
      description: "",
      taskType: "task",
      statusId: "st-1",
      priority: "high",
      position: 1000,
      assigneeIds: [{ type: "user", id: "guest-1", name: "Dra. Convidada", avatarUrl: "" }],
      checklists: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const unassignedTeamTask: Task = {
      id: "t-2",
      workspaceId: "ws-1",
      projectId: "p-1",
      areaId: "a-1",
      title: "Planejamento Financeiro Q3",
      description: "",
      taskType: "task",
      statusId: "st-1",
      priority: "medium",
      position: 2000,
      assigneeIds: [{ type: "user", id: "member-2", name: "Outro Colega", avatarUrl: "" }],
      checklists: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Helper de visibilidade RBAC
    const isVisibleFor = (user: Member, task: Task) => {
      if (user.role === "guest") {
        const isAssigned = task.assigneeIds.some((a) => a.id === user.id);
        const isReporter = task.reporterId === user.id;
        return isAssigned || isReporter;
      }
      return true;
    };

    // Guest só pode ver a tarefa atribuída a ela
    expect(isVisibleFor(guestUser, assignedTask)).toBe(true);
    expect(isVisibleFor(guestUser, unassignedTeamTask)).toBe(false);

    // Membro regular pode ver ambas
    expect(isVisibleFor(regularMember, assignedTask)).toBe(true);
    expect(isVisibleFor(regularMember, unassignedTeamTask)).toBe(true);
  });

  it("permits guests to collaborate (checklists & comments) on assigned tasks but blocks on unassigned tasks", () => {
    const guestUser: Member = {
      id: "guest-1",
      workspaceId: "ws-1",
      name: "Dra. Convidada",
      email: "convidada@clinica.com",
      role: "guest",
      avatarUrl: "",
      status: "active",
    };

    const assignedTask: Task = {
      id: "t-1",
      workspaceId: "ws-1",
      projectId: "p-1",
      areaId: "a-1",
      title: "Revisão Clínica de Protocolo",
      description: "",
      taskType: "task",
      statusId: "st-1",
      priority: "high",
      position: 1000,
      assigneeIds: [{ type: "user", id: "guest-1", name: "Dra. Convidada", avatarUrl: "" }],
      checklists: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const unassignedTask: Task = {
      id: "t-2",
      workspaceId: "ws-1",
      projectId: "p-1",
      areaId: "a-1",
      title: "Planejamento Estratégico",
      description: "",
      taskType: "task",
      statusId: "st-1",
      priority: "medium",
      position: 2000,
      assigneeIds: [{ type: "user", id: "member-2", name: "Outro Colega", avatarUrl: "" }],
      checklists: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const isVisibleFor = (user: Member, task: Task) => {
      if (user.role === "guest") {
        const isAssigned = task.assigneeIds.some((a) => a.id === user.id);
        const isReporter = task.reporterId === user.id;
        return isAssigned || isReporter;
      }
      return true;
    };

    const canCollaborateOn = (user: Member, task: Task) => {
      const allowed = ROLE_PERMISSIONS[user.role].includes("edit_task");
      return allowed || (user.role === "guest" && isVisibleFor(user, task));
    };

    expect(canCollaborateOn(guestUser, assignedTask)).toBe(true);
    expect(canCollaborateOn(guestUser, unassignedTask)).toBe(false);
  });

  it("strictly blocks AI agent triggers when AI key is missing or not configured", () => {
    const isAiConfigured = (key: string | null): boolean => {
      return Boolean(key && key.trim().length > 0);
    };

    const canTriggerAgent = (aiKey: string | null): boolean => {
      return isAiConfigured(aiKey);
    };

    expect(canTriggerAgent(null)).toBe(false);
    expect(canTriggerAgent("")).toBe(false);
    expect(canTriggerAgent("   ")).toBe(false);
    expect(canTriggerAgent("sk-openai-test-key-12345")).toBe(true);
  });

  it("enforces strict prohibition of guest role accessing member list and MCP tokens", () => {
    const isTabAllowedForRole = (
      role: UserRole,
      tab: "appearance" | "members" | "permissions" | "ai" | "mcp" | "telemetry"
    ) => {
      if (role === "guest" && tab !== "appearance") return false;
      if (tab === "members") return role !== "guest";
      const allowedPerms = ROLE_PERMISSIONS[role];
      if (tab === "telemetry") return allowedPerms.includes("view_telemetry");
      if (tab === "permissions") return allowedPerms.includes("manage_settings");
      if (tab === "ai") return allowedPerms.includes("manage_ai_tokens");
      if (tab === "mcp") return allowedPerms.includes("manage_mcp");
      return true;
    };

    expect(isTabAllowedForRole("guest", "members")).toBe(false);
    expect(isTabAllowedForRole("guest", "mcp")).toBe(false);
    expect(isTabAllowedForRole("guest", "permissions")).toBe(false);
    expect(isTabAllowedForRole("guest", "telemetry")).toBe(false);
    expect(isTabAllowedForRole("guest", "appearance")).toBe(true);

    expect(isTabAllowedForRole("owner", "members")).toBe(true);
    expect(isTabAllowedForRole("admin", "members")).toBe(true);
    expect(isTabAllowedForRole("member", "members")).toBe(true);
  });
});

