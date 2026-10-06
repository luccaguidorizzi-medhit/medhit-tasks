# PLAN.md: MedHit Task Manager (Plataforma de Gestão de Trabalho & Agentes de IA)

> Autor: **MedHit Integrações & Automações**  
> Data: 05/10/2026  
> Versão do Plano: 1.0.0

---

## 1. Arquitetura do Sistema

```
[ Cliente Web: Next.js 15 (React 19, Tailwind v4, TanStack Query/Table, dnd-kit, Tiptap, cmdk) ]
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
   [ Server Actions & API Routes ]                    [ Servidor MCP (/api/mcp) ]
   (Auth Session, Validação Zod)                     (Bearer API Key, Streamable HTTP)
              │                                               │
              └───────────────────────┬───────────────────────┘
                                      ▼
                        [ /src/server/services ]
               (Camada única de Regras de Negócio e Permissões)
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
     [ Drizzle ORM ]        [ Supabase Realtime ]     [ Vercel AI SDK ]
    (PostgreSQL Schema)     (Presence & Broadcast)   (Gemini, OpenAI, etc.)
              │
              ▼
   [ Supabase PostgreSQL ]
  (Tabelas isoladas `medtask_*` com RLS + Storage)
```

### Decisões Técnicas Fundamentais:
1. **Isolamento de Dados no Banco:** Todas as tabelas recebem o prefixo unificado `medtask_` para garantir total separação e integridade no PostgreSQL do MedHit (`medhit-intelligence`), sem qualquer interferência com dados de CRM ou vendas.
2. **Multi-Tenancy por Workspace:** Todas as entidades possuem chave estrangeira `workspace_id` vinculada a `medtask_workspaces`. O RLS garante que nenhum dado vaze entre organizações.
3. **Serviços Unificados (`/src/server/services`):** O servidor MCP, as rotas de API pública (`/api/v1/*`), os Webhooks, as automações e a UI gráfica utilizam exatamente a mesma camada de serviços.
4. **Agentes como Entidades Nativas:** Agentes possuem cadastro na tabela `medtask_agents`, chaves de API próprias, fila de claim atômico com lease/heartbeat e pipeline de aprovações (`medtask_approvals`).
5. **Automações Internas e Webhooks:** Mecanismo desacoplado baseado em eventos que processa gatilhos e executa ações de atualização ou disparo de IA.

---

## 2. Modelo de Dados Completo (Drizzle / PostgreSQL)

Todas as entidades possuem:
- `id`: UUID Primary Key (`defaultRandom()`)
- `created_at`: Timestamp com fuso horário
- `updated_at`: Timestamp com fuso horário
- `deleted_at`: Timestamp opcional para soft-delete
- `workspace_id`: UUID referenciando `medtask_workspaces`

### 2.1 Organização e Acesso
- **`medtask_workspaces`**: id, name, slug, logo_url, settings (JSONB), owner_id, created_at, updated_at
- **`medtask_members`**: id, workspace_id, user_id, email, name, avatar_url, role (`owner` | `admin` | `member` | `guest`), status, created_at
- **`medtask_areas`**: id, workspace_id, name, slug, description, icon, color, created_at, updated_at
- **`medtask_area_members`**: id, area_id, member_id, role (`lead` | `member` | `viewer`)
- **`medtask_projects`**: id, workspace_id, area_id, name, slug, description, icon, color, methodology (`simple` | `kanban` | `scrum` | `scrumban`), settings (JSONB), created_at, updated_at
- **`medtask_project_members`**: id, project_id, member_id, role (`lead` | `member` | `viewer`)

### 2.2 Tarefas e Itens de Trabalho
- **`medtask_statuses`**: id, workspace_id, project_id, name, color, position, category (`backlog` | `todo` | `in_progress` | `review` | `done` | `cancelled`), wip_limit, definition_of_done
- **`medtask_tasks`**: id, workspace_id, project_id, area_id, title, description, task_type (`task` | `bug` | `story` | `epic` | `subtask` | `agent_task`), status_id, priority (`urgent` | `high` | `medium` | `low` | `none`), reporter_id, parent_id, epic_id, sprint_id, position (float/LexoRank), start_date, due_date, estimated_hours, story_points, ai_context, custom_fields (JSONB), recurrence_rule, created_at, updated_at, deleted_at
- **`medtask_task_assignees`**: id, task_id, assignee_type (`user` | `agent`), assignee_id, assigned_at
- **`medtask_task_dependencies`**: id, task_id, depends_on_task_id, dependency_type (`blocks` | `blocked_by` | `relates_to` | `duplicates`)
- **`medtask_checklists`**: id, task_id, title, position, created_at
- **`medtask_checklist_items`**: id, checklist_id, title, is_completed, completed_by, position, due_date
- **`medtask_labels`**: id, workspace_id, project_id, name, color
- **`medtask_task_labels`**: id, task_id, label_id
- **`medtask_custom_field_definitions`**: id, workspace_id, project_id, name, field_type (`text` | `number` | `select` | `multi_select` | `date` | `member` | `url` | `checkbox` | `currency`), options (JSONB)
- **`medtask_comments`**: id, workspace_id, task_id, author_type (`user` | `agent` | `system`), author_id, content, reactions (JSONB), parent_comment_id, created_at, updated_at
- **`medtask_attachments`**: id, workspace_id, task_id, file_name, file_size, mime_type, storage_path, public_url, uploaded_by, created_at
- **`medtask_time_entries`**: id, workspace_id, task_id, user_id, description, duration_seconds, started_at, ended_at, is_running

### 2.3 Metodologia Ágil
- **`medtask_sprints`**: id, workspace_id, project_id, name, goal, status (`future` | `active` | `completed`), start_date, end_date, capacity_points, committed_points, completed_points, created_at
- **`medtask_releases`**: id, workspace_id, project_id, name, description, version, release_date, status
- **`medtask_views`**: id, workspace_id, project_id, user_id, name, view_type (`list` | `board` | `table` | `calendar` | `timeline` | `backlog`), filters (JSONB), grouping (JSONB), sorting (JSONB), columns (JSONB), is_shared

### 2.4 Agentes de IA e Execução Autônoma
- **`medtask_agents`**: id, workspace_id, name, slug, avatar_url, description, role, model, system_prompt, allowed_tools (JSONB), max_concurrent_tasks, monthly_token_budget, current_tokens_used, timeout_seconds, status (`active` | `paused` | `error`), owner_user_id, created_at, updated_at
- **`medtask_agent_runs`**: id, workspace_id, agent_id, task_id, status (`queued` | `claimed` | `running` | `waiting_approval` | `completed` | `failed` | `cancelled`), started_at, completed_at, heartbeat_at, lease_expires_at, token_usage (JSONB), cost_estimate, error_message
- **`medtask_agent_run_events`**: id, run_id, event_type (`thought` | `tool_call` | `tool_result` | `message` | `error`), content (JSONB), created_at
- **`medtask_approvals`**: id, workspace_id, task_id, run_id, agent_id, requested_action, payload (JSONB), status (`pending` | `approved` | `rejected` | `adjusted`), reviewed_by, review_comment, reviewed_at, created_at

### 2.5 Automações, Formulários e Auditoria
- **`medtask_automations`**: id, workspace_id, project_id, name, is_active, trigger_type, trigger_config (JSONB), conditions (JSONB), actions (JSONB), created_at
- **`medtask_automation_runs`**: id, automation_id, task_id, status, error, executed_at
- **`medtask_forms`**: id, workspace_id, project_id, title, description, slug, is_public, field_mapping (JSONB), created_at
- **`medtask_form_submissions`**: id, form_id, task_id, payload (JSONB), submitted_at
- **`medtask_notifications`**: id, workspace_id, recipient_id, title, message, link, is_read, created_at
- **`medtask_activity_log`**: id, workspace_id, project_id, task_id, actor_type (`user` | `agent` | `automation` | `system`), actor_id, action, before_state (JSONB), after_state (JSONB), created_at
- **`medtask_api_keys`**: id, workspace_id, user_id, agent_id, name, key_hash, prefix, scopes (JSONB), last_used_at, expires_at, created_at
- **`medtask_webhooks_out`**: id, workspace_id, name, url, secret, event_types (JSONB), is_active, created_at
- **`medtask_webhook_deliveries`**: id, webhook_id, payload (JSONB), status_code, response_body, success, attempt, created_at

---

## 3. Estrutura de Pastas

```
medhit-tasks/
├── drizzle/                     # Migrações SQL versionadas
├── docs/                        # Documentação (MCP.md, API.md, IMPORT.md, DEPLOY.md)
├── tests/                       # Testes Vitest (unit/services) e Playwright (e2e)
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/              # Rotas de login / onboarding
│   │   ├── (app)/               # Aplicação autenticada
│   │   │   └── [workspace]/
│   │   │       ├── dashboard/
│   │   │       ├── my-tasks/
│   │   │       ├── approvals/
│   │   │       ├── agents/
│   │   │       ├── workload/
│   │   │       ├── automations/
│   │   │       ├── settings/
│   │   │       └── [area]/[project]/
│   │   │           ├── board/
│   │   │           ├── list/
│   │   │           ├── table/
│   │   │           ├── calendar/
│   │   │           ├── timeline/
│   │   │           ├── backlog/
│   │   │           └── sprint/
│   │   ├── api/
│   │   │   ├── v1/              # REST API pública + openapi.json
│   │   │   ├── mcp/             # Endpoint Model Context Protocol (Streamable HTTP)
│   │   │   ├── cron/            # Vercel Cron jobs
│   │   │   └── webhooks/        # Webhook receivers
│   │   └── f/[formId]/          # Formulários públicos de solicitação
│   ├── components/
│   │   ├── ui/                  # Componentes de base shadcn/ui
│   │   ├── layout/              # Sidebar, Topbar, Breadcrumbs
│   │   ├── tasks/               # Detalhes, gaveta deslizante, modal, timer
│   │   ├── boards/              # Kanban, Swimlanes, dnd-kit
│   │   ├── views/               # Tabela Monday, Lista, Calendário, Gantt
│   │   ├── agile/               # Backlog, Sprint Board, Burndown, Retrospectiva
│   │   ├── agents/              # Painel de Agentes, Fila, Runs, Logs
│   │   └── automations/         # Builder visual "Quando -> Se -> Então"
│   ├── server/
│   │   ├── db/                  # Conexão Drizzle, schemas e relações
│   │   ├── repositories/        # Acesso a dados com tipagem
│   │   ├── services/            # ÚNICA FONTE DE VERDADE de regras de negócio
│   │   ├── policies/            # Permissões e RLS helpers
│   │   ├── mcp/                 # Definição de MCP Tools, Prompts e Resources
│   │   ├── importers/           # Trello, ClickUp, Monday e CSV
│   │   └── agents/              # Loop de execução, lease, heartbeat e approvals
│   ├── lib/
│   │   ├── env.ts               # Validação Zod de variáveis de ambiente
│   │   ├── utils.ts
│   │   ├── i18n/                # Dicionários pt-BR
│   │   └── hotkeys.ts           # Atalhos de teclado
│   └── hooks/                   # React hooks (Query, Realtime, Hotkeys)
├── AGENTS.md
├── PLAN.md
├── PROGRESS.md
├── README.md
├── vercel.json
├── .env.example
└── package.json
```

---

## 4. Cronograma de Marcos e Entregas

- **Marco 1: Fundação** — Inicialização do projeto Next.js 15, TypeScript estrito, Tailwind v4, Drizzle schema com prefixo `medtask_`, migrations, auth mock/Supabase, multi-workspace e seed realista (Marketing e Automação).
- **Marco 2: Núcleo de Tarefas** — CRUD completo em `/server/services/tasks.service.ts`, painel lateral deslizante, rich text Tiptap, checklists, subtarefas, comentários com menções, anexos, activity log e paleta `cmdk`.
- **Marco 3: Visões de Trabalho** — Lista agrupável, Kanban fluido (dnd-kit) com WIP limit, Tabela estilo Monday com filtros/fórmulas, Calendário e Minhas Tarefas com sincronização em tempo real.
- **Marco 4: Metodologia Ágil** — Backlog refinável, ranking persistente, gestão de Sprints, Burndown chart, Velocity, Sprint Board e painel de Retrospectiva.
- **Marco 5: Visões Avançadas e Governança** — Timeline/Gantt com dependências visuais, painel de carga de trabalho (humanos + agentes) e dashboards analíticos (CFD, throughput, lead/cycle time).
- **Marco 6: Agentes de IA de Primeira Classe** — Catálogo de agentes, fila prioritária, claim atômico com lease/heartbeat, log de runs/eventos, tela de aprovações pendentes (Human-in-the-loop) e observabilidade.
- **Marco 7: Servidor MCP & API Pública** — Endpoint `/api/mcp` (Streamable HTTP) com tools de leitura, escrita e ciclo de vida de agentes, API REST `/api/v1/*`, documentação OpenAPI e página de integrações.
- **Marco 8: Automações Visuais** — Engine de gatilhos, condições e ações ("Quando -> Se -> Então"), templates prontos e log de execuções.
- **Marco 9: Formulários e Importadores** — Formulário público `/f/[formId]`, importadores estruturados de Trello (JSON), ClickUp (CSV/JSON), Monday (CSV) e templates de onboarding.
- **Marco 10: Polimento, Acessibilidade & Produção** — Tema claro/escuro impecável, atalhos de teclado, responsividade mobile, suite de testes Vitest, verificação de build e documentação completa.
