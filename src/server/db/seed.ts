/**
 * MedHit Task Manager - Seed Script Realista
 * Autor: MedHit Integrações & Automações
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
      email: "lucca.guidorizzi@medhit.com.br",
      role: "owner" as const,
      password: "x32kd58",
      mcpToken: "medtask_user_lucca_x32kd58_sec99",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucca",
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
      name: "Marketing",
      slug: "marketing",
      description: "Campanhas, Conteúdo, Tráfego Pago e Lançamentos MedHit.",
      icon: "megaphone",
      color: "#ec4899",
      projects: [
        {
          id: "proj-marketing-01",
          workspaceId: "ws-medhit-001",
          areaId: "area-1",
          name: "Marketing",
          slug: "marketing",
          description: "Quadro geral de demandas e campanhas de Marketing",
          icon: "megaphone",
          color: "#ec4899",
          methodology: "kanban" as const,
          statuses: [
            { id: "st-mkt-1", workspaceId: "ws-medhit-001", projectId: "proj-marketing-01", name: "A Fazer", color: "#94a3b8", position: 1, category: "todo" as const },
            { id: "st-mkt-2", workspaceId: "ws-medhit-001", projectId: "proj-marketing-01", name: "Em Andamento", color: "#38bdf8", position: 2, category: "in_progress" as const },
            { id: "st-mkt-3", workspaceId: "ws-medhit-001", projectId: "proj-marketing-01", name: "Em Revisão", color: "#f59e0b", position: 3, category: "review" as const },
            { id: "st-mkt-4", workspaceId: "ws-medhit-001", projectId: "proj-marketing-01", name: "Concluído", color: "#22c55e", position: 4, category: "done" as const },
          ],
          sprints: [],
        },
      ],
    },
    {
      name: "Integrações & Automações",
      slug: "integracoes-e-automacoes",
      description: "Pipelines n8n, Webhooks, Integrações CRM e Agentes Autônomos.",
      icon: "cpu",
      color: "#3b82f6",
      projects: [
        {
          id: "proj-integracoes-01",
          workspaceId: "ws-medhit-001",
          areaId: "area-2",
          name: "Integrações e Automações",
          slug: "integracoes-e-automacoes",
          description: "Quadro de automações n8n, webhooks e esteiras",
          icon: "cpu",
          color: "#3b82f6",
          methodology: "kanban" as const,
          statuses: [
            { id: "st-int-1", workspaceId: "ws-medhit-001", projectId: "proj-integracoes-01", name: "A Fazer", color: "#94a3b8", position: 1, category: "todo" as const },
            { id: "st-int-2", workspaceId: "ws-medhit-001", projectId: "proj-integracoes-01", name: "Em Andamento", color: "#38bdf8", position: 2, category: "in_progress" as const },
            { id: "st-int-3", workspaceId: "ws-medhit-001", projectId: "proj-integracoes-01", name: "Em Revisão", color: "#f59e0b", position: 3, category: "review" as const },
            { id: "st-int-4", workspaceId: "ws-medhit-001", projectId: "proj-integracoes-01", name: "Concluído", color: "#22c55e", position: 4, category: "done" as const },
          ],
          sprints: [],
        },
      ],
    },
  ],
};

console.log("MedHit Task Manager Seed Definitions Loaded com sucesso!");
