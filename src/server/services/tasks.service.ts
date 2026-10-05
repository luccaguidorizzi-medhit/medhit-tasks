import { store, Task } from "./data-store";

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
}

export const tasksService = {
  getWorkspace() {
    return store.workspace;
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
      actorName: "Lucca Lagana",
      action: `criou a tarefa "${newTask.title}"`,
      createdAt: new Date().toISOString(),
    });

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
      actorName: "Lucca Lagana",
      action: `atualizou a tarefa "${updatedTask.title}"`,
      createdAt: new Date().toISOString(),
    });

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
        actorName: "Lucca Lagana",
        action: `moveu a tarefa para outro status`,
        createdAt: new Date().toISOString(),
      });
    }

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
    return task;
  },

  addComment(taskId: string, content: string, authorType: "user" | "agent" = "user", authorName = "Lucca Lagana") {
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
      actorName: "Lucca Lagana",
      action: `excluiu a tarefa "${deleted.title}"`,
      createdAt: new Date().toISOString(),
    });
    return true;
  },
};
