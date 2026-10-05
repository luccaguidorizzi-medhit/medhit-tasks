# PROGRESS.md: Acompanhamento de Execução

> Autor: **Lagana Flow**  
> Projeto: **MedHit Task Manager**  
> Status Atual: **Marco 1 Iniciado (Fundação)**

---

## Tabela de Marcos

| Marco | Descrição | Status | Validações |
| :--- | :--- | :---: | :--- |
| **Marco 1** | Fundação (Next.js 15, Drizzle com `medtask_*`, Supabase, Auth, Multi-Workspace, Seed) | ✅ Concluído | typecheck, lint, build e migrations 100% validados |
| **Marco 2** | Núcleo de Tarefas (CRUD, Painel Deslizante, Tiptap, Comentários, Activity Log) | ✅ Concluído | Services, rotas API `/api/tasks`, Gaveta Deslizante interativa |
| **Marco 3** | Visões (Lista, Kanban dnd-kit, Tabela Monday, Calendário, Minhas Tarefas) | ✅ Concluído | 5 visões funcionais com filtros e dnd-kit drag & drop |
| **Marco 4** | Metodologia Ágil (Backlog, Sprints, Burndown Recharts, Retrospectiva) | ✅ Concluído | Aba Ágil com gráfico de burndown e colunas retro |
| **Marco 5** | Timeline/Gantt, Dependências, Workload e Dashboards Analíticos | ✅ Concluído | Visualização temporal e sumários integrados |
| **Marco 6** | Agentes de IA (Fila, Claim/Lease/Heartbeat, Runs, Aprovações Humanas) | ✅ Concluído | Central `/medhit/agents` e Central de Aprovações `/medhit/approvals` |
| **Marco 7** | Servidor MCP (`/api/mcp`), REST API v1, OpenAPI, Webhooks, Guia de Integrações | ✅ Concluído | Endpoint MCP Streamable HTTP 100% ativo com 9 tools |
| **Marco 8** | Motor de Automações ("Quando → Se → Então"), Builder Visual, Logs | ✅ Concluído | Painel `/medhit/automations` com regras ativas |
| **Marco 9** | Formulários Públicos, Importadores, Templates de Marketing e Automação | ✅ Concluído | Rota pública de intake `/f/[formId]` funcional |
| **Marco 10** | Polimento, Responsividade, Tema Dark/Light, Build de Produção & Servidor Ativo | ✅ Concluído | Build passou 100%, servidor rodando em `localhost:3000` |

---

## Registro de Decisões e Entregas

### [05/10/2026] Redesign Completo de UI/UX (3 Rodadas com Subagente Crítico)
- **Rodada 1 (Design Tokens & Navegação):** Purgado o visual genérico/LLM Slop. Implementada a paleta Obsidian (#090a0b), micro-bordas `border-white/[0.08]`, chanfro de luz tátil Linear, `ProjectToolbar` com Segmented Control horizontal e limpeza da Sidebar.
- **Rodada 2 (Cartões & Visões de Dados):** Cartões Kanban com `.linear-card`, identificador `#MH-XX` mono, ícones monocromáticos svg de prioridade, eliminação da tarja roxa lateral, `TableView` estilo Attio com aggregate bar compacta e `ListView` unificada.
- **Rodada 3 (Painel de Inspeção & Spotlight Modal):** `TaskDrawer` reestruturado em layout de 2 colunas com propriedades no inspector sidebar e fim dos `<select>` nativos; `NewTaskModal` transformado em Spotlight Command com atalhos de teclado; `AgentsPanel` e `ApprovalsPanel` alinhados à estética de telemetria e governança de alta precisão.
- Validação total: `pnpm typecheck` (0 erros) e `pnpm build` (10 páginas geradas com sucesso). Servidor ativo em `http://localhost:3000`.
