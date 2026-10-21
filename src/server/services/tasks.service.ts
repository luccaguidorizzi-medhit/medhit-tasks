import { store, Task } from "./data-store";
import { supabase, mapRowToTask, mapTaskToRow } from "@/lib/supabase";

export interface CreateTaskInput {
  workspaceId?: string;
  projectId: string;
  areaId?: string;
  title: string;
  description?: string;
  statusId: string;
  priority?: "urgent" | "high" | "medium" | "low" | "none";
  taskType?: "task" | "bug" | "story" | "epic" | "subtask" | "agent_task";
  storyPoints?: number;
  aiContext?: string;
  assigneeIds?: { type: "user" | "agent"; id: string; name: string; avatarUrl: string }[];
  tags?: string[];
  dueDate?: string;
}

export const tasksService = {
  getWorkspace() {
    return store.workspace;
  },

  async getAllTasksAsync(projectId?: string): Promise<Task[]> {
    try {
      let query = supabase.from("medtask_tasks").select("*").order("position", { ascending: true });
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        const dbTasks = data.map(mapRowToTask);
        // Atualiza cache em memória
        if (!projectId) {
          store.tasks = dbTasks;
        } else {
          // Atualiza apenas as tarefas deste projeto no cache
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

    // Fallback para store em memória
    if (projectId) {
      return store.tasks.filter((t) => t.projectId === projectId);
    }
    return store.tasks;
  },

  getAllTasks(projectId?: string) {
    if (projectId) {
      return store.tasks.filter((t) => t.projectId === projectId);
    }
    return store.tasks;
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

  createTask(input: CreateTaskInput): Task {
    const project = store.workspace.areas
      .flatMap((a) => a.projects)
      .find((p) => p.id === input.projectId);

    const areaId = input.areaId || project?.areaId || store.workspace.areas[0].id;
    const newId = `task-${Date.now()}`;

    const newTask: Task = {
      id: newId,
      workspaceId: input.workspaceId || store.workspace.id,
      projectId: input.projectId,
      areaId: areaId,
      title: input.title,
      description: input.description || "",
      taskType: input.taskType || "task",
      statusId: input.statusId,
      priority: input.priority || "none",
      position: (store.tasks.length + 1) * 1000,
      assigneeIds: input.assigneeIds || [],
      storyPoints: input.storyPoints,
      aiContext: input.aiContext,
      tags: input.tags || [],
      dueDate: input.dueDate,
      checklists: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.tasks.push(newTask);

    store.activities.unshift({
      id: `act-${Date.now()}`,
      taskId: newTask.id,
      projectId: newTask.projectId,
      actorType: "user",
      actorName: "Lucca Guidorizzi",
      action: `criou a tarefa "${newTask.title}"`,
      createdAt: new Date().toISOString(),
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

    return newTask;
  },

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const taskIndex = store.tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return null;

    const currentTask = store.tasks[taskIndex];
    const updatedTask = {
      ...currentTask,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    store.tasks[taskIndex] = updatedTask;

    store.activities.unshift({
      id: `act-${Date.now()}`,
      taskId: id,
      projectId: updatedTask.projectId,
      actorType: "user",
      actorName: "Lucca Guidorizzi",
      action: `atualizou a tarefa "${updatedTask.title}"`,
      createdAt: new Date().toISOString(),
    });

    // Atualização no Supabase
    void (async () => {
      try {
        const { error } = await supabase.from("medtask_tasks").update(mapTaskToRow(updates)).eq("id", id);
        if (error) console.error("[tasksService] Erro ao atualizar tarefa no Supabase:", error);
      } catch (err) {
        console.error("[tasksService] Exceção ao atualizar no Supabase:", err);
      }
    })();

    return updatedTask;
  },

  moveTask(taskId: string, targetStatusId: string, newPosition?: number) {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const oldStatusId = task.statusId;
    task.statusId = targetStatusId;
    if (typeof newPosition === "number") {
      task.position = newPosition;
    }
    task.updatedAt = new Date().toISOString();

    if (oldStatusId !== targetStatusId) {
      store.activities.unshift({
        id: `act-${Date.now()}`,
        taskId: task.id,
        projectId: task.projectId,
        actorType: "user",
        actorName: "Lucca Guidorizzi",
        action: `moveu a tarefa para outro status`,
        createdAt: new Date().toISOString(),
      });
    }

    // Persiste mudança de status/posição no Supabase
    void (async () => {
      try {
        const { error } = await supabase
          .from("medtask_tasks")
          .update({
            status_id: targetStatusId,
            ...(typeof newPosition === "number" ? { position: newPosition } : {}),
            updated_at: task.updatedAt,
          })
          .eq("id", taskId);
        if (error) console.error("[tasksService] Erro ao mover tarefa no Supabase:", error);
      } catch (err) {
        console.error("[tasksService] Exceção ao mover tarefa no Supabase:", err);
      }
    })();

    return task;
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

    void (async () => {
      try {
        await supabase
          .from("medtask_tasks")
          .update({ checklists: task.checklists, updated_at: task.updatedAt })
          .eq("id", taskId);
      } catch (err) {
        console.error("[tasksService] Erro ao alternar checklist no Supabase:", err);
      }
    })();

    return task;
  },

  addComment(taskId: string, content: string, authorType: "user" | "agent" = "user", authorName = "Lucca Guidorizzi") {
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
      actorName: "Lucca Guidorizzi",
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
