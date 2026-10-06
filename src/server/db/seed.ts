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
      projects: [],
    },
    {
      name: "Automação & IA",
      slug: "automacao",
      description: "Pipelines n8n, Webhooks, Integrações CRM e Agentes Autônomos.",
      icon: "cpu",
      color: "#3b82f6",
      projects: [],
    },
  ],
};

console.log("MedHit Task Manager Seed Definitions Loaded com sucesso!");
