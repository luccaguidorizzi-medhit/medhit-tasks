/**
 * MedHit Task Manager - Seed Script Realista
 * Autor: Lagana Flow
 * Gera dados completos para Marketing e Automação com humanos e agentes de IA
 */

export const seedData = {
  workspace: {
    name: "MedHit",
    slug: "medhit",
    settings: {
      theme: "dark",
      aiEnabled: true,
      defaultLanguage: "pt-BR",
    },
  },
  members: [
    {
      name: "Lucca Lagana",
      email: "lucca@medhit.com.br",
      role: "owner" as const,
      password: "x32kd58",
      mcpToken: "medtask_user_lucca_x32kd58_sec99",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucca",
    },
    {
      name: "Dr. Fillipe",
      email: "fillipe@medhit.com.br",
      role: "admin" as const,
      password: "medhit_fillipe_2026",
      mcpToken: "medtask_user_fillipe_sec2026",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fillipe",
    },
    {
      name: "Mariana Costa (Marketing)",
      email: "mariana.marketing@medhit.com.br",
      role: "member" as const,
      password: "medhit_mariana_2026",
      mcpToken: "medtask_user_mariana_sec2026",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mariana",
    },
    {
      name: "Rafael Nogueira (Automação)",
      email: "rafael.automacao@medhit.com.br",
      role: "member" as const,
      password: "medhit_rafael_2026",
      mcpToken: "medtask_user_rafael_sec2026",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rafael",
    },
  ],
  agents: [
    {
      name: "MedCopy IA",
      slug: "medcopy-ia",
      role: "Copywriter & Estrategista de Conteúdo",
      model: "gemini-2.0-flash",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=MedCopy",
      description: "Especialista em redação persuasiva para médicos e cursos de saúde.",
      systemPrompt: "Você é um copywriter de elite da MedHit especializado no mercado médico.",
      allowedTools: ["generate_copy", "suggest_headlines", "review_seo"],
      status: "active" as const,
    },
    {
      name: "n8n Auditor IA",
      slug: "n8n-auditor-ia",
      role: "Auditor e Engenheiro de Integrações",
      model: "gemini-2.0-flash",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=n8nAuditor",
      description: "Monitora webhooks, analisa nós n8n e verifica integridade de payloads.",
      systemPrompt: "Você audita e valida fluxos do n8n para a MedHit.",
      allowedTools: ["inspect_workflow", "validate_payload", "report_incident"],
      status: "active" as const,
    },
    {
      name: "Triage Bot IA",
      slug: "triage-bot-ia",
      role: "Triagem Inteligente de Demandas",
      model: "gemini-2.0-flash",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=TriageBot",
      description: "Classifica formulários recebidos e encaminha para a squad correta.",
      systemPrompt: "Você analisa solicitações e sugere prioridade, prazos e responsáveis.",
      allowedTools: ["categorize_request", "assign_team", "estimate_effort"],
      status: "active" as const,
    },
  ],
  areas: [
    {
      name: "Marketing & Growth",
      slug: "marketing",
      description: "Campanhas, Conteúdo, Tráfego Pago e Lançamentos MedHit.",
      icon: "megaphone",
      color: "#ec4899",
      projects: [
        {
          name: "Lançamento Workshop Medicina Integrativa",
          slug: "workshop-medicina-integrativa",
          methodology: "kanban" as const,
          description: "Planejamento e execução de tráfego, criativos e páginas.",
          statuses: [
            { name: "Briefing & Ideias", category: "backlog" as const, color: "#64748b" },
            { name: "Criação de Conteúdo", category: "todo" as const, color: "#3b82f6" },
            { name: "Revisão Criativa", category: "review" as const, color: "#f59e0b", wipLimit: 3 },
            { name: "Aprovação Médica", category: "review" as const, color: "#8b5cf6" },
            { name: "Publicado / No Ar", category: "done" as const, color: "#10b981" },
          ],
          tasks: [
            {
              title: "Criar copy dos 5 anúncios de topo de funil (Meta Ads)",
              description: "Desenvolver variações de copy focando nas dores da rotina de plantões médicos.",
              taskType: "agent_task" as const,
              priority: "high" as const,
              statusName: "Criação de Conteúdo",
              assigneeAgentSlug: "medcopy-ia",
              aiContext: "Utilize tom respeitoso, ético (normas CFM) e com gancho direto para o workshop gratuito.",
              storyPoints: 5,
            },
            {
              title: "Aprovação de conformidade ética dos criativos com Dr. Fillipe",
              description: "Revisão obrigatória antes da veiculação de anúncios pagos.",
              taskType: "task" as const,
              priority: "urgent" as const,
              statusName: "Aprovação Médica",
              assigneeMemberEmail: "fillipe@medhit.com.br",
              storyPoints: 3,
            },
            {
              title: "Configuração do Pixel de Conversão na Landing Page",
              description: "Verificar disparo de PageView, Lead e Purchase com deduplicação CAPI.",
              taskType: "task" as const,
              priority: "medium" as const,
              statusName: "Publicado / No Ar",
              assigneeMemberEmail: "mariana.marketing@medhit.com.br",
              storyPoints: 2,
            },
          ],
        },
      ],
    },
    {
      name: "Automação & IA",
      slug: "automacao",
      description: "Pipelines n8n, Webhooks, Integrações CRM e Agentes Autônomos.",
      icon: "cpu",
      color: "#3b82f6",
      projects: [
        {
          name: "Esteira de Integrações n8n & Supabase",
          slug: "esteira-n8n-supabase",
          methodology: "scrum" as const,
          description: "Desenvolvimento e refatoração de nós críticos de automação comercial.",
          statuses: [
            { name: "Backlog Técnico", category: "backlog" as const, color: "#64748b" },
            { name: "Sprint Backlog", category: "todo" as const, color: "#0ea5e9" },
            { name: "Em Desenvolvimento", category: "in_progress" as const, color: "#3b82f6", wipLimit: 4 },
            { name: "Em Testes / QA", category: "review" as const, color: "#f59e0b" },
            { name: "Em Produção", category: "done" as const, color: "#10b981" },
          ],
          tasks: [
            {
              title: "Auditar idempotência do webhook de vendas do Stripe para Supabase",
              description: "Garantir que retries não dupliquem transações nem registros na tabela de vendas.",
              taskType: "agent_task" as const,
              priority: "urgent" as const,
              statusName: "Em Desenvolvimento",
              assigneeAgentSlug: "n8n-auditor-ia",
              aiContext: "Analise o payload do evento 'invoice.paid' e valide os índices de verificação por transaction_id.",
              storyPoints: 8,
            },
            {
              title: "Implementar fila de re-tentativa com Dead Letter Queue no n8n",
              description: "Capturar erros de timeout da API de WhatsApp e agendar 3 tentativas com backoff.",
              taskType: "task" as const,
              priority: "high" as const,
              statusName: "Sprint Backlog",
              assigneeMemberEmail: "rafael.automacao@medhit.com.br",
              storyPoints: 5,
            },
            {
              title: "Automatizar triagem de novos leads vindos do formulário do site",
              description: "Classificar leads com IA e direcionar para os atendentes conforme a pontuação.",
              taskType: "task" as const,
              priority: "medium" as const,
              statusName: "Em Produção",
              assigneeMemberEmail: "lucca@medhit.com.br",
              storyPoints: 3,
            },
          ],
        },
      ],
    },
  ],
};

console.log("MedHit Task Manager Seed Definitions Loaded com sucesso!");
