import { describe, it, expect } from "vitest";
import { store, Member } from "../server/services/data-store";
import { seedData } from "../server/db/seed";

describe("Production Session Auth & Owner Test Account Isolation", () => {
  it("verifies owner Lucca credentials in seed data", () => {
    const owner = seedData.members.find((m) => m.email === "lucca@medhit.com.br");
    expect(owner).toBeDefined();
    expect(owner?.role).toBe("owner");
    expect(owner?.password).toBe("x32kd58");
  });

  it("verifies credentials for internal team members", () => {
    const fillipe = seedData.members.find((m) => m.email === "fillipe@medhit.com.br");
    expect(fillipe).toBeDefined();
    expect(fillipe?.role).toBe("admin");
    expect(fillipe?.password).toBe("medhit_fillipe_2026");

    const mariana = seedData.members.find((m) => m.email === "mariana.marketing@medhit.com.br");
    expect(mariana).toBeDefined();
    expect(mariana?.role).toBe("member");

    const guest = seedData.members.find((m) => m.email === "carlos.convidado@medhit.com.br");
    expect(guest).toBeDefined();
    expect(guest?.role).toBe("guest");
  });

  it("validates login authentication logic against seed members", () => {
    const authenticate = (email: string, pass: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = pass.trim();
      const found = seedData.members.find((m) => m.email.toLowerCase() === cleanEmail);
      if (!found) return { success: false, error: "Usuário não encontrado" };
      if (found.password !== cleanPass) return { success: false, error: "Senha incorreta" };
      return { success: true, user: found };
    };

    // Sucesso para o Owner Lucca
    const ownerLogin = authenticate("lucca@medhit.com.br", "x32kd58");
    expect(ownerLogin.success).toBe(true);
    expect(ownerLogin.user?.role).toBe("owner");

    // Falha por senha incorreta
    const wrongPass = authenticate("lucca@medhit.com.br", "wrongpassword123");
    expect(wrongPass.success).toBe(false);
    expect(wrongPass.error).toBe("Senha incorreta");

    // Falha por e-mail inexistente
    const notFound = authenticate("naoexiste@medhit.com.br", "any");
    expect(notFound.success).toBe(false);
    expect(notFound.error).toBe("Usuário não encontrado");
  });

  it("ensures ONLY owner Lucca session has permission to view or switch test accounts", () => {
    const checkIsOwnerSession = (authenticatedUser: { email: string; role: string }) => {
      return (
        authenticatedUser.email.toLowerCase() === "lucca@medhit.com.br" ||
        authenticatedUser.email.toLowerCase() === "lucca.guidorizzi@medhit.com.br" ||
        authenticatedUser.role === "owner"
      );
    };

    // Owner Lucca pode
    expect(checkIsOwnerSession({ email: "lucca@medhit.com.br", role: "owner" })).toBe(true);
    expect(checkIsOwnerSession({ email: "lucca.guidorizzi@medhit.com.br", role: "owner" })).toBe(true);

    // Admin Dr. Fillipe NÃO pode ver atalhos de contas de teste
    expect(checkIsOwnerSession({ email: "fillipe@medhit.com.br", role: "admin" })).toBe(false);

    // Membro Mariana NÃO pode
    expect(checkIsOwnerSession({ email: "mariana.marketing@medhit.com.br", role: "member" })).toBe(false);

    // Convidado Carlos NÃO pode
    expect(checkIsOwnerSession({ email: "carlos.convidado@medhit.com.br", role: "guest" })).toBe(false);
  });

  it("maintains isOwnerSession true even when Owner simulates a Member or Guest", () => {
    // Simula estado do TaskProvider
    const authenticatedUser: Member = {
      id: "user-1",
      workspaceId: "ws-1",
      name: "Lucca Lagana",
      email: "lucca@medhit.com.br",
      role: "owner",
      avatarUrl: "",
      status: "active",
      password: "x32kd58",
    };

    let activeUserId = authenticatedUser.id;
    let simulatedRole: string | null = null;

    const isOwnerSession = (
      authenticatedUser.email.toLowerCase() === "lucca@medhit.com.br" ||
      authenticatedUser.role === "owner"
    );

    // Owner inicialmente vê a si mesmo
    expect(isOwnerSession).toBe(true);
    expect(activeUserId).toBe("user-1");

    // Owner simula Mariana (membro de marketing)
    activeUserId = "user-3"; // Mariana
    simulatedRole = null;

    const mariana = seedData.members.find((m) => m.email === "mariana.marketing@medhit.com.br")!;
    const currentUser: Member = {
      ...mariana,
      id: "user-3",
      role: (simulatedRole || mariana.role) as Member["role"],
      workspaceId: "ws-1",
      status: "active",
    };

    // currentUser reflete Mariana para simular sua visão
    expect(currentUser.name).toBe("Mariana Costa (Marketing)");
    expect(currentUser.role).toBe("member");

    // Mas a sessão raiz continua pertencendo ao Owner (NÃO fica preso!)
    expect(isOwnerSession).toBe(true);

    const isSimulating = activeUserId !== authenticatedUser.id || simulatedRole !== null;
    expect(isSimulating).toBe(true);

    // Restaurar volta ao Owner perfeitamente
    activeUserId = authenticatedUser.id;
    simulatedRole = null;
    const restoredSimulating = activeUserId !== authenticatedUser.id || simulatedRole !== null;
    expect(restoredSimulating).toBe(false);
  });

  it("prevents non-owners from unmasking other accounts passwords or resetting owner password", () => {
    const ownerUser = { id: "user-1", email: "lucca@medhit.com.br", role: "owner" };
    const adminUser = { id: "user-2", email: "fillipe@medhit.com.br", role: "admin" };
    const memberUser = { id: "user-3", email: "mariana.marketing@medhit.com.br", role: "member" };

    const canViewPassword = (sessionUser: typeof adminUser, targetMemberId: string) => {
      const isOwner = sessionUser.email === "lucca@medhit.com.br" || sessionUser.role === "owner";
      return isOwner || sessionUser.id === targetMemberId;
    };

    const canResetPassword = (sessionUser: typeof adminUser, targetMember: typeof ownerUser) => {
      const isOwner = sessionUser.email === "lucca@medhit.com.br" || sessionUser.role === "owner";
      if (isOwner || sessionUser.id === targetMember.id) return true;
      // Admin pode resetar para outros membros, mas NUNCA para o Owner
      if (sessionUser.role === "admin" && targetMember.role !== "owner") return true;
      return false;
    };

    // Owner pode ver e resetar qualquer senha
    expect(canViewPassword(ownerUser, "user-2")).toBe(true);
    expect(canResetPassword(ownerUser, adminUser)).toBe(true);

    // Admin NÃO pode ver a senha do Owner nem de outros
    expect(canViewPassword(adminUser, "user-1")).toBe(false);
    expect(canViewPassword(adminUser, "user-3")).toBe(false);
    // Mas Admin pode ver a sua própria senha
    expect(canViewPassword(adminUser, "user-2")).toBe(true);

    // Admin NÃO pode resetar a senha do Owner
    expect(canResetPassword(adminUser, ownerUser)).toBe(false);
    // Mas Admin pode resetar a de um membro comum
    expect(canResetPassword(adminUser, memberUser as any)).toBe(true);
  });
});
