/**
 * MedHit Task Manager - Email Service via Resend
 * Desenvolvido por: MedHit Integrações & Automações
 * 
 * Envio de e-mails transacionais com design moderno, tipografia limpa,
 * alto contraste e foco total em Gestão de Tarefas & Projetos (Linear / ClickUp style).
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

export interface SendTaskAssignedParams {
  to: string;
  name: string;
  taskTitle: string;
  taskUrl: string;
  projectName?: string;
  dueDate?: string;
  priority?: string;
  assignedBy?: string;
}

export const emailService = {
  /**
   * Envia convite de acesso ao Medhit WorkTrack para definição de senha e início de trabalho
   */
  async sendInviteEmail({
    to,
    name,
    invitedBy = "MedHit",
    role,
    password,
    mcpToken,
    loginUrl = "https://work.medhit.click/invite",
  }: SendInviteEmailParams) {
    const roleLabels: Record<string, string> = {
      owner: "Proprietário (Owner)",
      admin: "Administrador",
      member: "Membro da Equipe",
      guest: "Convidado / Visualizador",
    };

    const roleName = roleLabels[role] || role;
    const finalUrl = `${loginUrl}?email=${encodeURIComponent(to)}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acesso Liberado - Medhit WorkTrack</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #070d1a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { padding: 0; }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #070d1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #0b1426; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
    
    <!-- Top Header com Logo Oficial MedHit -->
    <div style="padding: 36px 32px 28px; background: linear-gradient(180deg, #131f38 0%, #0b1426 100%); border-bottom: 1px solid #1e2d4a; text-align: center;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding-bottom: 14px;">
            <img src="https://work.medhit.click/medhit_logo_extracted.png" alt="MedHit Logo" width="56" height="56" style="display: block; margin: 0 auto; border: 0; outline: none; border-radius: 14px;" />
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom: 12px;">
            <span style="display: inline-block; padding: 5px 16px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; background-color: rgba(14, 165, 233, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35);">
              Medhit WorkTrack
            </span>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom: 6px;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
              Seu Acesso Foi Concedido
            </h1>
          </td>
        </tr>
        <tr>
          <td align="center">
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">
              Bem-vindo ao workspace oficial de gestão da MedHit.
            </p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Corpo do Email -->
    <div style="padding: 36px 32px;">
      <p style="font-size: 15px; line-height: 1.7; color: #e2e8f0; margin: 0 0 24px;">
        Olá, <strong style="color: #ffffff;">${name}</strong>!<br>
        Seu acesso ao <strong>Medhit WorkTrack</strong> foi liberado. Acesse a plataforma para gerenciar projetos, acompanhar entregas e colaborar com o time.
      </p>

      <!-- Cartao de Detalhes da Conta com espacamento robusto e colunas independentes -->
      <div style="background-color: #101c36; border: 1px solid #1e2f4f; border-radius: 14px; padding: 18px 24px; margin-bottom: 28px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td align="left" width="45%" style="width: 45%; padding: 14px 10px 14px 0; color: #94a3b8; font-size: 13px; font-weight: 500; text-align: left; vertical-align: middle; border-bottom: 1px solid #1a2944;">
              E-mail Cadastrado
            </td>
            <td align="right" width="55%" style="width: 55%; padding: 14px 0 14px 10px; color: #f1f5f9; font-size: 13px; font-weight: 600; text-align: right; vertical-align: middle; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; border-bottom: 1px solid #1a2944;">
              ${to}
            </td>
          </tr>
          <tr>
            <td align="left" width="45%" style="width: 45%; padding: 14px 10px 14px 0; color: #94a3b8; font-size: 13px; font-weight: 500; text-align: left; vertical-align: middle; border-bottom: 1px solid #1a2944;">
              Nível de Acesso
            </td>
            <td align="right" width="55%" style="width: 55%; padding: 14px 0 14px 10px; color: #38bdf8; font-size: 13px; font-weight: 700; text-align: right; vertical-align: middle; border-bottom: 1px solid #1a2944;">
              ${roleName}
            </td>
          </tr>
          <tr>
            <td align="left" width="45%" style="width: 45%; padding: 14px 10px 14px 0; color: #94a3b8; font-size: 13px; font-weight: 500; text-align: left; vertical-align: middle;">
              Status da Conta
            </td>
            <td align="right" width="55%" style="width: 55%; padding: 14px 0 14px 10px; color: #34d399; font-size: 13px; font-weight: 700; text-align: right; vertical-align: middle;">
              Aguardando Ativação
            </td>
          </tr>
        </table>
      </div>

      <!-- Botao de Acao Destacado -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 24px; text-align: center;">
        <tr>
          <td align="center">
            <a href="${finalUrl}" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 15px 38px; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.45); text-align: center;">
              Ativar Minha Conta
            </a>
          </td>
        </tr>
      </table>

      <!-- Fallback Link -->
      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 24px 0 0; line-height: 1.6;">
        Se o botão não funcionar, copie e cole este link no seu navegador:<br>
        <a href="${finalUrl}" target="_blank" style="color: #38bdf8; word-break: break-all; text-decoration: none;">${finalUrl}</a>
      </p>
    </div>

    <!-- Rodape Corporativo -->
    <div style="padding: 24px 32px; text-align: center; background-color: #080f1d; border-top: 1px solid #16233b; font-size: 12px; color: #64748b; line-height: 1.6;">
      <p style="margin: 0 0 4px;"><strong style="color: #94a3b8;">Medhit WorkTrack</strong> • Gestão de Tarefas &amp; Projetos</p>
      <p style="margin: 0;">Mantido e operado por <strong style="color: #94a3b8;">Equipe MedHit I&amp;A</strong></p>
    </div>
  </div>
</body>
</html>`;

    if (!resend) {
      console.log(`[Resend Simulação] E-mail de convite para: ${to}`);
      return {
        success: true,
        mocked: true,
        message: "E-mail simulado com sucesso (RESEND_API_KEY ausente)",
        preview: { to, role: roleName },
      };
    }

    try {
      const response = await resend.emails.send({
        from: "Medhit WorkTrack <notifications@medhit.click>",
        to: [to],
        subject: "Bem-vindo ao Medhit WorkTrack: Acesso Liberado",
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

  async sendTaskAssignedEmail({
    to,
    name,
    taskTitle,
    taskUrl,
    projectName = "Medhit WorkTrack",
    dueDate,
    priority,
    assignedBy = "MedHit",
  }: SendTaskAssignedParams) {
    if (!resend) {
      console.log(`[Resend Simulação] Tarefa "${taskTitle}" atribuída para ${to}`);
      return { success: true, mocked: true };
    }

    const priorityLabels: Record<string, { label: string; color: string }> = {
      urgent: { label: "Urgente", color: "#ef4444" },
      high: { label: "Alta", color: "#f97316" },
      medium: { label: "Média", color: "#eab308" },
      low: { label: "Baixa", color: "#38bdf8" },
      none: { label: "Normal", color: "#94a3b8" },
    };

    const prioInfo = priority ? priorityLabels[priority] || { label: priority, color: "#38bdf8" } : null;

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Tarefa Atribuída - Medhit WorkTrack</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 580px;
      margin: 40px auto;
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .header {
      padding: 32px 32px 24px;
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      border-bottom: 1px solid #1e293b;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background-color: rgba(14, 165, 233, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.35);
      margin-bottom: 12px;
    }
    .title {
      margin: 0 0 6px;
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .body {
      padding: 32px;
    }
    .card {
      background-color: #131d35;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 20px 24px;
      margin: 20px 0 28px;
    }
    .task-title {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 16px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #1e293b;
      font-size: 13px;
    }
    .row:last-child {
      border-bottom: none;
    }
    .label {
      color: #94a3b8;
    }
    .val {
      color: #ffffff;
      font-weight: 600;
    }
    .btn-wrap {
      text-align: center;
      margin: 28px 0 12px;
    }
    .btn {
      display: inline-block;
      background-color: #0284c7;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 36px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
    }
    .footer {
      padding: 20px 32px;
      text-align: center;
      background-color: #090e1a;
      border-top: 1px solid #1e293b;
      font-size: 12px;
      color: #64748b;
    }
    .footer strong {
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="badge">Medhit WorkTrack</div>
      <h1 class="title">Nova Tarefa Atribuída</h1>
    </div>

    <div class="body">
      <p style="font-size: 15px; color: #e2e8f0; margin: 0 0 16px; line-height: 1.6;">
        Olá, <strong>${name}</strong>! <strong>${assignedBy}</strong> atribuiu uma nova tarefa para você no projeto <strong>${projectName}</strong>:
      </p>

      <div class="card">
        <div class="task-title">${taskTitle}</div>
        <div class="row">
          <span class="label">Projeto</span>
          <span class="val">${projectName}</span>
        </div>
        ${
          prioInfo
            ? `
        <div class="row">
          <span class="label">Prioridade</span>
          <span class="val" style="color: ${prioInfo.color};">${prioInfo.label}</span>
        </div>
        `
            : ""
        }
        ${
          dueDate
            ? `
        <div class="row">
          <span class="label">Data de Entrega</span>
          <span class="val">${dueDate}</span>
        </div>
        `
            : ""
        }
      </div>

      <div class="btn-wrap">
        <a href="${taskUrl}" class="btn">Abrir Tarefa</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0;">Medhit WorkTrack • Desenvolvido e mantido por <strong>MedHit Integrações &amp; Automações</strong></p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      const response = await resend.emails.send({
        from: "Medhit WorkTrack <notifications@medhit.click>",
        to: [to],
        subject: `Nova Tarefa: ${taskTitle}`,
        html: htmlContent,
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Envia e-mail de Boas-Vindas com foco total em Gestão de Tarefas & Projetos
   */
  async sendWelcomeEmail({
    to,
    name,
    loginUrl = "https://work.medhit.click",
  }: SendWelcomeEmailParams) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Medhit WorkTrack</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    .email-container {
      max-width: 580px;
      margin: 40px auto;
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .header {
      padding: 40px 32px 32px;
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      border-bottom: 1px solid #1e293b;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background-color: rgba(14, 165, 233, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.35);
      margin-bottom: 16px;
    }
    .title {
      margin: 0 0 8px;
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .subtitle {
      margin: 0;
      font-size: 15px;
      color: #94a3b8;
    }
    .body {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 15px;
      line-height: 1.6;
      color: #e2e8f0;
      margin: 0 0 24px;
    }
    .feature-list {
      background-color: #131d35;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 32px;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 12px 0;
      border-bottom: 1px solid #1e293b;
    }
    .feature-item:first-child {
      padding-top: 0;
    }
    .feature-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .feature-icon {
      font-size: 18px;
      line-height: 1;
      margin-top: 2px;
    }
    .feature-text {
      font-size: 13px;
      line-height: 1.5;
      color: #cbd5e1;
    }
    .feature-text strong {
      color: #ffffff;
      display: block;
      margin-bottom: 2px;
      font-size: 14px;
    }
    .btn-wrap {
      text-align: center;
      margin: 32px 0 16px;
    }
    .btn {
      display: inline-block;
      background-color: #0284c7;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 40px;
      border-radius: 10px;
      letter-spacing: 0.01em;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
    }
    .footer {
      padding: 24px 32px;
      text-align: center;
      background-color: #090e1a;
      border-top: 1px solid #1e293b;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer strong {
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="badge">Medhit WorkTrack</div>
      <h1 class="title">Bem-vindo à Plataforma!</h1>
      <p class="subtitle">Gestão de Tarefas &amp; Projetos em Alta Performance</p>
    </div>

    <div class="body">
      <p class="greeting">
        Olá, <strong>${name}</strong>!<br>
        Seu ambiente de trabalho no <strong>Medhit WorkTrack</strong> está pronto para uso. Acompanhe entregáveis, priorize atividades e colabore de forma simples e eficiente.
      </p>

      <div class="feature-list">
        <div class="feature-item">
          <div class="feature-icon">📋</div>
          <div class="feature-text">
            <strong>Múltiplas Visualizações</strong>
            Alterne entre Tabela plana, Quadro Kanban e Calendário de prazos com um clique.
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🎯</div>
          <div class="feature-text">
            <strong>Minhas Tarefas Centralizadas</strong>
            Visualize todas as suas atividades em um único painel, independente do projeto.
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">⚡</div>
          <div class="feature-text">
            <strong>Produtividade &amp; Prazos</strong>
            Classificação clara por prioridades, status em tempo real e datas limites.
          </div>
        </div>
      </div>

      <div class="btn-wrap">
        <a href="${loginUrl}" class="btn">Acessar o Medhit WorkTrack</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 4px;"><strong>Medhit WorkTrack</strong> • Gestão de Tarefas &amp; Projetos</p>
      <p style="margin: 0;">Desenvolvido e mantido por <strong>MedHit Integrações &amp; Automações</strong></p>
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
        message: "E-mail simulado com sucesso (RESEND_API_KEY ausente)",
        to,
        subject: "Bem-vindo ao Medhit WorkTrack: Plataforma Ativa!",
      };
    }

    try {
      const response = await resend.emails.send({
        from: "Medhit WorkTrack <notifications@medhit.click>",
        to: [to],
        subject: "Bem-vindo ao Medhit WorkTrack: Plataforma Ativa!",
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
