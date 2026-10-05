/**
 * MedHit Task Manager - In-Memory & Database Data Store
 * Mantido por: Lagana Flow
 * Fornece persistência e estado reativo para desenvolvimento local e produção
 */

import { seedData } from "@/server/db/seed";

export interface Member {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member" | "guest";
  avatarUrl: string;
  status: "active" | "inactive";
}

export interface Agent {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  role: string;
  model: string;
  avatarUrl: string;
  description: string;
  systemPrompt: string;
  allowedTools: string[];
  maxConcurrentTasks: number;
  monthlyTokenBudget: number;
  currentTokensUsed: number;
  timeoutSeconds: number;
  status: "active" | "paused" | "error";
}

export interface Status {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  color: string;
  position: number;
  category: "backlog" | "todo" | "in_progress" | "review" | "done" | "cancelled";
  wipLimit?: number;
  definitionOfDone?: string;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  title: string;
  isCompleted: boolean;
  completedBy?: string;
  dueDate?: string;
}

export interface Checklist {
  id: string;
  taskId: string;
  title: string;
  items: ChecklistItem[];
}

export interface Comment {
  id: string;
  taskId: string;
  authorType: "user" | "agent" | "system";
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  taskId?: string;
  projectId?: string;
  actorType: "user" | "agent" | "automation" | "system";
  actorName: string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  projectId: string;
  areaId: string;
  title: string;
  description: string;
  taskType: "task" | "bug" | "story" | "epic" | "subtask" | "agent_task";
  statusId: string;
  priority: "urgent" | "high" | "medium" | "low" | "none";
  position: number;
  reporterId?: string;
  assigneeIds: { type: "user" | "agent"; id: string; name: string; avatarUrl: string }[];
  parentId?: string;
  epicId?: string;
  sprintId?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  storyPoints?: number;
  aiContext?: string;
  tags?: string[];
  checklists: Checklist[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  goal: string;
  status: "future" | "active" | "completed";
  startDate: string;
  endDate: string;
  capacityPoints: number;
  committedPoints: number;
  completedPoints: number;
}

export interface Project {
  id: string;
  workspaceId: string;
  areaId: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  methodology: "simple" | "kanban" | "scrum" | "scrumban";
  statuses: Status[];
  sprints: Sprint[];
}

export interface Area {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  projects: Project[];
}

export interface AgentRun {
  id: string;
  workspaceId: string;
  agentId: string;
  agentName: string;
  taskId: string;
  taskTitle: string;
  status: "queued" | "claimed" | "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt?: string;
  tokenUsage: { prompt: number; completion: number; total: number };
  costEstimate: number;
  events: {
    id: string;
    type: "thought" | "tool_call" | "tool_result" | "message" | "error";
    content: string;
    createdAt: string;
  }[];
  errorMessage?: string;
}

export interface Approval {
  id: string;
  workspaceId: string;
  taskId: string;
  taskTitle: string;
  agentId: string;
  agentName: string;
  runId: string;
  requestedAction: string;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "adjusted";
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  areas: Area[];
  members: Member[];
  agents: Agent[];
}

// ==========================================
// SINGLETON GLOBAL STORE INITIALIZATION
// ==========================================

const WORKSPACE_ID = "ws-medhit-001";

function initializeData(): {
  workspace: Workspace;
  tasks: Task[];
  agentRuns: AgentRun[];
  approvals: Approval[];
  activities: ActivityItem[];
} {
  const members: Member[] = seedData.members.map((m, idx) => ({
    id: `user-${idx + 1}`,
    workspaceId: WORKSPACE_ID,
    name: m.name,
    email: m.email,
    role: m.role,
    avatarUrl: m.avatarUrl,
    status: "active",
  }));

  const agents: Agent[] = seedData.agents.map((a, idx) => ({
    id: `agent-${idx + 1}`,
    workspaceId: WORKSPACE_ID,
    name: a.name,
    slug: a.slug,
    role: a.role,
    model: a.model,
    avatarUrl: a.avatarUrl,
    description: a.description,
    systemPrompt: a.systemPrompt,
    allowedTools: a.allowedTools,
    maxConcurrentTasks: 3,
    monthlyTokenBudget: 5000000,
    currentTokensUsed: 142000,
    timeoutSeconds: 300,
    status: a.status,
  }));

  const areas: Area[] = [];
  const tasks: Task[] = [];
  let taskCounter = 1;

  seedData.areas.forEach((areaSeed, areaIdx) => {
    const areaId = `area-${areaIdx + 1}`;
    const projectList: Project[] = [];

    areaSeed.projects.forEach((projSeed, projIdx) => {
      const projId = `proj-${areaIdx + 1}-${projIdx + 1}`;
      const statusList: Status[] = projSeed.statuses.map((st, stIdx) => ({
        id: `status-${areaIdx + 1}-${projIdx + 1}-${stIdx + 1}`,
        workspaceId: WORKSPACE_ID,
        projectId: projId,
        name: st.name,
        color: st.color,
        position: stIdx * 1000,
        category: st.category,
        wipLimit: (st as { wipLimit?: number }).wipLimit,
      }));

      const sprintList: Sprint[] = projSeed.methodology === "scrum" ? [
        {
          id: `sprint-${projId}-1`,
          workspaceId: WORKSPACE_ID,
          projectId: projId,
          name: "Sprint 14: Estabilidade de Webhooks",
          goal: "Garantir idempotência e re-tentativa com DLQ em todas as rotas do n8n",
          status: "active",
          startDate: "2026-10-01T00:00:00Z",
          endDate: "2026-10-15T23:59:59Z",
          capacityPoints: 25,
          committedPoints: 16,
          completedPoints: 3,
        },
        {
          id: `sprint-${projId}-2`,
          workspaceId: WORKSPACE_ID,
          projectId: projId,
          name: "Sprint 15: Novos Agentes e Triagem",
          goal: "Integrar triagem automática de leads e relatórios diários",
          status: "future",
          startDate: "2026-10-16T00:00:00Z",
          endDate: "2026-10-30T23:59:59Z",
          capacityPoints: 30,
          committedPoints: 0,
          completedPoints: 0,
        }
      ] : [];

      projSeed.tasks.forEach((t) => {
        const foundStatus = statusList.find((s) => s.name === t.statusName) || statusList[0];
        const assignees: Task["assigneeIds"] = [];

        if ("assigneeAgentSlug" in t && t.assigneeAgentSlug) {
          const ag = agents.find((a) => a.slug === t.assigneeAgentSlug);
          if (ag) {
            assignees.push({
              type: "agent",
              id: ag.id,
              name: ag.name,
              avatarUrl: ag.avatarUrl,
            });
          }
        }

        if ("assigneeMemberEmail" in t && t.assigneeMemberEmail) {
          const mb = members.find((m) => m.email === t.assigneeMemberEmail);
          if (mb) {
            assignees.push({
              type: "user",
              id: mb.id,
              name: mb.name,
              avatarUrl: mb.avatarUrl,
            });
          }
        }

        tasks.push({
          id: `task-${taskCounter++}`,
          workspaceId: WORKSPACE_ID,
          projectId: projId,
          areaId: areaId,
          title: t.title,
          description: t.description,
          taskType: t.taskType,
          statusId: foundStatus.id,
          priority: t.priority,
          position: taskCounter * 1000,
          reporterId: members[0].id,
          assigneeIds: assignees,
          sprintId: sprintList[0]?.id,
          storyPoints: t.storyPoints,
          aiContext: t.aiContext,
          checklists: [
            {
              id: `chk-${taskCounter}`,
              taskId: `task-${taskCounter}`,
              title: "Critérios de Aceite",
              items: [
                {
                  id: `chk-item-${taskCounter}-1`,
                  checklistId: `chk-${taskCounter}`,
                  title: "Definição clara do escopo",
                  isCompleted: true,
                },
                {
                  id: `chk-item-${taskCounter}-2`,
                  checklistId: `chk-${taskCounter}`,
                  title: "Revisão e validação em ambiente de staging",
                  isCompleted: false,
                },
              ],
            },
          ],
          comments: [
            {
              id: `comm-${taskCounter}-1`,
              taskId: `task-${taskCounter}`,
              authorType: "user",
              authorId: members[0].id,
              authorName: members[0].name,
              authorAvatar: members[0].avatarUrl,
              content: "Iniciando a demanda com foco nas diretrizes do plano de marketing.",
              createdAt: "2026-10-04T14:30:00Z",
            },
          ],
          createdAt: "2026-10-04T10:00:00Z",
          updatedAt: "2026-10-05T07:00:00Z",
        });
      });

      projectList.push({
        id: projId,
        workspaceId: WORKSPACE_ID,
        areaId: areaId,
        name: projSeed.name,
        slug: projSeed.slug,
        description: projSeed.description,
        icon: "layout",
        color: areaSeed.color,
        methodology: projSeed.methodology,
        statuses: statusList,
        sprints: sprintList,
      });
    });

    areas.push({
      id: areaId,
      workspaceId: WORKSPACE_ID,
      name: areaSeed.name,
      slug: areaSeed.slug,
      description: areaSeed.description,
      icon: areaSeed.icon,
      color: areaSeed.color,
      projects: projectList,
    });
  });

  const agentRuns: AgentRun[] = [
    {
      id: "run-001",
      workspaceId: WORKSPACE_ID,
      agentId: agents[0].id,
      agentName: agents[0].name,
      taskId: tasks[0].id,
      taskTitle: tasks[0].title,
      status: "running",
      startedAt: "2026-10-05T07:15:00Z",
      tokenUsage: { prompt: 1420, completion: 680, total: 2100 },
      costEstimate: 0.0035,
      events: [
        {
          id: "ev-1",
          type: "thought",
          content: "Analisando contexto de IA da tarefa: Tom ético e foco em médicos plantonistas.",
          createdAt: "2026-10-05T07:15:02Z",
        },
        {
          id: "ev-2",
          type: "tool_call",
          content: "generate_copy({ audience: 'médicos plantonistas', angle: 'liberdade de agenda' })",
          createdAt: "2026-10-05T07:15:10Z",
        },
        {
          id: "ev-3",
          type: "tool_result",
          content: "5 variações de copy geradas com ganchos de alta conversão.",
          createdAt: "2026-10-05T07:15:25Z",
        },
      ],
    },
    {
      id: "run-002",
      workspaceId: WORKSPACE_ID,
      agentId: agents[1].id,
      agentName: agents[1].name,
      taskId: tasks[3]?.id || tasks[0].id,
      taskTitle: tasks[3]?.title || tasks[0].title,
      status: "waiting_approval",
      startedAt: "2026-10-05T06:50:00Z",
      tokenUsage: { prompt: 2100, completion: 940, total: 3040 },
      costEstimate: 0.0051,
      events: [
        {
          id: "ev-201",
          type: "thought",
          content: "Verificando se a tabela externa possui chave de idempotência no Stripe.",
          createdAt: "2026-10-05T06:50:05Z",
        },
        {
          id: "ev-202",
          type: "tool_call",
          content: "inspect_workflow({ id: 'wf_stripe_supabase_sync' })",
          createdAt: "2026-10-05T06:50:20Z",
        },
        {
          id: "ev-203",
          type: "message",
          content: "Recomendado aplicar constraint UNIQUE (transaction_id). Solicitação de aprovação enviada.",
          createdAt: "2026-10-05T06:50:45Z",
        },
      ],
    },
  ];

  const approvals: Approval[] = [
    {
      id: "appr-001",
      workspaceId: WORKSPACE_ID,
      taskId: tasks[3]?.id || tasks[0].id,
      taskTitle: tasks[3]?.title || tasks[0].title,
      agentId: agents[1].id,
      agentName: agents[1].name,
      runId: "run-002",
      requestedAction: "Aplicar modificação no nó n8n e adicionar validação de transação duplicada",
      payload: {
        nodeName: "Stripe Webhook Filter",
        changeType: "deduplication_sql_guard",
        sqlGuard: "INSERT INTO medtask_webhook_deliveries ... ON CONFLICT DO NOTHING",
      },
      status: "pending",
      requestedAt: "2026-10-05T06:51:00Z",
    },
  ];

  const activities: ActivityItem[] = [
    {
      id: "act-1",
      taskId: tasks[0].id,
      actorType: "agent",
      actorName: "MedCopy IA",
      action: "reivindicou a tarefa e iniciou a geração de copies",
      createdAt: "2026-10-05T07:15:00Z",
    },
    {
      id: "act-2",
      taskId: tasks[3]?.id || tasks[0].id,
      actorType: "agent",
      actorName: "n8n Auditor IA",
      action: "solicitou aprovação humana para alteração crítica de webhook",
      createdAt: "2026-10-05T06:51:00Z",
    },
    {
      id: "act-3",
      actorType: "user",
      actorName: "Lucca Lagana",
      action: "criou o projeto Esteira de Integrações n8n & Supabase",
      createdAt: "2026-10-05T06:00:00Z",
    },
  ];

  return {
    workspace: {
      id: WORKSPACE_ID,
      name: seedData.workspace.name,
      slug: seedData.workspace.slug,
      settings: seedData.workspace.settings,
      areas,
      members,
      agents,
    },
    tasks,
    agentRuns,
    approvals,
    activities,
  };
}

// Global cache (Node.js runtime singleton)
declare global {
  // eslint-disable-next-line no-var
  var __medtask_store: ReturnType<typeof initializeData> | undefined;
}

if (!global.__medtask_store) {
  global.__medtask_store = initializeData();
}

export const store = global.__medtask_store;
