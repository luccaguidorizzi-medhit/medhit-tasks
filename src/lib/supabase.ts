import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Task, TaskCustomFields } from "@/server/services/data-store";

export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Converte um registro do banco medtask_tasks (snake_case) para a interface Task (camelCase)
 * Inclui desserialização defensiva para campos v2 (groupId, customFields, statusChangedAt)
 */
export function mapRowToTask(row: any): Task {
  let groupId: string | undefined = row.group_id || undefined;
  let customFields: TaskCustomFields | undefined = undefined;
  let aiContextText: string | undefined = row.ai_context || undefined;

  // Desserialização defensiva de metadados v2
  if (row.custom_fields && typeof row.custom_fields === "object") {
    customFields = row.custom_fields;
  } else if (row.ai_context && typeof row.ai_context === "string" && row.ai_context.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(row.ai_context);
      if (parsed && typeof parsed === "object" && parsed.__medhit_v2) {
        groupId = parsed.groupId || groupId;
        customFields = parsed.customFields || undefined;
        aiContextText = parsed.originalText || undefined;
      }
    } catch {
      // Ignora erro de JSON e mantém aiContextText original
    }
  }

  const statusChangedAt =
    row.status_changed_at || row.updated_at || row.created_at || new Date().toISOString();

  const daysInCurrentStatus = Math.max(
    0,
    Math.floor((Date.now() - new Date(statusChangedAt).getTime()) / (1000 * 60 * 60 * 24))
  );

  const externalId = row.external_id || customFields?.externalId || undefined;
  const isArchived = Boolean(row.is_archived);

  return {
    id: row.id,
    workspaceId: row.workspace_id || "ws-medhit-001",
    projectId: row.project_id,
    areaId: row.area_id,
    groupId,
    title: row.title,
    description: row.description || "",
    taskType: row.task_type || "task",
    statusId: row.status_id,
    statusChangedAt,
    daysInCurrentStatus,
    externalId,
    isArchived,
    archivedAt: row.archived_at || undefined,
    priority: row.priority || "none",
    position: Number(row.position) || 1000,
    reporterId: row.reporter_id || undefined,
    assigneeIds: Array.isArray(row.assignee_ids) ? row.assignee_ids : [],
    parentId: row.parent_id || undefined,
    epicId: row.epic_id || undefined,
    sprintId: row.sprint_id || undefined,
    startDate: row.start_date || undefined,
    dueDate: row.due_date || undefined,
    estimatedHours: row.estimated_hours ? Number(row.estimated_hours) : undefined,
    storyPoints: row.story_points ? Number(row.story_points) : undefined,
    aiContext: aiContextText,
    customFields,
    tags: Array.isArray(row.tags) ? row.tags : [],
    checklists: Array.isArray(row.checklists) ? row.checklists : [],
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Converte um objeto Task (camelCase) para o formato do banco medtask_tasks (snake_case)
 * Serializa de forma compatível os campos v2
 */
export function mapTaskToRow(task: Partial<Task>): Record<string, any> {
  const row: Record<string, any> = {};

  if (task.id !== undefined) row.id = task.id;
  if (task.workspaceId !== undefined) row.workspace_id = task.workspaceId;
  if (task.projectId !== undefined) row.project_id = task.projectId;
  if (task.areaId !== undefined) row.area_id = task.areaId;
  if (task.title !== undefined) row.title = task.title;
  if (task.description !== undefined) row.description = task.description;
  if (task.taskType !== undefined) row.task_type = task.taskType;
  if (task.statusId !== undefined) row.status_id = task.statusId;
  if (task.statusChangedAt !== undefined) row.status_changed_at = task.statusChangedAt;
  if (task.externalId !== undefined) row.external_id = task.externalId;
  if (task.isArchived !== undefined) row.is_archived = task.isArchived;
  if (task.archivedAt !== undefined) row.archived_at = task.archivedAt;
  if (task.priority !== undefined) row.priority = task.priority;
  if (task.position !== undefined) row.position = task.position;
  if (task.reporterId !== undefined) row.reporter_id = task.reporterId;
  if (task.assigneeIds !== undefined) row.assignee_ids = task.assigneeIds;
  if (task.parentId !== undefined) row.parent_id = task.parentId;
  if (task.epicId !== undefined) row.epic_id = task.epicId;
  if (task.sprintId !== undefined) row.sprint_id = task.sprintId;
  if (task.startDate !== undefined) row.start_date = task.startDate;
  if (task.dueDate !== undefined) row.due_date = task.dueDate;
  if (task.estimatedHours !== undefined) row.estimated_hours = task.estimatedHours;
  if (task.storyPoints !== undefined) row.story_points = task.storyPoints;
  if (task.tags !== undefined) row.tags = task.tags;
  if (task.checklists !== undefined) row.checklists = task.checklists;
  if (task.attachments !== undefined) row.attachments = task.attachments;
  if (task.comments !== undefined) row.comments = task.comments;
  if (task.createdAt !== undefined) row.created_at = task.createdAt;
  if (task.updatedAt !== undefined) row.updated_at = task.updatedAt;

  // Persiste tanto na coluna custom_fields JSONB quanto em ai_context para retrocompatibilidade
  if (task.customFields !== undefined) {
    row.custom_fields = task.customFields;
  }

  if (task.groupId !== undefined || task.customFields !== undefined) {
    row.ai_context = JSON.stringify({
      __medhit_v2: true,
      groupId: task.groupId,
      customFields: task.customFields,
      originalText: task.aiContext || "",
    });
  } else if (task.aiContext !== undefined) {
    row.ai_context = task.aiContext;
  }

  return row;
}
