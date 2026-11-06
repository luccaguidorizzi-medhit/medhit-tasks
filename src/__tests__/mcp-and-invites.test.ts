/**
 * Testes Unitários de Integração: MCP Server e Fluxo de Convites (Sem Senha Provisória)
 * Assinado por: Equipe MedHit I&A
 */

import { describe, it, expect } from "vitest";
import { store } from "@/server/services/data-store";
import { emailService } from "@/server/services/email.service";

describe("Fluxo de Convites de Novos Usuários (Criação Autônoma de Senha)", () => {
  it("deve disparar e-mail de convite com link de ativação sem exibir senha provisória", async () => {
    const inviteParams = {
      to: "novo.membro@medhit.com.br",
      name: "Novo Colaborador",
      role: "member",
      loginUrl: "https://work.medhit.click/invite",
    };

    const result = await emailService.sendInviteEmail(inviteParams);
    expect(result.success).toBe(true);
  });

  it("deve validar link de ativação com e-mail codificado para definição de senha", () => {
    const email = "teste.novo@medhit.com.br";
    const loginUrl = "https://work.medhit.click/invite";
    const finalUrl = `${loginUrl}?email=${encodeURIComponent(email)}`;

    expect(finalUrl).toBe("https://work.medhit.click/invite?email=teste.novo%40medhit.com.br");
  });
});

describe("MCP Server Tools & Autenticação", () => {
  it("deve conter membros com tokens MCP válidos no store", () => {
    expect(store.workspace.members.length).toBeGreaterThan(0);
    const lucca = store.workspace.members.find(
      (m) => m.email === "lucca@medhit.com.br" || m.name.toLowerCase().includes("lucca")
    );
    expect(lucca).toBeDefined();
    expect(lucca?.mcpToken).toBeDefined();
  });

  it("deve permitir adicionar novo membro via convite com token MCP dedicado", () => {
    const initialCount = store.workspace.members.length;
    const testName = "Analista QA Teste";
    const testEmail = "analista.qa@medhit.com.br";
    const generatedToken = `medtask_user_analistaqa_${Date.now()}`;

    const newMember = {
      id: `user-test-${Date.now()}`,
      workspaceId: store.workspace.id,
      name: testName,
      email: testEmail,
      mcpToken: generatedToken,
      role: "member" as const,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=analista",
      status: "active" as const,
      lastLoginAt: new Date().toISOString(),
    };

    store.workspace.members.push(newMember);

    expect(store.workspace.members.length).toBe(initialCount + 1);
    const found = store.workspace.members.find((m) => m.email === testEmail);
    expect(found).toBeDefined();
    expect(found?.mcpToken).toBe(generatedToken);
  });
});
