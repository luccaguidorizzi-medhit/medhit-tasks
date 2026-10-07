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
      padding: 36px 32px 28px;
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
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .subtitle {
      margin: 0;
      font-size: 14px;
      color: #94a3b8;
    }
    .body {
      padding: 32px;
    }
    .greeting {
      font-size: 15px;
      line-height: 1.6;
      color: #e2e8f0;
      margin: 0 0 24px;
    }
    .card {
      background-color: #131d35;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 28px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #1e293b;
      font-size: 13px;
    }
    .row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .row:first-child {
      padding-top: 0;
    }
    .label {
      color: #94a3b8;
      font-weight: 500;
    }
    .val {
      color: #ffffff;
      font-weight: 600;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
    }
    .btn-wrap {
      text-align: center;
      margin: 28px 0;
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
      <h1 class="title">Seu Acesso Foi Concedido</h1>
      <p class="subtitle">Bem-vindo ao workspace oficial da MedHit.</p>
    </div>

    <div class="body">
      <p class="greeting">
        Olá, <strong>${name}</strong>!<br>
        Seu acesso ao <strong>Medhit WorkTrack</strong> foi liberado. Acesse a plataforma para gerenciar projetos, acompanhar entregas e colaborar com o time.
      </p>

      <div class="card">
        <div class="row">
          <span class="label">E-mail Cadastrado</span>
          <span class="val">${to}</span>
        </div>
        <div class="row">
          <span class="label">Nível de Acesso</span>
          <span class="val" style="color: #38bdf8;">${roleName}</span>
        </div>
        ${
          password
            ? `
        <div class="row">
          <span class="label">Senha Provisória</span>
          <span class="val" style="color: #34d399;">${password}</span>
        </div>
        `
            : `
        <div class="row">
          <span class="label">Primeiro Acesso</span>
          <span class="val" style="color: #38bdf8;">Defina sua senha no link</span>
        </div>
        `
        }
      </div>

      <div class="btn-wrap">
        <a href="${finalUrl}" class="btn">Ativar Minha Conta</a>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 20px 0 0;">
        Se o botão não funcionar, copie e cole este link no seu navegador:<br>
        <a href="${finalUrl}" style="color: #38bdf8; word-break: break-all;">${finalUrl}</a>
      </p>
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
      console.log(`[Resend Simulação] E-mail de convite para: ${to}`);
      return {
        success: true,
        mocked: true,
        message: "E-mail simulado com sucesso (RESEND_API_KEY ausente)",
        preview: { to, role: roleName, password },
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

  /**
   * Envia notificação de tarefa atribuída
   */
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
