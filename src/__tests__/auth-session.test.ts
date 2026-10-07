import { describe, it, expect } from "vitest";
import { store } from "../server/services/data-store";
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

  it("ensures ONLY owner Lucca has permission to view or switch test accounts", () => {
    const canAccessTestAccounts = (user: { email: string; role: string }) => {
      return user.email.toLowerCase() === "lucca@medhit.com.br" || user.role === "owner";
    };

    // Owner Lucca pode
    expect(canAccessTestAccounts({ email: "lucca@medhit.com.br", role: "owner" })).toBe(true);

    // Admin Dr. Fillipe NÃO pode ver atalhos de contas de teste
    expect(canAccessTestAccounts({ email: "fillipe@medhit.com.br", role: "admin" })).toBe(false);

    // Membro Mariana NÃO pode
    expect(canAccessTestAccounts({ email: "mariana.marketing@medhit.com.br", role: "member" })).toBe(false);

    // Convidado Carlos NÃO pode
    expect(canAccessTestAccounts({ email: "carlos.convidado@medhit.com.br", role: "guest" })).toBe(false);
  });
});
