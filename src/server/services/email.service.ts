/**
 * MedHit Task Manager - Email Service via Resend
 * Desenvolvido por: MedHit Integrações & Automações
 * 
 * Envio de e-mails transacionais com templates modernos, logo MedHit e boas práticas.
 */

import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendInviteEmailParams {
  to: string;
  name: string;
  invitedBy?: string;
  role: string;
  password?: string;
  mcpToken?: string;
  loginUrl?: string;
}

export interface SendWelcomeEmailParams {
  to: string;
  name: string;
  loginUrl?: string;
}

export interface SendPasswordResetParams {
  to: string;
  name: string;
  resetUrl: string;
}

export interface SendTaskAssignedParams {
  to: string;
  name: string;
  taskTitle: string;
  taskUrl: string;
  assignedBy?: string;
}

export const emailService = {
  /**
   * Envia convite de acesso ao MedHit Tasks com credenciais provisórias e MCP Token
   */
  async sendInviteEmail({
    to,
    name,
    invitedBy = "Lucca Lagana",
    role,
    password,
    mcpToken,
    loginUrl = "https://medhit-tasks.vercel.app/medhit",
  }: SendInviteEmailParams) {
    const roleLabels: Record<string, string> = {
      owner: "Proprietário (Owner)",
      admin: "Administrador",
      member: "Membro da Equipe",
      guest: "Convidado Especial",
    };

    const roleName = roleLabels[role] || role;

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acesso Liberado - MedHit Tasks</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #070e1e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background: #0b152d;
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .header {
      padding: 36px 32px 24px;
      text-align: center;
      background: linear-gradient(180deg, rgba(14, 165, 233, 0.12) 0%, rgba(11, 21, 45, 0) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .logo-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      margin: 12px 0 6px;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
    }
    .content {
      padding: 32px;
    }
    .card-info {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 13px;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
    }
    .info-value {
      color: #f1f5f9;
      font-weight: 600;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 20px;
    }
    .btn {
      display: inline-block;
      background: #0284c7;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
    }
    .mcp-box {
      margin-top: 24px;
      padding: 16px;
      background: rgba(8, 145, 178, 0.08);
      border: 1px dashed rgba(56, 189, 248, 0.35);
      border-radius: 10px;
    }
    .mcp-title {
      font-size: 12px;
      font-weight: 700;
      color: #38bdf8;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .mcp-token {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      color: #7dd3fc;
      word-break: break-all;
      background: rgba(0, 0, 0, 0.3);
      padding: 8px;
      border-radius: 6px;
    }
    .footer {
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 12px;
      color: #64748b;
      background: rgba(7, 14, 30, 0.5);
    }
    .footer-signature {
      font-weight: 600;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-container">
        <span class="badge">MedHit Tasks</span>
      </div>
      <h1 class="title">Seu Acesso Foi Concedido</h1>
      <p class="subtitle">Você foi convidado por <strong>${invitedBy}</strong> para o workspace.</p>
    </div>

    <div class="content">
      <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">
        Olá, <strong>${name}</strong>!<br>
        Sua conta no <strong>MedHit Task Manager</strong> está ativa. Você agora pode colaborar em projetos, gerenciar quadros, sprints e integrar agentes de IA.
      </p>

      <div class="card-info">
        <div class="info-row">
          <span class="info-label">E-mail de Login</span>
          <span class="info-value">${to}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nível de Permissão</span>
          <span class="info-value" style="color: #38bdf8;">${roleName}</span>
        </div>
        ${
          password
            ? `
        <div class="info-row">
          <span class="info-label">Senha de Acesso</span>
          <span class="info-value" style="color: #4ade80;">${password}</span>
        </div>
        `
            : ""
        }
      </div>

      <div class="btn-container">
        <a href="${loginUrl}" class="btn">Entrar na Plataforma</a>
      </div>

      ${
        mcpToken
          ? `
      <div class="mcp-box">
        <div class="mcp-title">🔌 Seu Token MCP Individual</div>
        <p style="font-size: 11px; color: #94a3b8; margin: 0 0 8px;">
          Use este token para autenticar seu IDE Cursor, Claude Desktop ou Antigravity:
        </p>
        <div class="mcp-token">${mcpToken}</div>
      </div>
      `
          : ""
      }
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px;">MedHit Gestão de Alta Performance & Esteiras Ágeis</p>
      <p class="footer-signature" style="margin: 0;">Desenvolvido e mantido por <strong>MedHit Integrações &amp; Automações</strong></p>
    </div>
  </div>
</body>
</html>
    `;

    if (!resend) {
      console.log(`[Resend Simulação] Chave RESEND_API_KEY não configurada. E-mail preparado para: ${to}`);
      console.log(`[Resend Simulação] Assunto: Convite de Acesso - MedHit Tasks`);
      return {
        success: true,
        mocked: true,
        message: "E-mail simulado com sucesso (configure RESEND_API_KEY para envio real via SMTP/API)",
        preview: { to, role: roleName, password, mcpToken },
      };
    }

    try {
      const response = await resend.emails.send({
        from: "MedHit Tasks <notificacoes@medhit.click>",
        to: [to],
        subject: `Bem-vindo ao MedHit Tasks: Acesso Liberado por ${invitedBy}`,
        html: htmlContent,
      });

      return {
        success: true,
        mocked: false,
        data: response,
      };
    } catch (error) {
      console.error("[Resend Error]", error);
      return {
        success: false,
        error: String(error),
      };
    }
  },

  /**
   * Envia notificação de tarefa atribuída
   */
  async sendTaskAssignedEmail({
    to,
    name,
    taskTitle,
    taskUrl,
    assignedBy = "Lucca Lagana",
  }: SendTaskAssignedParams) {
    if (!resend) {
      console.log(`[Resend Simulação] Notificação de tarefa "${taskTitle}" para ${to}`);
      return { success: true, mocked: true };
    }

    try {
      const response = await resend.emails.send({
        from: "MedHit Tasks <notificacoes@medhit.click>",
        to: [to],
        subject: `Nova Tarefa Atribuída: ${taskTitle}`,
        html: `
          <div style="font-family: sans-serif; background: #070e1e; color: #fff; padding: 30px; border-radius: 12px;">
            <h2>Olá, ${name}!</h2>
            <p><strong>${assignedBy}</strong> atribuiu uma nova tarefa a você:</p>
            <p style="font-size: 16px; font-weight: bold; color: #38bdf8;">${taskTitle}</p>
            <a href="${taskUrl}" style="display: inline-block; background: #0284c7; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Ver Tarefa no MedHit Tasks</a>
            <p style="font-size: 11px; color: #64748b; margin-top: 20px;">Assinado por MedHit Integrações &amp; Automações</p>
          </div>
        `,
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Envia e-mail de Boas-Vindas com template de alta qualidade e logo da MedHit
   */
  async sendWelcomeEmail({
    to,
    name,
    loginUrl = "https://medhit-tasks.vercel.app/medhit",
  }: SendWelcomeEmailParams) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao MedHit Tasks</title>
  <style>
    body { margin: 0; padding: 0; background-color: #070e1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #0b152d; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6); }
    .header { padding: 40px 32px 28px; text-align: center; background: linear-gradient(180deg, rgba(14, 165, 233, 0.15) 0%, rgba(11, 21, 45, 0) 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
    .badge { display: inline-block; padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .title { font-size: 26px; font-weight: 800; color: #ffffff; margin: 16px 0 6px; letter-spacing: -0.02em; }
    .subtitle { font-size: 14px; color: #94a3b8; margin: 0; }
    .content { padding: 36px 32px; font-size: 14px; line-height: 1.6; }
    .feature-box { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .feature-item { margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #cbd5e1; }
    .feature-item:last-child { margin-bottom: 0; }
    .btn-container { text-align: center; margin: 32px 0 20px; }
    .btn { display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 14px 34px; border-radius: 10px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4); }
    .footer { padding: 24px 32px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; color: #64748b; background: rgba(7, 14, 30, 0.5); }
    .footer-signature { font-weight: 600; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="badge">MedHit Tasks</span>
      <h1 class="title">Bem-vindo à Plataforma!</h1>
      <p class="subtitle">Gestão Cirúrgica de Tarefas & Agentes de IA</p>
    </div>
    <div class="content">
      <p style="margin-top: 0;">
        Olá, <strong>${name}</strong>!<br>
        Seu ambiente de trabalho no <strong>MedHit Task Manager</strong> está configurado e pronto para uso.
      </p>
      <div class="feature-box">
        <div class="feature-item">⚡ <strong>Visões Flexíveis:</strong> Alterne entre Quadro Kanban, Lista com Agrupamento, Tabela e Calendário em tempo real.</div>
        <div class="feature-item">🎯 <strong>Matriz de Priorização:</strong> Organize suas tarefas por urgência e impacto (Matriz Eisenhower).</div>
        <div class="feature-item">🤖 <strong>Agentes Autônomos & MCP:</strong> Conecte seus agentes com tokens dedicados por usuário.</div>
      </div>
      <div class="btn-container">
        <a href="${loginUrl}" class="btn">Acessar o MedHit Tasks</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">MedHit • Gestão de Alta Performance & Esteiras Ágeis</p>
      <p class="footer-signature" style="margin: 0;">Desenvolvido e mantido por <strong>MedHit Integrações &amp; Automações</strong></p>
    </div>
  </div>
</body>
</html>
    `;

    if (!resend) {
      console.log(`[Resend Simulação] E-mail de Boas-Vindas preparado para: ${to}`);
      return {
        success: true,
        mocked: true,
        message: "E-mail de boas-vindas registrado em ambiente local (configure RESEND_API_KEY para disparo SMTP real)",
        to,
        subject: "Bem-vindo ao MedHit Tasks: Plataforma Ativa!",
      };
    }

    try {
      const response = await resend.emails.send({
        from: "MedHit Tasks <notificacoes@medhit.click>",
        to: [to],
        subject: "Bem-vindo ao MedHit Tasks: Plataforma Ativa!",
        html: htmlContent,
      });

      return {
        success: true,
        mocked: false,
        data: response,
      };
    } catch (error) {
      console.error("[Resend Error]", error);
      return {
        success: false,
        error: String(error),
      };
    }
  },
};
