/**
 * MedHit Task Manager - In-Memory & Database Data Store
 * Mantido por: MedHit Integrações & Automações
 * Fornece persistência e estado reativo para desenvolvimento local e produção
 */

import { seedData } from "@/server/db/seed";

export interface Member {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  password?: string;
  mcpToken?: string;
  role: "owner" | "admin" | "member" | "guest";
  avatarUrl: string;
  status: "active" | "inactive";
  lastLoginAt?: string;
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
    password: (m as any).password || (m.email === "lucca@medhit.com.br" || m.email === "lucca.guidorizzi@medhit.com.br" ? "x32kd58" : "medhit2026"),
    mcpToken: (m as any).mcpToken || (m.email === "lucca@medhit.com.br" || m.email === "lucca.guidorizzi@medhit.com.br" ? "medtask_user_lucca_x32kd58_sec99" : `medtask_user_${idx + 1}_sec${1000 + idx}`),
    role: m.role,
    avatarUrl: m.avatarUrl,
    status: "active",
    lastLoginAt: new Date().toISOString(),
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

  const areas: Area[] = seedData.areas.map((areaSeed, areaIdx) => ({
    id: `area-${areaIdx + 1}`,
    workspaceId: WORKSPACE_ID,
    name: areaSeed.name,
    slug: areaSeed.slug,
    description: areaSeed.description,
    icon: areaSeed.icon,
    color: areaSeed.color,
    projects: (areaSeed.projects || []).map((p: any) => ({
      ...p,
      areaId: `area-${areaIdx + 1}`,
      workspaceId: WORKSPACE_ID,
    })),
  }));

  const tasks: Task[] = (seedData as any).initialTasks ? [...(seedData as any).initialTasks] : [];
  const agentRuns: AgentRun[] = [];

  const approvals: Approval[] = [];

  const activities: ActivityItem[] = [
    {
      id: "act-init",
      actorType: "user",
      actorName: "Lucca Lagana",
      action: "inicializou o workspace MedHit Tasks limpo",
      createdAt: new Date().toISOString(),
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
