"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Task,
  Status,
  Member,
  Agent,
  AgentRun,
  Approval,
  Project,
  Area,
  store,
} from "@/server/services/data-store";
import { toast } from "sonner";

interface TaskContextType {
  tasks: Task[];
  statuses: Status[];
  members: Member[];
  agents: Agent[];
  agentRuns: AgentRun[];
  approvals: Approval[];
  areas: Area[];
  currentArea: Area;
  currentProject: Project;
  selectedTask: Task | null;
  isNewTaskModalOpen: boolean;
  isNewBoardModalOpen: boolean;
  isNewTeamModalOpen: boolean;
  isDeleteBoardModalOpen: boolean;
  boardToDelete: Project | null;
  setSelectedTask: (task: Task | null) => void;
  setIsNewTaskModalOpen: (open: boolean) => void;
  setIsNewBoardModalOpen: (open: boolean) => void;
  setIsNewTeamModalOpen: (open: boolean) => void;
  setIsDeleteBoardModalOpen: (open: boolean) => void;
  setBoardToDelete: (project: Project | null) => void;
  setCurrentProjectBySlug: (areaSlug: string, projectSlug: string) => void;
  moveTask: (taskId: string, targetStatusId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  createTask: (data: any) => void;
  createProject: (data: { name: string; description?: string; areaSlug: string; color?: string; methodology?: "kanban" | "scrum" | "simple" }) => Project;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  createTeam: (data: { name: string; description?: string; color?: string; icon?: string }) => Area;
  deleteTeam: (teamId: string) => void;
  deleteTask: (taskId: string) => void;
  toggleChecklist: (taskId: string, checklistId: string, itemId: string) => void;
  addComment: (taskId: string, content: string) => void;
  reviewApproval: (approvalId: string, decision: "approved" | "rejected", comment?: string) => void;
  triggerClaim: (agentId: string) => void;
  updateMemberRole: (memberId: string, role: Member["role"]) => void;
  inviteMember: (data: { name: string; email: string; role: Member["role"] }) => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [areas, setAreas] = useState<Area[]>(store.workspace.areas);
  const [tasks, setTasks] = useState<Task[]>(store.tasks);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>(store.agentRuns);
  const [approvals, setApprovals] = useState<Approval[]>(store.approvals);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);

  const [members, setMembers] = useState<Member[]>(store.workspace.members);
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [isDeleteBoardModalOpen, setIsDeleteBoardModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<Project | null>(null);

  const [currentArea, setCurrentArea] = useState<Area>(store.workspace.areas[0]);
  const [currentProject, setCurrentProject] = useState<Project>(store.workspace.areas[0].projects[0]);

  const setCurrentProjectBySlug = (areaSlug: string, projectSlug: string) => {
    const area = areas.find((a) => a.slug === areaSlug) || areas[0];
    const project = area.projects.find((p) => p.slug === projectSlug) || area.projects[0];
    setCurrentArea(area);
    setCurrentProject(project);
  };

  const createTeam = (data: { name: string; description?: string; color?: string; icon?: string }): Area => {
    const slug = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const newTeamId = `team-${Date.now()}`;
    const defaultProjId = `proj-${newTeamId}-default`;
    const defaultStatuses: Status[] = [
      { id: `st-${defaultProjId}-1`, workspaceId: store.workspace.id, projectId: defaultProjId, name: "A Fazer", color: "#64748b", position: 1000, category: "todo" },
      { id: `st-${defaultProjId}-2`, workspaceId: store.workspace.id, projectId: defaultProjId, name: "Em Andamento", color: "#38bdf8", position: 2000, category: "in_progress", wipLimit: 4 },
      { id: `st-${defaultProjId}-3`, workspaceId: store.workspace.id, projectId: defaultProjId, name: "Concluído", color: "#10b981", position: 3000, category: "done" },
    ];

    const defaultProject: Project = {
      id: defaultProjId,
      workspaceId: store.workspace.id,
      areaId: newTeamId,
      name: `Quadro Geral - ${data.name}`,
      slug: `quadro-${slug || "geral"}`,
      description: `Demandas gerais da equipe de ${data.name}`,
      icon: "layout",
      color: data.color || "#38bdf8",
      methodology: "kanban",
      statuses: defaultStatuses,
      sprints: [],
    };

    const newArea: Area = {
      id: newTeamId,
      workspaceId: store.workspace.id,
      name: data.name,
      slug: slug || `time-${Date.now()}`,
      description: data.description || "",
      icon: data.icon || "users",
      color: data.color || "#38bdf8",
      projects: [defaultProject],
    };

    const updated = [...areas, newArea];
    setAreas(updated);
    store.workspace.areas = updated;
    toast.success(`Time "${data.name}" criado com sucesso!`);
    return newArea;
  };

  const deleteTeam = (teamId: string) => {
    if (areas.length <= 1) {
      toast.error("O workspace precisa ter pelo menos uma equipe ativa.");
      return;
    }
    const updated = areas.filter((a) => a.id !== teamId);
    setAreas(updated);
    store.workspace.areas = updated;
    // Remove também as tarefas vinculadas
    setTasks((prev) => prev.filter((t) => t.areaId !== teamId));

    if (currentArea.id === teamId) {
      setCurrentArea(updated[0]);
      setCurrentProject(updated[0].projects[0]);
    }
    toast.success("Time removido com sucesso!");
  };

  const deleteProject = (projectId: string) => {
    // Localiza em qual área o projeto está
    let removedName = "";
    let nextProjectToSelect: Project | null = null;
    let nextAreaToSelect: Area | null = null;

    const updatedAreas = areas.map((area) => {
      const proj = area.projects.find((p) => p.id === projectId);
      if (proj) {
        removedName = proj.name;
        const remainingProjects = area.projects.filter((p) => p.id !== projectId);
        return {
          ...area,
          projects: remainingProjects,
        };
      }
      return area;
    });

    // Remove as tarefas do projeto excluído
    setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
    setAreas(updatedAreas);
    store.workspace.areas = updatedAreas;

    // Se o projeto deletado for o projeto ativo atual, seleciona o próximo projeto disponível
    for (const a of updatedAreas) {
      if (a.projects.length > 0) {
        nextAreaToSelect = a;
        nextProjectToSelect = a.projects[0];
        break;
      }
    }

    if (currentProject.id === projectId && nextProjectToSelect && nextAreaToSelect) {
      setCurrentArea(nextAreaToSelect);
      setCurrentProject(nextProjectToSelect);
    }

    setIsDeleteBoardModalOpen(false);
    setBoardToDelete(null);
    toast.success(`Quadro "${removedName || "selecionado"}" excluído com sucesso!`);
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    const updatedAreas = areas.map((area) => ({
      ...area,
      projects: area.projects.map((p) => {
        if (p.id === projectId) {
          const updated = { ...p, ...updates };
          if (currentProject.id === projectId) {
            setCurrentProject(updated);
          }
          return updated;
        }
        return p;
      }),
    }));

    setAreas(updatedAreas);
    store.workspace.areas = updatedAreas;
    toast.success("Quadro atualizado com sucesso!");
  };

  const updateMemberRole = (memberId: string, role: Member["role"]) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role } : m))
    );
    toast.success("Papel do usuário atualizado!");
  };

  const inviteMember = (data: { name: string; email: string; role: Member["role"] }) => {
    const newMember: Member = {
      id: `user-${Date.now()}`,
      workspaceId: store.workspace.id,
      name: data.name,
      email: data.email,
      role: data.role,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
      status: "active",
    };
    setMembers((prev) => [...prev, newMember]);
    store.workspace.members.push(newMember);
    toast.success(`Convite enviado para ${data.email}!`);
  };

  const createProject = (data: {
    name: string;
    description?: string;
    areaSlug: string;
    color?: string;
    methodology?: "kanban" | "scrum" | "simple";
  }): Project => {
    const slug = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const targetArea = areas.find((a) => a.slug === data.areaSlug) || areas[0];
    const newProjId = `proj-${targetArea.id}-${Date.now()}`;

    const defaultStatuses: Status[] = [
      {
        id: `status-${newProjId}-1`,
        workspaceId: store.workspace.id,
        projectId: newProjId,
        name: "A Fazer",
        color: "#64748b",
        position: 1000,
        category: "todo",
      },
      {
        id: `status-${newProjId}-2`,
        workspaceId: store.workspace.id,
        projectId: newProjId,
        name: "Em Andamento",
        color: "#38bdf8",
        position: 2000,
        category: "in_progress",
        wipLimit: 4,
      },
      {
        id: `status-${newProjId}-3`,
        workspaceId: store.workspace.id,
        projectId: newProjId,
        name: "Revisão / QA",
        color: "#f59e0b",
        position: 3000,
        category: "review",
      },
      {
        id: `status-${newProjId}-4`,
        workspaceId: store.workspace.id,
        projectId: newProjId,
        name: "Concluído",
        color: "#10b981",
        position: 4000,
        category: "done",
      },
    ];

    const newProject: Project = {
      id: newProjId,
      workspaceId: store.workspace.id,
      areaId: targetArea.id,
      name: data.name,
      slug: slug || `projeto-${Date.now()}`,
      description: data.description || "",
      icon: "layout",
      color: data.color || targetArea.color || "#38bdf8",
      methodology: data.methodology || "kanban",
      statuses: defaultStatuses,
      sprints: [],
    };

    // Atualiza estado de áreas
    const updatedAreas = areas.map((a) => {
      if (a.id !== targetArea.id) return a;
      return {
        ...a,
        projects: [...a.projects, newProject],
      };
    });

    setAreas(updatedAreas);
    store.workspace.areas = updatedAreas;

    // Cria uma primeira tarefa de boas-vindas
    const welcomeTask: Task = {
      id: `task-${Date.now()}`,
      workspaceId: store.workspace.id,
      projectId: newProjId,
      areaId: targetArea.id,
      title: `Planejamento inicial de ${data.name}`,
      description: "Definir metas principais, marcos de entrega e alocação da squad.",
      taskType: "task",
      statusId: defaultStatuses[0].id,
      priority: "high",
      position: 1000,
      assigneeIds: [{
        type: "user",
        id: store.workspace.members[0].id,
        name: store.workspace.members[0].name,
        avatarUrl: store.workspace.members[0].avatarUrl,
      }],
      checklists: [
        {
          id: `chk-${Date.now()}`,
          taskId: `task-${Date.now()}`,
          title: "Setup do Board",
          items: [
            { id: "item-1", checklistId: `chk-${Date.now()}`, title: "Convidar colaboradores", isCompleted: false },
            { id: "item-2", checklistId: `chk-${Date.now()}`, title: "Cadastrar primeiras demandas", isCompleted: true },
          ],
        },
      ],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [welcomeTask, ...prev]);

    return newProject;
  };

  const moveTask = (taskId: string, targetStatusId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, statusId: targetStatusId, updatedAt: new Date().toISOString() } : t))
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, statusId: targetStatusId } : null));
    }
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const createTask = (data: any) => {
    const newId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newId,
      workspaceId: store.workspace.id,
      projectId: data.projectId || currentProject.id,
      areaId: data.areaId || currentArea.id,
      title: data.title,
      description: data.description || "",
      taskType: data.taskType || "task",
      statusId: data.statusId,
      priority: data.priority || "none",
      position: (tasks.length + 1) * 1000,
      assigneeIds: data.taskType === "agent_task"
        ? [{ type: "agent", id: store.workspace.agents[0].id, name: store.workspace.agents[0].name, avatarUrl: store.workspace.agents[0].avatarUrl }]
        : [{ type: "user", id: store.workspace.members[0].id, name: store.workspace.members[0].name, avatarUrl: store.workspace.members[0].avatarUrl }],
      storyPoints: data.storyPoints,
      aiContext: data.aiContext,
      tags: data.tags || [],
      checklists: [
        {
          id: `chk-${Date.now()}`,
          taskId: newId,
          title: "Critérios de Aceite",
          items: [{ id: `item-1`, checklistId: `chk-${Date.now()}`, title: "Especificação validada", isCompleted: false }],
        },
      ],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  const toggleChecklist = (taskId: string, checklistId: string, itemId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedChecklists = t.checklists.map((c) => {
          if (c.id !== checklistId) return c;
          const updatedItems = c.items.map((i) =>
            i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i
          );
          return { ...c, items: updatedItems };
        });
        const updated = { ...t, checklists: updatedChecklists };
        if (selectedTask?.id === taskId) setSelectedTask(updated);
        return updated;
      })
    );
  };

  const addComment = (taskId: string, content: string) => {
    const newComment = {
      id: `comm-${Date.now()}`,
      taskId,
      authorType: "user" as const,
      authorId: store.workspace.members[0].id,
      authorName: store.workspace.members[0].name,
      authorAvatar: store.workspace.members[0].avatarUrl,
      content,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updated = { ...t, comments: [...t.comments, newComment] };
        if (selectedTask?.id === taskId) setSelectedTask(updated);
        return updated;
      })
    );
  };

  const reviewApproval = (approvalId: string, decision: "approved" | "rejected", comment?: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: decision,
              reviewedBy: "Lucca Lagana",
              reviewedAt: new Date().toISOString(),
              reviewComment: comment,
            }
          : a
      )
    );
  };

  const triggerClaim = (agentId: string) => {
    const agent = store.workspace.agents.find((a) => a.id === agentId);
    if (!agent) return;

    const targetTask = tasks.find((t) => t.taskType === "agent_task") || tasks[0];
    const newRun: AgentRun = {
      id: `run-${Date.now()}`,
      workspaceId: store.workspace.id,
      agentId,
      agentName: agent.name,
      taskId: targetTask.id,
      taskTitle: targetTask.title,
      status: "running",
      startedAt: new Date().toISOString(),
      tokenUsage: { prompt: 1400, completion: 520, total: 1920 },
      costEstimate: 0.0032,
      events: [
        {
          id: `ev-new-1`,
          type: "thought",
          content: `Iniciando processamento autônomo com modelo ${agent.model}`,
          createdAt: new Date().toISOString(),
        },
        {
          id: `ev-new-2`,
          type: "tool_call",
          content: `${agent.allowedTools[0] || 'execute'}()`,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    setAgentRuns((prev) => [newRun, ...prev]);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        statuses: currentProject?.statuses || [],
        members,
        agents: store.workspace.agents,
        agentRuns,
        approvals,
        areas,
        currentArea,
        currentProject,
        selectedTask,
        isNewTaskModalOpen,
        isNewBoardModalOpen,
        isNewTeamModalOpen,
        isDeleteBoardModalOpen,
        boardToDelete,
        setSelectedTask,
        setIsNewTaskModalOpen,
        setIsNewBoardModalOpen,
        setIsNewTeamModalOpen,
        setIsDeleteBoardModalOpen,
        setBoardToDelete,
        setCurrentProjectBySlug,
        moveTask,
        updateTask,
        createTask,
        createProject,
        deleteProject,
        updateProject,
        createTeam,
        deleteTeam,
        deleteTask,
        toggleChecklist,
        addComment,
        reviewApproval,
        triggerClaim,
        updateMemberRole,
        inviteMember,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks deve ser usado dentro de TaskProvider");
  }
  return context;
}
