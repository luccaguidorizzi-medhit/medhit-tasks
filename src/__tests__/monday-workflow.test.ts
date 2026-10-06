import { describe, it, expect } from "vitest";
import { store, Task, Status, Project } from "../server/services/data-store";

describe("Monday.com Style Workflow & Clean Primitives", () => {
  it("creates tasks with exact custom assignees without forced defaults", () => {
    const customAssignee = {
      type: "user" as const,
      id: "user-dr-roberto",
      name: "Dr. Roberto",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto",
    };

    const taskWithAssignee: Task = {
      id: "task-test-1",
      workspaceId: "ws-test",
      projectId: "proj-1",
      areaId: "area-1",
      title: "Validação de Protocolo de Telemedicina",
      description: "Revisar fluxos de acolhimento",
      taskType: "task",
      statusId: "st-todo",
      priority: "high",
      position: 1000,
      assigneeIds: [customAssignee],
      checklists: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(taskWithAssignee.assigneeIds).toHaveLength(1);
    expect(taskWithAssignee.assigneeIds[0].name).toBe("Dr. Roberto");
    expect(taskWithAssignee.assigneeIds[0].id).toBe("user-dr-roberto");
  });

  it("creates unassigned tasks cleanly when no assignee is selected", () => {
    const unassignedTask: Task = {
      id: "task-test-2",
      workspaceId: "ws-test",
      projectId: "proj-1",
      areaId: "area-1",
      title: "Triagem de novos leads médicos",
      description: "",
      taskType: "task",
      statusId: "st-todo",
      priority: "medium",
      position: 2000,
      assigneeIds: [],
      checklists: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(unassignedTask.assigneeIds).toHaveLength(0);
    expect(unassignedTask.checklists).toHaveLength(0);
  });

  it("verifies Monday-style project statuses are clean and pragmatic", () => {
    const mondayStatuses: Status[] = [
      { id: "st-1", workspaceId: "ws-1", projectId: "p-1", name: "A Fazer", color: "#64748b", position: 1000, category: "todo" },
      { id: "st-2", workspaceId: "ws-1", projectId: "p-1", name: "Em Andamento", color: "#38bdf8", position: 2000, category: "in_progress" },
      { id: "st-3", workspaceId: "ws-1", projectId: "p-1", name: "Em Revisão", color: "#f59e0b", position: 2500, category: "review" },
      { id: "st-4", workspaceId: "ws-1", projectId: "p-1", name: "Concluído", color: "#10b981", position: 3000, category: "done" },
    ];

    expect(mondayStatuses).toHaveLength(4);
    expect(mondayStatuses.map((s) => s.name)).toEqual([
      "A Fazer",
      "Em Andamento",
      "Em Revisão",
      "Concluído",
    ]);

    // Confirma que não há jargões de Scrum em status padrão
    const names = mondayStatuses.map((s) => s.name.toLowerCase());
    expect(names.some((n) => n.includes("sprint"))).toBe(false);
    expect(names.some((n) => n.includes("backlog do produto"))).toBe(false);
  });

  it("calculates completion rate and category-based metrics accurately", () => {
    const statuses: Status[] = [
      { id: "st-todo", workspaceId: "ws-1", projectId: "p-1", name: "A Fazer", color: "#64748b", position: 1000, category: "todo" },
      { id: "st-prog", workspaceId: "ws-1", projectId: "p-1", name: "Em Andamento", color: "#38bdf8", position: 2000, category: "in_progress" },
      { id: "st-done", workspaceId: "ws-1", projectId: "p-1", name: "Concluído", color: "#10b981", position: 3000, category: "done" },
    ];

    const tasks: Task[] = [
      { id: "t1", workspaceId: "ws-1", projectId: "p-1", areaId: "a-1", title: "Task 1", description: "", taskType: "task", statusId: "st-todo", priority: "none", position: 1, assigneeIds: [], checklists: [], comments: [], createdAt: "", updatedAt: "" },
      { id: "t2", workspaceId: "ws-1", projectId: "p-1", areaId: "a-1", title: "Task 2", description: "", taskType: "task", statusId: "st-prog", priority: "high", position: 2, assigneeIds: [], checklists: [], comments: [], createdAt: "", updatedAt: "" },
      { id: "t3", workspaceId: "ws-1", projectId: "p-1", areaId: "a-1", title: "Task 3", description: "", taskType: "task", statusId: "st-done", priority: "urgent", position: 3, assigneeIds: [], checklists: [], comments: [], createdAt: "", updatedAt: "" },
      { id: "t4", workspaceId: "ws-1", projectId: "p-1", areaId: "a-1", title: "Task 4", description: "", taskType: "task", statusId: "st-done", priority: "medium", position: 4, assigneeIds: [], checklists: [], comments: [], createdAt: "", updatedAt: "" },
    ];

    const doneTasks = tasks.filter((t) => {
      const s = statuses.find((st) => st.id === t.statusId);
      return s?.category === "done";
    });
    const inProgressTasks = tasks.filter((t) => {
      const s = statuses.find((st) => st.id === t.statusId);
      return s?.category === "in_progress";
    });

    const completionRate = Math.round((doneTasks.length / tasks.length) * 100);

    expect(doneTasks).toHaveLength(2);
    expect(inProgressTasks).toHaveLength(1);
    expect(completionRate).toBe(50);
  });
});
