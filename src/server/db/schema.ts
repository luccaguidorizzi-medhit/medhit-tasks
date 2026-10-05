import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// ENUMS (Prefixo medtask_ para isolamento)
// ==========================================

export const memberRoleEnum = pgEnum("medtask_member_role", [
  "owner",
  "admin",
  "member",
  "guest",
]);

export const areaMemberRoleEnum = pgEnum("medtask_area_member_role", [
  "lead",
  "member",
  "viewer",
]);

export const projectMethodologyEnum = pgEnum("medtask_project_methodology", [
  "simple",
  "kanban",
  "scrum",
  "scrumban",
]);

export const statusCategoryEnum = pgEnum("medtask_status_category", [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
  "cancelled",
]);

export const taskTypeEnum = pgEnum("medtask_task_type", [
  "task",
  "bug",
  "story",
  "epic",
  "subtask",
  "agent_task",
]);

export const taskPriorityEnum = pgEnum("medtask_task_priority", [
  "urgent",
  "high",
  "medium",
  "low",
  "none",
]);

export const assigneeTypeEnum = pgEnum("medtask_assignee_type", [
  "user",
  "agent",
]);

export const dependencyTypeEnum = pgEnum("medtask_dependency_type", [
  "blocks",
  "blocked_by",
  "relates_to",
  "duplicates",
]);

export const sprintStatusEnum = pgEnum("medtask_sprint_status", [
  "future",
  "active",
  "completed",
]);

export const agentStatusEnum = pgEnum("medtask_agent_status", [
  "active",
  "paused",
  "error",
]);

export const agentRunStatusEnum = pgEnum("medtask_agent_run_status", [
  "queued",
  "claimed",
  "running",
  "waiting_approval",
  "completed",
  "failed",
  "cancelled",
]);

export const approvalStatusEnum = pgEnum("medtask_approval_status", [
  "pending",
  "approved",
  "rejected",
  "adjusted",
]);

export const actorTypeEnum = pgEnum("medtask_actor_type", [
  "user",
  "agent",
  "automation",
  "system",
]);

// ==========================================
// 1. ORGANIZAÇÃO E ACESSO
// ==========================================

export const workspaces = pgTable("medtask_workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logoUrl: text("logo_url"),
  settings: jsonb("settings").default({}),
  ownerId: uuid("owner_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const members = pgTable("medtask_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id"),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  role: memberRoleEnum("role").default("member").notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("medtask_members_ws_idx").on(table.workspaceId),
  index("medtask_members_email_idx").on(table.email),
]);

export const areas = pgTable("medtask_areas", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).default("folder"),
  color: varchar("color", { length: 50 }).default("#3b82f6"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("medtask_areas_ws_idx").on(table.workspaceId),
]);

export const areaMembers = pgTable("medtask_area_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  areaId: uuid("area_id").references(() => areas.id, { onDelete: "cascade" }).notNull(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  role: areaMemberRoleEnum("role").default("member").notNull(),
});

export const projects = pgTable("medtask_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  areaId: uuid("area_id").references(() => areas.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).default("layout"),
  color: varchar("color", { length: 50 }).default("#10b981"),
  methodology: projectMethodologyEnum("methodology").default("kanban").notNull(),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("medtask_projects_ws_idx").on(table.workspaceId),
  index("medtask_projects_area_idx").on(table.areaId),
]);

export const projectMembers = pgTable("medtask_project_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  role: areaMemberRoleEnum("role").default("member").notNull(),
});

// ==========================================
// 2. STATUSES E TAREFAS
// ==========================================

export const statuses = pgTable("medtask_statuses", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 50 }).default("#94a3b8").notNull(),
  position: real("position").default(0).notNull(),
  category: statusCategoryEnum("category").default("todo").notNull(),
  wipLimit: integer("wip_limit"),
  definitionOfDone: text("definition_of_done"),
}, (table) => [
  index("medtask_statuses_project_idx").on(table.projectId),
]);

export const sprints = pgTable("medtask_sprints", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  goal: text("goal"),
  status: sprintStatusEnum("status").default("future").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  capacityPoints: integer("capacity_points").default(0),
  committedPoints: integer("committed_points").default(0),
  completedPoints: integer("completed_points").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("medtask_sprints_project_idx").on(table.projectId),
]);

export const tasks = pgTable("medtask_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  areaId: uuid("area_id").references(() => areas.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  taskType: taskTypeEnum("task_type").default("task").notNull(),
  statusId: uuid("status_id").references(() => statuses.id, { onDelete: "restrict" }).notNull(),
  priority: taskPriorityEnum("priority").default("none").notNull(),
  reporterId: uuid("reporter_id"),
  parentId: uuid("parent_id"),
  epicId: uuid("epic_id"),
  sprintId: uuid("sprint_id").references(() => sprints.id, { onDelete: "set null" }),
  position: real("position").default(0).notNull(),
  startDate: timestamp("start_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  estimatedHours: real("estimated_hours"),
  storyPoints: integer("story_points"),
  aiContext: text("ai_context"),
  customFields: jsonb("custom_fields").default({}),
  recurrenceRule: varchar("recurrence_rule", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("medtask_tasks_ws_idx").on(table.workspaceId),
  index("medtask_tasks_project_idx").on(table.projectId),
  index("medtask_tasks_status_idx").on(table.statusId),
  index("medtask_tasks_sprint_idx").on(table.sprintId),
]);

export const taskAssignees = pgTable("medtask_task_assignees", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  assigneeType: assigneeTypeEnum("assignee_type").default("user").notNull(),
  assigneeId: uuid("assignee_id").notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("medtask_assignees_task_idx").on(table.taskId),
  index("medtask_assignees_id_idx").on(table.assigneeId),
]);

export const taskDependencies = pgTable("medtask_task_dependencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  dependsOnTaskId: uuid("depends_on_task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  dependencyType: dependencyTypeEnum("dependency_type").default("blocks").notNull(),
});

export const checklists = pgTable("medtask_checklists", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).default("Checklist").notNull(),
  position: real("position").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const checklistItems = pgTable("medtask_checklist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  checklistId: uuid("checklist_id").references(() => checklists.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedBy: uuid("completed_by"),
  position: real("position").default(0).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
});

export const labels = pgTable("medtask_labels", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 50 }).default("#64748b").notNull(),
});

export const taskLabels = pgTable("medtask_task_labels", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  labelId: uuid("label_id").references(() => labels.id, { onDelete: "cascade" }).notNull(),
});

export const customFieldDefinitions = pgTable("medtask_custom_field_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  fieldType: varchar("field_type", { length: 50 }).notNull(),
  options: jsonb("options").default([]),
});

export const comments = pgTable("medtask_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  authorType: actorTypeEnum("author_type").default("user").notNull(),
  authorId: uuid("author_id").notNull(),
  content: text("content").notNull(),
  reactions: jsonb("reactions").default({}),
  parentCommentId: uuid("parent_comment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("medtask_comments_task_idx").on(table.taskId),
]);

export const attachments = pgTable("medtask_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  storagePath: text("storage_path").notNull(),
  publicUrl: text("public_url").notNull(),
  uploadedBy: uuid("uploaded_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const timeEntries = pgTable("medtask_time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").notNull(),
  description: text("description"),
  durationSeconds: integer("duration_seconds").default(0).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  isRunning: boolean("is_running").default(false).notNull(),
});

export const views = pgTable("medtask_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id"),
  name: varchar("name", { length: 100 }).notNull(),
  viewType: varchar("view_type", { length: 50 }).notNull(),
  filters: jsonb("filters").default({}),
  grouping: jsonb("grouping").default({}),
  sorting: jsonb("sorting").default({}),
  columns: jsonb("columns").default([]),
  isShared: boolean("is_shared").default(true).notNull(),
});

// ==========================================
// 3. AGENTES DE IA & HUMAN-IN-THE-LOOP
// ==========================================

export const agents = pgTable("medtask_agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  description: text("description"),
  role: varchar("role", { length: 255 }).notNull(),
  model: varchar("model", { length: 100 }).default("gemini-2.0-flash").notNull(),
  systemPrompt: text("system_prompt"),
  allowedTools: jsonb("allowed_tools").default([]),
  maxConcurrentTasks: integer("max_concurrent_tasks").default(3).notNull(),
  monthlyTokenBudget: integer("monthly_token_budget").default(5000000).notNull(),
  currentTokensUsed: integer("current_tokens_used").default(0).notNull(),
  timeoutSeconds: integer("timeout_seconds").default(300).notNull(),
  status: agentStatusEnum("status").default("active").notNull(),
  ownerUserId: uuid("owner_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("medtask_agents_ws_idx").on(table.workspaceId),
]);

export const agentRuns = pgTable("medtask_agent_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  status: agentRunStatusEnum("status").default("queued").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  tokenUsage: jsonb("token_usage").default({ prompt: 0, completion: 0, total: 0 }),
  costEstimate: real("cost_estimate").default(0),
  errorMessage: text("error_message"),
}, (table) => [
  index("medtask_agent_runs_agent_idx").on(table.agentId),
  index("medtask_agent_runs_task_idx").on(table.taskId),
]);

export const agentRunEvents = pgTable("medtask_agent_run_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").references(() => agentRuns.id, { onDelete: "cascade" }).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  content: jsonb("content").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("medtask_agent_run_events_run_idx").on(table.runId),
]);

export const approvals = pgTable("medtask_approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  runId: uuid("run_id").references(() => agentRuns.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  requestedAction: varchar("requested_action", { length: 255 }).notNull(),
  payload: jsonb("payload").default({}).notNull(),
  status: approvalStatusEnum("status").default("pending").notNull(),
  reviewedBy: uuid("reviewed_by"),
  reviewComment: text("review_comment"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("medtask_approvals_ws_idx").on(table.workspaceId),
  index("medtask_approvals_task_idx").on(table.taskId),
]);

// ==========================================
// 4. AUTOMAÇÕES, FORMULÁRIOS & AUDITORIA
// ==========================================

export const automations = pgTable("medtask_automations", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  triggerType: varchar("trigger_type", { length: 100 }).notNull(),
  triggerConfig: jsonb("trigger_config").default({}),
  conditions: jsonb("conditions").default([]),
  actions: jsonb("actions").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const automationRuns = pgTable("medtask_automation_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  automationId: uuid("automation_id").references(() => automations.id, { onDelete: "cascade" }).notNull(),
  taskId: uuid("task_id"),
  status: varchar("status", { length: 50 }).notNull(),
  error: text("error"),
  executedAt: timestamp("executed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const forms = pgTable("medtask_forms", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  isPublic: boolean("is_public").default(true).notNull(),
  fieldMapping: jsonb("field_mapping").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const formSubmissions = pgTable("medtask_form_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  formId: uuid("form_id").references(() => forms.id, { onDelete: "cascade" }).notNull(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  payload: jsonb("payload").default({}).notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable("medtask_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  recipientId: uuid("recipient_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("medtask_notifications_recipient_idx").on(table.recipientId),
]);

export const activityLog = pgTable("medtask_activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id"),
  taskId: uuid("task_id"),
  actorType: actorTypeEnum("actor_type").notNull(),
  actorId: uuid("actor_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("medtask_activity_task_idx").on(table.taskId),
  index("medtask_activity_ws_idx").on(table.workspaceId),
]);

export const apiKeys = pgTable("medtask_api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id"),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull(),
  prefix: varchar("prefix", { length: 20 }).notNull(),
  scopes: jsonb("scopes").default(["read", "write"]).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("medtask_api_keys_hash_idx").on(table.keyHash),
]);

export const webhooksOut = pgTable("medtask_webhooks_out", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  secret: varchar("secret", { length: 255 }).notNull(),
  eventTypes: jsonb("event_types").default(["*"]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const webhookDeliveries = pgTable("medtask_webhook_deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  webhookId: uuid("webhook_id").references(() => webhooksOut.id, { onDelete: "cascade" }).notNull(),
  payload: jsonb("payload").default({}).notNull(),
  statusCode: integer("status_code"),
  responseBody: text("response_body"),
  success: boolean("success").default(false).notNull(),
  attempt: integer("attempt").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// RELATIONS
// ==========================================

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(members),
  areas: many(areas),
  projects: many(projects),
  agents: many(agents),
}));

export const areasRelations = relations(areas, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [areas.workspaceId], references: [workspaces.id] }),
  projects: many(projects),
  members: many(areaMembers),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
  area: one(areas, { fields: [projects.areaId], references: [areas.id] }),
  statuses: many(statuses),
  tasks: many(tasks),
  sprints: many(sprints),
}));

export const statusesRelations = relations(statuses, ({ one, many }) => ({
  project: one(projects, { fields: [statuses.projectId], references: [projects.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  status: one(statuses, { fields: [tasks.statusId], references: [statuses.id] }),
  sprint: one(sprints, { fields: [tasks.sprintId], references: [sprints.id] }),
  assignees: many(taskAssignees),
  checklists: many(checklists),
  comments: many(comments),
  attachments: many(attachments),
  timeEntries: many(timeEntries),
}));

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, { fields: [taskAssignees.taskId], references: [tasks.id] }),
}));

export const checklistsRelations = relations(checklists, ({ one, many }) => ({
  task: one(tasks, { fields: [checklists.taskId], references: [tasks.id] }),
  items: many(checklistItems),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  checklist: one(checklists, { fields: [checklistItems.checklistId], references: [checklists.id] }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [agents.workspaceId], references: [workspaces.id] }),
  runs: many(agentRuns),
}));

export const agentRunsRelations = relations(agentRuns, ({ one, many }) => ({
  agent: one(agents, { fields: [agentRuns.agentId], references: [agents.id] }),
  task: one(tasks, { fields: [agentRuns.taskId], references: [tasks.id] }),
  events: many(agentRunEvents),
  approvals: many(approvals),
}));
