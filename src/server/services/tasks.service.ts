/**
 * MedHit WorkTrack - Tasks Service
 * Mantido por: Equipe MedHit I&A
 *
 * Suporte completo a P0, P1 e P2:
 * - Resolução flexível de assignee (assigneeId por ID, email ou nome)
 * - statusChangedAt e cálculo automático de dias na coluna (dias sem movimentação)
 * - Busca e deduplicação por externalId
 * - CRUD completo de Checklists e Itens
 * - Gestão de Tags e Anexos (Drive, PDF, CPF)
 * - Arquivamento seguro (archiveTask / unarchiveTask)
 * - Disparo de webhooks de saída ao mover cards
 */

import { store, Task, TaskCustomFields, TaskAttachment, Checklist } from "./data-store";
import { supabase, mapRowToTask, mapTaskToRow } from "@/lib/supabase";
import { workspaceService } from "./workspace.service";

export interface CreateTaskInput {
  workspaceId?: string;
  projectId: string;
  areaId?: string;
  groupId?: string;
  title: string;
  description?: string;
  statusId: string;
  priority?: "urgent" | "high" | "medium" | "low" | "none";
  taskType?: "task" | "bug" | "story" | "epic" | "subtask" | "agent_task";
  storyPoints?: number;
  aiContext?: string;
  assigneeId?: string;
  assigneeIds?: any[];
  tags?: string[];
  dueDate?: string;
  externalId?: string;
  customFields?: TaskCustomFields;
  attachments?: TaskAttachment[];
}

function resolveAssignees(assigneeId?: string, assigneeIds?: any[]) {
  const result: { type: "user" | "agent"; id: string; name: string; avatarUrl: string }[] = [];

  // Se passou array de assignees
  if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
    for (const item of assigneeIds) {
      if (typeof item === "string") {
        const found = store.workspace.members.find(
          (m) => m.id === item || m.email.toLowerCase() === item.toLowerCase() || m.name.toLowerCase().includes(item.toLowerCase())
        );
        if (found) {
          result.push({ type: "user", id: found.id, name: found.name, avatarUrl: found.avatarUrl });
        } else {
          result.push({ type: "user", id: item, name: item, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item)}` });
        }
      } else if (item && typeof item === "object") {
        result.push(item);
      }
    }
  }

  // Se passou assigneeId singular
  if (assigneeId && result.length === 0) {
    const found = store.workspace.members.find(
      (m) => m.id === assigneeId || m.email.toLowerCase() === assigneeId.toLowerCase() || m.name.toLowerCase().includes(assigneeId.toLowerCase())
    );
    if (found) {
      result.push({ type: "user", id: found.id, name: found.name, avatarUrl: found.avatarUrl });
    } else {
      result.push({ type: "user", id: assigneeId, name: assigneeId, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(assigneeId)}` });
    }
  }

  return result;
}

export const tasksService = {
  getWorkspace() {
    return store.workspace;
  },

  async getAllTasksAsync(projectId?: string, includeArchived = false): Promise<Task[]> {
    try {
      let query = supabase.from("medtask_tasks").select("*").order("position", { ascending: true });
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      if (!includeArchived) {
        query = query.eq("is_archived", false);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        const dbTasks = data.map(mapRowToTask);
        if (!projectId) {
          store.tasks = dbTasks;
        } else {
          store.tasks = [
            ...store.tasks.filter((t) => t.projectId !== projectId),
            ...dbTasks,
          ];
        }
        return dbTasks;
      }
    } catch (e) {
      console.error("[tasksService] Erro ao sincronizar tarefas com Supabase:", e);
    }

    let list = projectId ? store.tasks.filter((t) => t.projectId === projectId) : store.tasks;
    if (!includeArchived) {
      list = list.filter((t) => !t.isArchived);
    }
    return list;
  },

  getAllTasks(projectId?: string, includeArchived = false) {
    let list = projectId ? store.tasks.filter((t) => t.projectId === projectId) : store.tasks;
    if (!includeArchived) {
      list = list.filter((t) => !t.isArchived);
    }
    return list;
  },

  getTaskById(id: string) {
    return store.tasks.find((t) => t.id === id);
  },

  async getTaskByIdAsync(id: string): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from("medtask_tasks")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) {
        return mapRowToTask(data);
      }
    } catch (e) {
      console.error("[tasksService] Erro ao buscar tarefa do Supabase:", e);
    }
    return store.tasks.find((t) => t.id === id) || null;
  },

  /**
   * P1: Busca card por ID externo (evita duplicação em integrações Google Forms / Apps Script)
   */
  async getTaskByExternalId(externalId: string, projectId?: string): Promise<Task | null> {
    try {
      let query = supabase.from("medtask_tasks").select("*").eq("external_id", externalId);
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query.limit(1).maybeSingle();
      if (!error && data) {
        return mapRowToTask(data);
      }
    } catch (e) {
      console.error("[tasksService] Erro ao buscar por external_id:", e);
    }

    const found = store.tasks.find(
      (t) => (t.externalId === externalId || t.customFields?.externalId === externalId) && (!projectId || t.projectId === projectId)
    );
    return found || null;
  },

  createTask(input: CreateTaskInput): Task {
    const project = store.workspace.areas
      .flatMap((a) => a.projects)
      .find((p) => p.id === input.projectId || p.slug === input.projectId);

    const actualProjectId = project?.id || input.projectId;
    const areaId = input.areaId || project?.areaId || store.workspace.areas[0].id;
    const newId = `task-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const assigned = resolveAssignees(input.assigneeId, input.assigneeIds);
    const extId = input.externalId || input.customFields?.externalId;

    const newTask: Task = {
      id: newId,
      workspaceId: input.workspaceId || store.workspace.id,
      projectId: actualProjectId,
      areaId,
      groupId: input.groupId,
      title: input.title,
      description: input.description || "",
      taskType: input.taskType || "task",
      statusId: input.statusId,
      statusChangedAt: nowIso,
      daysInCurrentStatus: 0,
      externalId: extId,
      isArchived: false,
      priority: input.priority || "none",
      position: (store.tasks.length + 1) * 1000,
      assigneeIds: assigned,
      storyPoints: input.storyPoints,
      aiContext: input.aiContext,
      customFields: input.customFields,
      tags: input.tags || [],
      attachments: input.attachments || [],
      dueDate: input.dueDate,
      checklists: [],
      comments: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    store.tasks.push(newTask);

    store.activities.unshift({
      id: `act-${Date.now()}`,
      taskId: newTask.id,
      projectId: newTask.projectId,
      actorType: "user",
      actorName: "Equipe MedHit I&A",
      action: `criou a tarefa "${newTask.title}"`,
      createdAt: nowIso,
    });

    // Persistência assíncrona no Supabase
    void (async () => {
      try {
        const { error } = await supabase.from("medtask_tasks").insert(mapTaskToRow(newTask));
        if (error) console.error("[tasksService] Erro ao persistir nova tarefa no Supabase:", error);
      } catch (err) {
        console.error("[tasksService] Exceção ao persistir no Supabase:", err);
      }
    })();

    // Dispara webhook de card criado
    void workspaceService.dispatchOutboundWebhooks("card.created", newTask);

    return newTask;
  },

  updateTask(id: string, updates: Partial<Task> & { assigneeId?: string }): Task | null {
    const taskIndex = store.tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return null;

    const currentTask = store.tasks[taskIndex];
    const nowIso = new Date().toISOString();

    let newStatusChangedAt = currentTask.statusChangedAt;
    const statusChanged = updates.statusId && updates.statusId !== currentTask.statusId;
    if (statusChanged) {
      newStatusChangedAt = nowIso;
    }

    // Resolve novos assignees se especificado
    let newAssignees = currentTask.assigneeIds;
    if (updates.assigneeId || updates.assigneeIds) {
      newAssignees = resolveAssignees(updates.assigneeId, updates.assigneeIds);
    }

    // Mescla customFields se especificado
    let newCustomFields = currentTask.customFields;
    if (updates.customFields) {
      newCustomFields = {
        ...(currentTask.customFields || {}),
        ...updates.customFields,
      };
    }

    const updatedTask: Task = {
      ...currentTask,
      ...updates,
      statusChangedAt: newStatusChangedAt,
      daysInCurrentStatus: newStatusChangedAt
        ? Math.max(0, Math.floor((Date.now() - new Date(newStatusChangedAt).getTime()) / (1000 * 60 * 60 * 24)))
        : 0,
      assigneeIds: newAssignees,
      customFields: newCustomFields,
      updatedAt: nowIso,
    };

    store.tasks[taskIndex] = updatedTask;

    store.activities.unshift({
      id: `act-${Date.now()}`,
      taskId: id,
      projectId: updatedTask.projectId,
      actorType: "user",
      actorName: "Equipe MedHit I&A",
      action: statusChanged ? `moveu status para "${updates.statusId}"` : `atualizou a tarefa "${updatedTask.title}"`,
      createdAt: nowIso,
    });

    // Atualização no Supabase
    void (async () => {
      try {
        const { error } = await supabase
          .from("medtask_tasks")
          .update(mapTaskToRow(updatedTask))
          .eq("id", id);
        if (error) console.error("[tasksService] Erro ao atualizar tarefa no Supabase:", error);
      } catch (err) {
        console.error("[tasksService] Exceção ao atualizar no Supabase:", err);
      }
    })();

    // Dispara webhook se mudou de coluna
    if (statusChanged) {
      void workspaceService.dispatchOutboundWebhooks("card.moved", updatedTask, {
        previousStatusId: currentTask.statusId,
      });
    } else {
      void workspaceService.dispatchOutboundWebhooks("card.updated", updatedTask);
    }

    return updatedTask;
  },

  moveTask(taskId: string, targetStatusId: string, newPosition?: number) {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const oldStatusId = task.statusId;
    const nowIso = new Date().toISOString();

    task.statusId = targetStatusId;
    task.statusChangedAt = nowIso;
    task.daysInCurrentStatus = 0;
    if (typeof newPosition === "number") {
      task.position = newPosition;
    }
    task.updatedAt = nowIso;

    if (oldStatusId !== targetStatusId) {
      store.activities.unshift({
        id: `act-${Date.now()}`,
        taskId: task.id,
        projectId: task.projectId,
        actorType: "user",
        actorName: "Equipe MedHit I&A",
        action: `moveu a tarefa de "${oldStatusId}" para "${targetStatusId}"`,
        createdAt: nowIso,
      });

      // Dispara webhook de saída
      void workspaceService.dispatchOutboundWebhooks("card.moved", task, {
        previousStatusId: oldStatusId,
      });
    }

    // Persiste mudança no Supabase
    void (async () => {
      try {
        const { error } = await supabase
          .from("medtask_tasks")
          .update({
            status_id: targetStatusId,
            status_changed_at: nowIso,
            ...(typeof newPosition === "number" ? { position: newPosition } : {}),
            updated_at: nowIso,
          })
          .eq("id", taskId);
        if (error) console.error("[tasksService] Erro ao mover tarefa no Supabase:", error);
      } catch (err) {
        console.error("[tasksService] Exceção ao mover tarefa no Supabase:", err);
      }
    })();

    return task;
  },

  /**
   * P0: CRUD de Checklists
   */
  createChecklist(taskId: string, title: string): Checklist | null {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const newChecklist: Checklist = {
      id: `chk-${Date.now()}`,
      taskId,
      title,
      items: [],
    };

    task.checklists.push(newChecklist);
    task.updatedAt = new Date().toISOString();

    void this.persistTaskChecklists(task);
    return newChecklist;
  },

  addChecklistItem(taskId: string, checklistId: string, title: string) {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    let checklist = task.checklists.find((c) => c.id === checklistId);
    if (!checklist) {
      // Se não encontrou o checklist informado, cria um padrão
      checklist = this.createChecklist(taskId, "Itens de Verificação")!;
    }

    const newItem = {
      id: `ci-${Date.now()}`,
      checklistId: checklist.id,
      title,
      isCompleted: false,
    };

    checklist.items.push(newItem);
    task.updatedAt = new Date().toISOString();

    void this.persistTaskChecklists(task);
    return newItem;
  },

  deleteChecklistItem(taskId: string, checklistId: string, itemId: string) {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    const checklist = task.checklists.find((c) => c.id === checklistId);
    if (!checklist) return false;

    const idx = checklist.items.findIndex((i) => i.id === itemId);
    if (idx === -1) return false;

    checklist.items.splice(idx, 1);
    task.updatedAt = new Date().toISOString();

    void this.persistTaskChecklists(task);
    return true;
  },

  toggleChecklistItem(taskId: string, checklistId: string, itemId: string) {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const checklist = task.checklists.find((c) => c.id === checklistId);
    if (!checklist) return null;

    const item = checklist.items.find((i) => i.id === itemId);
    if (!item) return null;

    item.isCompleted = !item.isCompleted;
    task.updatedAt = new Date().toISOString();

    void this.persistTaskChecklists(task);
    return task;
  },

  async persistTaskChecklists(task: Task) {
    try {
      await supabase
        .from("medtask_tasks")
        .update({ checklists: task.checklists, updated_at: task.updatedAt })
        .eq("id", task.id);
    } catch (err) {
      console.error("[tasksService] Erro ao sincronizar checklists no Supabase:", err);
    }
  },

  /**
   * P1: Tags & Anexos
   */
  addTag(taskId: string, tag: string) {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    if (!task.tags) task.tags = [];
    if (!task.tags.includes(tag)) {
      task.tags.push(tag);
      task.updatedAt = new Date().toISOString();
      void supabase.from("medtask_tasks").update({ tags: task.tags, updated_at: task.updatedAt }).eq("id", taskId);
    }
    return task;
  },

  removeTag(taskId: string, tag: string) {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task || !task.tags) return null;

    task.tags = task.tags.filter((t) => t !== tag);
    task.updatedAt = new Date().toISOString();
    void supabase.from("medtask_tasks").update({ tags: task.tags, updated_at: task.updatedAt }).eq("id", taskId);
    return task;
  },

  addAttachment(taskId: string, attachment: { title: string; url: string; type?: string }) {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    if (!task.attachments) task.attachments = [];
    const newAtt: TaskAttachment = {
      id: `att-${Date.now()}`,
      title: attachment.title,
      url: attachment.url,
      type: attachment.type || "link",
      createdAt: new Date().toISOString(),
    };

    task.attachments.push(newAtt);
    task.updatedAt = new Date().toISOString();

    void supabase
      .from("medtask_tasks")
      .update({ attachments: task.attachments, updated_at: task.updatedAt })
      .eq("id", taskId);

    return newAtt;
  },

  /**
   * P1: Arquivamento de Tarefas
   */
  archiveTask(taskId: string) {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const nowIso = new Date().toISOString();
    task.isArchived = true;
    task.archivedAt = nowIso;
    task.updatedAt = nowIso;

    void supabase
      .from("medtask_tasks")
      .update({ is_archived: true, archived_at: nowIso, updated_at: nowIso })
      .eq("id", taskId);

    return task;
  },

  unarchiveTask(taskId: string) {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const nowIso = new Date().toISOString();
    task.isArchived = false;
    task.archivedAt = undefined;
    task.updatedAt = nowIso;

    void supabase
      .from("medtask_tasks")
      .update({ is_archived: false, archived_at: null, updated_at: nowIso })
      .eq("id", taskId);

    return task;
  },

  addComment(taskId: string, content: string, authorType: "user" | "agent" = "user", authorName = "Equipe MedHit I&A") {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const newComment = {
      id: `comm-${Date.now()}`,
      taskId,
      authorType,
      authorId: authorType === "user" ? store.workspace.members[0].id : store.workspace.agents[0].id,
      authorName,
      authorAvatar: authorType === "user" ? store.workspace.members[0].avatarUrl : store.workspace.agents[0].avatarUrl,
      content,
      createdAt: new Date().toISOString(),
    };

    task.comments.push(newComment);
    task.updatedAt = new Date().toISOString();

    store.activities.unshift({
      id: `act-${Date.now()}`,
      taskId,
      projectId: task.projectId,
      actorType: authorType,
      actorName: authorName,
      action: `adicionou um comentário`,
      createdAt: new Date().toISOString(),
    });

    void (async () => {
      try {
        await supabase
          .from("medtask_tasks")
          .update({ comments: task.comments, updated_at: task.updatedAt })
          .eq("id", taskId);
      } catch (err) {
        console.error("[tasksService] Erro ao salvar comentário no Supabase:", err);
      }
    })();

    return newComment;
  },

  deleteTask(taskId: string) {
    const index = store.tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return false;

    const [deleted] = store.tasks.splice(index, 1);
    store.activities.unshift({
      id: `act-${Date.now()}`,
      projectId: deleted.projectId,
      actorType: "user",
      actorName: "Equipe MedHit I&A",
      action: `excluiu a tarefa "${deleted.title}"`,
      createdAt: new Date().toISOString(),
    });

    void (async () => {
      try {
        const { error } = await supabase.from("medtask_tasks").delete().eq("id", taskId);
        if (error) console.error("[tasksService] Erro ao excluir tarefa no Supabase:", error);
      } catch (err) {
        console.error("[tasksService] Exceção ao excluir no Supabase:", err);
      }
    })();

    return true;
  },
};
