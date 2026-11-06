/**
 * MedHit Integrações & Automações
 * Contexto de Tarefas, Quadros, Equipes e Permissões do MedHit Tasks.
 * 
 * Atualizado com controle de permissões por perfil (RBAC),
 * auditoria e proteção contra visualização não autorizada de telemetria.
 * Assinado por: MedHit Integrações & Automações
 */

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
  Comment,
  BoardGroup,
  TaskCustomFields,
  store,
} from "@/server/services/data-store";
import { toast } from "sonner";
import { telemetry } from "@/lib/telemetry";
import { supabase, mapRowToTask, mapTaskToRow } from "@/lib/supabase";

/**
 * Padroniza nomes de exibição dos usuários: Primeiro Nome + Primeira Letra do Sobrenome (ex: "Lucca G.", "Thiago G.")
 */
export function formatMemberName(fullName: string): string {
  if (!fullName) return "";
  const trimmed = fullName.trim();
  // Se contiver menção a Lagana, substitui imediatamente
  const cleanName = trimmed.replace(/\blagana\b/gi, "Guidorizzi").trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  const firstName = parts[0];
  const lastPart = parts[parts.length - 1];
  // Se já estiver no padrão "Nome S." ou "Nome S", preserva
  if (/^[A-Za-z]\.?$/.test(lastPart)) {
    return `${firstName} ${lastPart.replace(".", "")}.`;
  }
  const lastInitial = lastPart.charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

export type UserRole = "owner" | "admin" | "member" | "guest";

export type PermissionAction =
  | "view_telemetry"
  | "export_telemetry"
  | "clear_telemetry"
  | "manage_members"
  | "change_member_role"
  | "manage_settings"
  | "manage_mcp"
  | "manage_ai_tokens"
  | "create_board"
  | "delete_board"
  | "create_team"
  | "delete_team"
  | "create_task"
  | "edit_task"
  | "delete_task"
  | "review_approvals";

export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  owner: [
    "view_telemetry",
    "export_telemetry",
    "clear_telemetry",
    "manage_members",
    "change_member_role",
    "manage_settings",
    "manage_mcp",
    "manage_ai_tokens",
    "create_board",
    "delete_board",
    "create_team",
    "delete_team",
    "create_task",
    "edit_task",
    "delete_task",
    "review_approvals",
  ],
  admin: [
    "view_telemetry",
    "export_telemetry",
    "clear_telemetry",
    "manage_members",
    "change_member_role",
    "manage_settings",
    "manage_mcp",
    "create_board",
    "delete_board",
    "create_team",
    "create_task",
    "edit_task",
    "delete_task",
    "review_approvals",
  ],
  member: [
    "create_board",
    "create_task",
    "edit_task",
    "delete_task",
  ],
  guest: [],
};

interface TaskContextType {
  tasks: Task[];
  statuses: Status[];
  members: Member[];
  agents: Agent[];
  agentRuns: AgentRun[];
  approvals: Approval[];
  areas: Area[];
  currentArea: Area | null;
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  selectedTask: Task | null;
  isNewTaskModalOpen: boolean;
  isNewBoardModalOpen: boolean;
  isNewTeamModalOpen: boolean;
  isDeleteBoardModalOpen: boolean;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
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
  createGroup: (projectId: string, name: string, color?: string) => BoardGroup | null;
  updateGroup: (projectId: string, groupId: string, updates: Partial<BoardGroup>) => void;
  deleteGroup: (projectId: string, groupId: string) => void;
  createSubtask: (parentId: string, title: string, initialFields?: Partial<Task>) => Task | null;
  toggleTaskTimer: (taskId: string) => void;
  createTeam: (data: { name: string; description?: string; color?: string; icon?: string }) => Area;
  updateTeam: (teamId: string, updates: Partial<Area>) => void;
  deleteTeam: (teamId: string) => void;
  createFolder: (areaSlug: string, folderName: string) => void;
  deleteFolder: (areaSlug: string, folderName: string) => void;
  deleteTask: (taskId: string) => void;
  toggleChecklist: (taskId: string, checklistId: string, itemId: string) => void;
  addComment: (taskId: string, content: string) => void;
  reviewApproval: (approvalId: string, decision: "approved" | "rejected", comment?: string) => void;
  triggerClaim: (agentId: string) => void;
  currentUser: Member;
  authenticatedUser: Member;
  isOwnerSession: boolean;
  isSimulating: boolean;
  restoreOwnerUser: () => void;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (email: string, password?: string, remember?: boolean) => { success: boolean; error?: string };
  logout: () => void;
  hasPermission: (action: PermissionAction) => boolean;
  switchActiveRole: (role: UserRole) => void;
  switchActiveUser: (memberId: string) => void;
  updateMemberRole: (memberId: string, role: Member["role"]) => void;
  updateMemberPassword: (memberId: string, newPass: string) => void;
  regenerateMemberMcpToken: (memberId: string) => string;
  inviteMember: (data: { name: string; email: string; role: Member["role"]; initialPassword?: string }) => void;
  isAiConfigured: boolean;
  aiApiKey: string | null;
  saveAiApiKey: (key: string) => void;
  removeAiApiKey: () => void;
  isTaskVisibleForCurrentUser: (task: Task) => boolean;
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Flag para controle de hidratação e persistência em localStorage
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Hidratação a partir de localStorage no carregamento inicial (v2 limpo com pastas oficiais ClickUp)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Limpeza de chaves legadas e migração para a nova taxonomia CASA MEDHIT 2026
        if (localStorage.getItem("medhit_tasks_data_v1")) {
          localStorage.removeItem("medhit_tasks_data_v1");
        }
        if (localStorage.getItem("medhit_areas_data_v1")) {
          localStorage.removeItem("medhit_areas_data_v1");
        }
        if (localStorage.getItem("medhit_areas_data_v2")) {
          localStorage.removeItem("medhit_areas_data_v2");
        }
        if (localStorage.getItem("medhit_areas_data_v3")) {
          localStorage.removeItem("medhit_areas_data_v3");
        }
        if (localStorage.getItem("medhit_tasks_data_v3")) {
          localStorage.removeItem("medhit_tasks_data_v3");
        }
        if (localStorage.getItem("medhit_members_data_v3")) {
          localStorage.removeItem("medhit_members_data_v3");
        }

        const storedAreas = localStorage.getItem("medhit_v2_areas");
        if (storedAreas) {
          const parsed = JSON.parse(storedAreas);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAreas(parsed);
            store.workspace.areas = parsed;
          } else {
            setAreas(store.workspace.areas);
            localStorage.setItem("medhit_v2_areas", JSON.stringify(store.workspace.areas));
          }
        } else {
          setAreas(store.workspace.areas);
          localStorage.setItem("medhit_v2_areas", JSON.stringify(store.workspace.areas));
        }

        const storedTasks = localStorage.getItem("medhit_v2_tasks");
        if (storedTasks) {
          const parsed = JSON.parse(storedTasks);
          if (Array.isArray(parsed)) {
            setTasks(parsed);
            store.tasks = parsed;
          } else {
            setTasks(store.tasks);
            localStorage.setItem("medhit_v2_tasks", JSON.stringify(store.tasks));
          }
        } else {
          setTasks(store.tasks);
          localStorage.setItem("medhit_v2_tasks", JSON.stringify(store.tasks));
        }

        // Limpa chave legada de membros com duplicações
        if (localStorage.getItem("medhit_members_data_v1")) {
          localStorage.removeItem("medhit_members_data_v1");
        }
        if (localStorage.getItem("medhit_members_data_v2")) {
          localStorage.removeItem("medhit_members_data_v2");
        }

        const storedMembers = localStorage.getItem("medhit_v2_members");
        if (storedMembers) {
          const parsed = JSON.parse(storedMembers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Deduplica estritamente por e-mail e id
            const seenEmails = new Set<string>();
            const uniqueList: Member[] = [];

            for (const m of parsed) {
              const emailKey = (m.email || "").toLowerCase().trim();
              if (!emailKey || seenEmails.has(emailKey)) continue;
              seenEmails.add(emailKey);

              // Formata nome estritamente no padrão Nome + Inicial do Sobrenome (ex: Lucca G., Thiago G.)
              const formattedName = formatMemberName(m.name || (emailKey.includes("lucca") ? "Lucca Guidorizzi" : "Membro"));
              const updatedMember: Member = {
                ...m,
                name: formattedName,
                email: emailKey,
              };
              uniqueList.push(updatedMember);
            }

            // Garante membros oficiais do seed com nomes formatados
            store.workspace.members.forEach((defMember) => {
              const defEmail = defMember.email.toLowerCase().trim();
              if (!seenEmails.has(defEmail)) {
                seenEmails.add(defEmail);
                uniqueList.push({
                  ...defMember,
                  name: formatMemberName(defMember.name),
                });
              }
            });

            setMembers(uniqueList);
            store.workspace.members = uniqueList;
            localStorage.setItem("medhit_v2_members", JSON.stringify(uniqueList));
          } else {
            const seedMembers = store.workspace.members.map((m) => ({ ...m, name: formatMemberName(m.name) }));
            setMembers(seedMembers);
            localStorage.setItem("medhit_v2_members", JSON.stringify(seedMembers));
          }
        } else {
          const seedMembers = store.workspace.members.map((m) => ({ ...m, name: formatMemberName(m.name) }));
          setMembers(seedMembers);
          localStorage.setItem("medhit_v2_members", JSON.stringify(seedMembers));
        }

        // Recupera sessão persistida
        const sessionStr = localStorage.getItem("medhit_auth_session_v1") || sessionStorage.getItem("medhit_auth_session_v1");
        if (sessionStr) {
          const parsedSession = JSON.parse(sessionStr);
          if (parsedSession?.userId) {
            setAuthenticatedUserId(parsedSession.userId);
            setActiveUserId(parsedSession.userId);
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error("Falha ao recuperar dados do localStorage:", err);
      } finally {
        setHasHydrated(true);
      }
    }
  }, []);

  // Persiste tasks sempre que alteradas após hidratação
  useEffect(() => {
    if (hasHydrated && typeof window !== "undefined") {
      try {
        localStorage.setItem("medhit_v2_tasks", JSON.stringify(tasks));
        store.tasks = tasks;
      } catch (e) {
        console.error("Erro ao salvar tarefas:", e);
      }
    }
  }, [tasks, hasHydrated]);

  // Sincronização viva com o Supabase e Realtime para eliminar dependência de localStorage isolado
  useEffect(() => {
    if (typeof window === "undefined") return;

    const fetchTasksFromSource = async () => {
      try {
        const { data, error } = await supabase
          .from("medtask_tasks")
          .select("*")
          .order("position", { ascending: true });

        if (!error && Array.isArray(data)) {
          const loaded = data.map(mapRowToTask);
          setTasks(loaded);
          store.tasks = loaded;
          return;
        }

        // Fallback para rota interna /api/tasks caso supabase client direto falhe
        const res = await fetch("/api/tasks");
        if (res.ok) {
          const apiTasks = await res.json();
          if (Array.isArray(apiTasks) && apiTasks.length > 0) {
            setTasks(apiTasks);
            store.tasks = apiTasks;
          }
        }
      } catch (err) {
        console.warn("[task-context] Falha na sincronização de tarefas:", err);
      }
    };

    fetchTasksFromSource();

    // Inscrição em tempo real no Supabase
    const channel = supabase
      .channel("medtask_tasks_live_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "medtask_tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTask = mapRowToTask(payload.new);
            setTasks((prev) => {
              if (prev.some((t) => t.id === newTask.id)) return prev;
              return [newTask, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedTask = mapRowToTask(payload.new);
            setTasks((prev) =>
              prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setTasks((prev) => prev.filter((t) => t.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    // Polling suave a cada 6 segundos quando a aba estiver visível
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchTasksFromSource();
      }
    }, 6000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Persiste areas sempre que alteradas após hidratação
  useEffect(() => {
    if (hasHydrated && typeof window !== "undefined") {
      try {
        localStorage.setItem("medhit_v2_areas", JSON.stringify(areas));
        store.workspace.areas = areas;
      } catch (e) {
        console.error("Erro ao salvar áreas:", e);
      }
    }
  }, [areas, hasHydrated]);

  // Persiste members sempre que alterados após hidratação (deduplicando estritamente por e-mail e aplicando padrão Nome + Inicial)
  useEffect(() => {
    if (hasHydrated && typeof window !== "undefined") {
      try {
        const seen = new Set<string>();
        const deduped: Member[] = [];
        for (const m of members) {
          const email = (m.email || "").toLowerCase().trim();
          if (!email || seen.has(email)) continue;
          seen.add(email);
          deduped.push({
            ...m,
            name: formatMemberName(m.name),
          });
        }
        localStorage.setItem("medhit_v2_members", JSON.stringify(deduped));
        store.workspace.members = deduped;
      } catch (e) {
        console.error("Erro ao salvar membros:", e);
      }
    }
  }, [members, hasHydrated]);

  // Usuário que realizou login institucional (Sessão real)
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string>(() => {
    const defaultUser = store.workspace.members.find(
      (m) => m.email === "lucca@medhit.com.br" || m.name.toLowerCase().includes("lucca")
    ) || store.workspace.members[0];
    return defaultUser?.id || "user-1";
  });

  // Usuário ativo para visualização / simulação (pode ser alternado exclusivamente pelo Owner)
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    const defaultUser = store.workspace.members.find(
      (m) => m.email === "lucca@medhit.com.br" || m.name.toLowerCase().includes("lucca")
    ) || store.workspace.members[0];
    return defaultUser?.id || "user-1";
  });
  const [simulatedRole, setSimulatedRole] = useState<UserRole | null>(null);

  const rawAuthUser = members.find((m) => m.id === authenticatedUserId) || members[0];
  const authenticatedUser: Member = rawAuthUser;

  // Verifica se a sessão autenticada pertence exclusivamente ao Proprietário (Lucca)
  const isOwnerSession = Boolean(
    authenticatedUser &&
    (authenticatedUser.email.toLowerCase() === "lucca@medhit.com.br" ||
     authenticatedUser.email.toLowerCase() === "lucca.guidorizzi@medhit.com.br" ||
     authenticatedUser.role === "owner")
  );

  const rawUser = members.find((m) => m.id === activeUserId) || members[0];
  const currentUser: Member = {
    ...rawUser,
    role: (simulatedRole || rawUser.role) as Member["role"],
  };

  const isSimulating = Boolean(activeUserId !== authenticatedUserId || simulatedRole !== null);

  const restoreOwnerUser = () => {
    setActiveUserId(authenticatedUserId);
    setSimulatedRole(null);
    telemetry.track(
      "rbac_user_restored",
      `Visualização restaurada para o usuário autenticado: ${authenticatedUser.name}`,
      { userId: authenticatedUserId },
      "info",
      "task-context"
    );
    toast.success(`Visualização restaurada: ${authenticatedUser.name}`);
  };

  const hasPermission = (action: PermissionAction): boolean => {
    const allowed = ROLE_PERMISSIONS[currentUser.role] || [];
    return allowed.includes(action);
  };

  const switchActiveRole = (newRole: UserRole) => {
    if (!isOwnerSession) {
      toast.error("Apenas o Proprietário tem permissão para simular papéis RBAC.");
      return;
    }
    setSimulatedRole(newRole);
    telemetry.track(
      "rbac_role_switched",
      `Perfil de acesso ativo alternado para: ${newRole.toUpperCase()}`,
      { previousRole: currentUser.role, newRole },
      "info",
      "task-context"
    );
    toast.success(`Perfil ativo simulado como: ${newRole.toUpperCase()}`);
  };

  const switchActiveUser = (memberId: string) => {
    if (!isOwnerSession) {
      toast.error("Apenas o Proprietário tem permissão para alternar contas de teste.");
      return;
    }
    const found = members.find((m) => m.id === memberId);
    if (found) {
      setActiveUserId(memberId);
      setSimulatedRole(null);
      telemetry.track(
        "rbac_user_switched",
        `Usuário ativo alternado para: ${found.name} (${found.role})`,
        { memberId, role: found.role },
        "info",
        "task-context"
      );
      toast.success(`Simulando: ${found.name} (${found.role})`);
    }
  };

  const login = (email: string, password?: string, remember: boolean = true): { success: boolean; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = (password || "").trim();

    // Permite login tanto por lucca.guidorizzi@medhit.com.br quanto por lucca@medhit.com.br, e thiago.ghiraldini@medhit.com.br quanto thiago@medhit.com.br
    const found = members.find((m) => {
      const mEmail = m.email.toLowerCase();
      if (mEmail === cleanEmail) return true;
      if (
        (cleanEmail === "lucca.guidorizzi@medhit.com.br" || cleanEmail === "lucca@medhit.com.br") &&
        (mEmail === "lucca.guidorizzi@medhit.com.br" || mEmail === "lucca@medhit.com.br")
      ) {
        return true;
      }
      if (
        (cleanEmail === "thiago.ghiraldini@medhit.com.br" || cleanEmail === "thiago@medhit.com.br") &&
        (mEmail === "thiago.ghiraldini@medhit.com.br" || mEmail === "thiago@medhit.com.br")
      ) {
        return true;
      }
      return false;
    });

    if (!found) {
      return { success: false, error: "E-mail não encontrado no sistema institucional." };
    }

    const expectedPass = found.password || "x32kd58";
    if (cleanPass !== expectedPass) {
      return { success: false, error: "Senha incorreta. Verifique suas credenciais." };
    }

    setAuthenticatedUserId(found.id);
    setActiveUserId(found.id);
    setSimulatedRole(null);
    setIsAuthenticated(true);

    if (typeof window !== "undefined") {
      try {
        const sessionPayload = {
          userId: found.id,
          email: found.email,
          loggedInAt: new Date().toISOString(),
          remember,
        };
        if (remember) {
          localStorage.setItem("medhit_auth_session_v1", JSON.stringify(sessionPayload));
        } else {
          sessionStorage.setItem("medhit_auth_session_v1", JSON.stringify(sessionPayload));
        }
      } catch (e) {
        console.error("Erro ao gravar sessão no storage:", e);
      }
    }

    telemetry.track(
      "auth_login_success",
      `Login autenticado para ${found.name} (${found.role})`,
      { userId: found.id, role: found.role },
      "success",
      "task-context"
    );

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setSimulatedRole(null);
    const defaultUser = store.workspace.members.find(
      (m) => m.email === "lucca@medhit.com.br" || m.name.toLowerCase().includes("lucca")
    ) || store.workspace.members[0];
    const fallbackId = defaultUser?.id || "user-1";
    setAuthenticatedUserId(fallbackId);
    setActiveUserId(fallbackId);

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("medhit_auth_session_v1");
        sessionStorage.removeItem("medhit_auth_session_v1");
      } catch (e) {
        console.error("Erro ao limpar sessão:", e);
      }
    }
    telemetry.track(
      "auth_logout",
      `Sessão encerrada pelo usuário ${currentUser.name}`,
      { userId: currentUser.id },
      "info",
      "task-context"
    );
  };

  // Gestão de Chave de IA e Estado de Ativação dos Agentes
  const [aiApiKey, setAiApiKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("medhit_ai_api_key");
      if (storedKey && storedKey.trim().length > 0) {
        setAiApiKey(storedKey.trim());
      }
    }
  }, []);

  const isAiConfigured = Boolean(aiApiKey && aiApiKey.trim().length > 0);

  const saveAiApiKey = (key: string) => {
    if (!hasPermission("manage_ai_tokens")) {
      toast.error("Permissão insuficiente para alterar credenciais de IA.");
      return;
    }
    const cleanKey = key.trim();
    if (!cleanKey) {
      removeAiApiKey();
      return;
    }
    setAiApiKey(cleanKey);
    if (typeof window !== "undefined") {
      localStorage.setItem("medhit_ai_api_key", cleanKey);
    }
    telemetry.track(
      "ai_key_configured",
      "Chave de API de Inteligência Artificial vinculada com sucesso",
      { provider: cleanKey.startsWith("sk-") ? "openai" : "custom" },
      "success",
      "task-context"
    );
    toast.success("Chave de IA configurada! Módulo de Agentes ativado.");
  };

  const removeAiApiKey = () => {
    if (!hasPermission("manage_ai_tokens")) {
      toast.error("Permissão insuficiente para alterar credenciais de IA.");
      return;
    }
    setAiApiKey(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("medhit_ai_api_key");
    }
    telemetry.track(
      "ai_key_removed",
      "Chave de API de Inteligência Artificial desconectada. Agentes desativados.",
      {},
      "warn",
      "task-context"
    );
    toast.info("Chave de IA removida. Agentes desativados.");
  };

  const isTaskVisibleForCurrentUser = (task: Task): boolean => {
    if (currentUser.role === "guest") {
      const isAssigned = task.assigneeIds.some(
        (a) => a.id === currentUser.id || a.name.toLowerCase() === currentUser.name.toLowerCase()
      );
      const isReporter = task.reporterId === currentUser.id;
      return isAssigned || isReporter;
    }
    return true;
  };


  // Inicializa com null para que a tela inicial /medhit carregue limpa
  const [currentArea, setCurrentArea] = useState<Area | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  /**
   * Resolução à prova de falhas: busca projeto por slug da área e do projeto.
   * Se o projeto não for localizado (por exemplo, após exclusão ou slug inválido),
   * registra aviso na telemetria e define currentProject como null de forma segura,
   * permitindo que as páginas ativem seu fallback elegante e auto-redirect.
   */
  const setCurrentProjectBySlug = (areaSlug: string, projectSlug: string) => {
    // 1. Procura na área indicada pelo slug
    let targetArea = areas.find((a) => a.slug === areaSlug) || null;
    let targetProject = targetArea?.projects?.find((p) => p.slug === projectSlug) || null;

    // 2. Se não encontrou na área indicada, busca em todas as outras áreas
    if (!targetProject) {
      for (const a of areas) {
        const found = a.projects?.find((p) => p.slug === projectSlug);
        if (found) {
          targetArea = a;
          targetProject = found;
          break;
        }
      }
    }

    if (targetArea) {
      setCurrentArea(targetArea);
    }

    if (targetProject) {
      setCurrentProject(targetProject);
      telemetry.track(
        "view_switched",
        `Quadro ativo selecionado: "${targetProject.name}"`,
        { areaSlug: targetArea?.slug, projectSlug: targetProject.slug, projectId: targetProject.id },
        "info",
        "task-context"
      );
    } else {
      // Projeto não existe mais ou slug inválido
      telemetry.track(
        "navigation",
        `Quadro "${projectSlug}" não localizado na área "${areaSlug}". Ativando modo de segurança.`,
        { areaSlug, projectSlug },
        "warn",
        "task-context"
      );
      setCurrentProject(null);
    }
  };

  const createTeam = (data: { name: string; description?: string; color?: string; icon?: string }): Area => {
    if (!hasPermission("create_team")) {
      toast.error("Permissão insuficiente para criar equipes.");
      return null as unknown as Area;
    }

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

    telemetry.track(
      "team_created",
      `Time "${data.name}" criado com sucesso`,
      { teamId: newTeamId, name: data.name, slug: newArea.slug },
      "success",
      "task-context"
    );

    toast.success(`Time "${data.name}" criado com sucesso!`);
    return newArea;
  };

  const deleteTeam = (teamId: string) => {
    if (!hasPermission("delete_team")) {
      toast.error("Permissão insuficiente. Apenas Administradores e Owners podem excluir equipes.");
      return;
    }

    if (areas.length <= 1) {
      toast.error("O workspace precisa ter pelo menos uma equipe ativa.");
      return;
    }

    const teamToRemove = areas.find((a) => a.id === teamId);
    const updated = areas.filter((a) => a.id !== teamId);
    setAreas(updated);
    store.workspace.areas = updated;
    // Remove também as tarefas vinculadas
    setTasks((prev) => prev.filter((t) => t.areaId !== teamId));

    if (currentArea?.id === teamId) {
      const fallbackArea = updated[0];
      setCurrentArea(fallbackArea);
      setCurrentProject(fallbackArea?.projects[0] || null);
    }

    telemetry.track(
      "team_deleted",
      `Equipe "${teamToRemove?.name || teamId}" removida`,
      { teamId, name: teamToRemove?.name },
      "warn",
      "task-context"
    );

    toast.success("Time removido com sucesso!");
  };

  const updateTeam = (teamId: string, updates: Partial<Area>) => {
    if (!hasPermission("create_team") && currentUser.role !== "owner" && currentUser.role !== "admin") {
      toast.error("Permissão insuficiente para editar áreas de trabalho.");
      return;
    }

    const updated = areas.map((a) => {
      if (a.id === teamId) {
        return { ...a, ...updates };
      }
      return a;
    });

    setAreas(updated);
    store.workspace.areas = updated;

    if (currentArea?.id === teamId) {
      setCurrentArea((prev) => (prev ? { ...prev, ...updates } : null));
    }

    telemetry.track(
      "team_updated",
      `Área de trabalho "${teamId}" atualizada`,
      { teamId, updates },
      "info",
      "task-context"
    );

    toast.success("Área de trabalho atualizada!");
  };

  const createFolder = (areaSlug: string, folderName: string) => {
    const clean = folderName.trim().replace(/^#/, "");
    if (!clean) {
      toast.error("Informe um nome válido para a pasta.");
      return;
    }

    const updated = areas.map((a) => {
      if (a.slug === areaSlug || a.id === areaSlug) {
        const currentFolders = a.folders || [];
        if (!currentFolders.includes(clean)) {
          return {
            ...a,
            folders: [...currentFolders, clean],
          };
        }
      }
      return a;
    });

    setAreas(updated);
    store.workspace.areas = updated;
    telemetry.track("folder_created", `Pasta "${clean}" criada na área "${areaSlug}"`, { areaSlug, folder: clean }, "success", "task-context");
    toast.success(`Pasta "${clean}" adicionada ao espaço!`);
  };

  const deleteFolder = (areaSlug: string, folderName: string) => {
    const clean = folderName.trim().replace(/^#/, "");
    const updated = areas.map((a) => {
      if (a.slug === areaSlug || a.id === areaSlug) {
        return {
          ...a,
          folders: (a.folders || []).filter((f) => f !== clean),
        };
      }
      return a;
    });

    setAreas(updated);
    store.workspace.areas = updated;
    telemetry.track("folder_deleted", `Pasta "${clean}" removida da área "${areaSlug}"`, { areaSlug, folder: clean }, "warn", "task-context");
    toast.success(`Pasta "${clean}" removida.`);
  };

  const deleteProject = (projectId: string) => {
    if (!hasPermission("delete_board")) {
      toast.error("Permissão insuficiente para excluir quadros.");
      return;
    }

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

    // Busca o primeiro projeto disponível remanescente em qualquer equipe
    for (const a of updatedAreas) {
      if (a.projects && a.projects.length > 0) {
        nextAreaToSelect = a;
        nextProjectToSelect = a.projects[0];
        break;
      }
    }

    // Se o projeto deletado for o projeto ativo atual, limpa a seleção para retornar à home limpa
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
      setCurrentArea(null);
    }

    setIsDeleteBoardModalOpen(false);
    setBoardToDelete(null);

    telemetry.track(
      "project_deleted",
      `Quadro "${removedName || projectId}" excluído`,
      {
        projectId,
        projectName: removedName,
        nextProjectId: nextProjectToSelect?.id || null,
        nextAreaSlug: nextAreaToSelect?.slug || null,
      },
      "warn",
      "task-context"
    );

    toast.success(`Quadro "${removedName || "selecionado"}" excluído com sucesso!`);
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    let updatedProjName = "";
    const updatedAreas = areas.map((area) => ({
      ...area,
      projects: area.projects.map((p) => {
        if (p.id === projectId) {
          const updated = { ...p, ...updates };
          updatedProjName = updated.name;
          if (currentProject?.id === projectId) {
            setCurrentProject(updated);
          }
          return updated;
        }
        return p;
      }),
    }));

    setAreas(updatedAreas);
    store.workspace.areas = updatedAreas;

    telemetry.track(
      "project_updated",
      `Quadro "${updatedProjName || projectId}" atualizado`,
      { projectId, updates },
      "info",
      "task-context"
    );

    toast.success("Quadro atualizado com sucesso!");
  };



  const createProject = (data: {
    name: string;
    description?: string;
    areaSlug: string;
    color?: string;
    methodology?: "kanban" | "scrum" | "simple";
  }): Project => {
    if (!hasPermission("create_board")) {
      toast.error("Permissão insuficiente para criar quadros.");
      return null as unknown as Project;
    }

    const slug = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const targetArea = areas.find((a) => a.slug === data.areaSlug) || areas[0];
    const newProjId = `proj-${targetArea.id}-${Date.now()}`;

    const defaultStatuses: Status[] = [
      { id: `st-${newProjId}-1`, workspaceId: store.workspace.id, projectId: newProjId, name: "A Fazer", color: "#64748b", position: 1000, category: "todo" },
      { id: `st-${newProjId}-2`, workspaceId: store.workspace.id, projectId: newProjId, name: "Em Andamento", color: "#38bdf8", position: 2000, category: "in_progress" },
      { id: `st-${newProjId}-3`, workspaceId: store.workspace.id, projectId: newProjId, name: "Em Revisão", color: "#f59e0b", position: 2500, category: "review" },
      { id: `st-${newProjId}-4`, workspaceId: store.workspace.id, projectId: newProjId, name: "Concluído", color: "#10b981", position: 3000, category: "done" },
    ];

    const newProject: Project = {
      id: newProjId,
      workspaceId: store.workspace.id,
      areaId: targetArea.id,
      name: data.name,
      slug: slug || `quadro-${Date.now()}`,
      description: data.description || "",
      icon: "layout",
      color: data.color || "#38bdf8",
      methodology: "kanban",
      statuses: defaultStatuses,
      sprints: [],
    };

    const updatedAreas = areas.map((a) => {
      if (a.id === targetArea.id) {
        return {
          ...a,
          projects: [...a.projects, newProject],
        };
      }
      return a;
    });

    setAreas(updatedAreas);
    store.workspace.areas = updatedAreas;
    setCurrentArea(targetArea);
    setCurrentProject(newProject);

    telemetry.track(
      "project_created",
      `Quadro "${data.name}" criado com metodologia ${data.methodology || "kanban"}`,
      { projectId: newProjId, name: data.name, areaSlug: targetArea.slug },
      "success",
      "task-context"
    );

    return newProject;
  };

  const createGroup = (projectId: string, name: string, color?: string): BoardGroup | null => {
    if (!hasPermission("edit_task")) {
      toast.error("Permissão insuficiente para gerenciar grupos.");
      return null;
    }

    const newGroupId = `grp-${Date.now()}`;
    const defaultColors = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#3b82f6"];
    let createdGroup: BoardGroup | null = null;

    const updatedAreas = areas.map((area) => ({
      ...area,
      projects: area.projects.map((proj) => {
        if (proj.id === projectId) {
          const currentGroups = proj.groups || [];
          const assignedColor = color || defaultColors[currentGroups.length % defaultColors.length];
          const newGroup: BoardGroup = {
            id: newGroupId,
            projectId,
            name: name.trim() || `Novo Grupo ${currentGroups.length + 1}`,
            color: assignedColor,
            position: (currentGroups.length + 1) * 1000,
            collapsed: false,
          };
          createdGroup = newGroup;
          const updated = {
            ...proj,
            groups: [...currentGroups, newGroup],
          };
          if (currentProject?.id === projectId) {
            setCurrentProject(updated);
          }
          return updated;
        }
        return proj;
      }),
    }));

    setAreas(updatedAreas);
    store.workspace.areas = updatedAreas;

    telemetry.track(
      "group_created",
      `Novo grupo "${name}" criado no quadro`,
      { projectId, groupId: newGroupId },
      "success",
      "task-context"
    );

    toast.success(`Grupo "${name}" criado com sucesso!`);
    return createdGroup;
  };

  const updateGroup = (projectId: string, groupId: string, updates: Partial<BoardGroup>) => {
    if (!hasPermission("edit_task")) {
      toast.error("Permissão insuficiente para atualizar grupos.");
      return;
    }

    const updatedAreas = areas.map((area) => ({
      ...area,
      projects: area.projects.map((proj) => {
        if (proj.id === projectId) {
          const updatedGroups = (proj.groups || []).map((g) => {
            if (g.id === groupId) {
              return { ...g, ...updates };
            }
            return g;
          });
          const updated = {
            ...proj,
            groups: updatedGroups,
          };
          if (currentProject?.id === projectId) {
            setCurrentProject(updated);
          }
          return updated;
        }
        return proj;
      }),
    }));

    setAreas(updatedAreas);
    store.workspace.areas = updatedAreas;
  };

  const deleteGroup = (projectId: string, groupId: string) => {
    if (!hasPermission("edit_task")) {
      toast.error("Permissão insuficiente para excluir grupos.");
      return;
    }

    // Regra de tarefas órfãs: tarefas vinculadas a este groupId perdem o vínculo e caem no grupo padrão (sem grupo)
    setTasks((prev) =>
      prev.map((t) => {
        if (t.projectId === projectId && t.groupId === groupId) {
          const updated: Task = { ...t, groupId: undefined, updatedAt: new Date().toISOString() };
          supabase
            .from("medtask_tasks")
            .update(mapTaskToRow(updated))
            .eq("id", t.id)
            .then();
          return updated;
        }
        return t;
      })
    );

    const updatedAreas = areas.map((area) => ({
      ...area,
      projects: area.projects.map((proj) => {
        if (proj.id === projectId) {
          const updatedGroups = (proj.groups || []).filter((g) => g.id !== groupId);
          const updated = {
            ...proj,
            groups: updatedGroups,
          };
          if (currentProject?.id === projectId) {
            setCurrentProject(updated);
          }
          return updated;
        }
        return proj;
      }),
    }));

    setAreas(updatedAreas);
    store.workspace.areas = updatedAreas;

    toast.info("Grupo removido. Tarefas vinculadas foram movidas para 'Sem Grupo'.");
  };

  const moveTask = (taskId: string, targetStatusId: string) => {
    if (!hasPermission("edit_task")) {
      toast.error("Permissão insuficiente para movimentar tarefas.");
      return;
    }

    let movedTaskTitle = "";
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          movedTaskTitle = t.title;
          return {
            ...t,
            statusId: targetStatusId,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );

    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) =>
        prev ? { ...prev, statusId: targetStatusId, updatedAt: new Date().toISOString() } : null
      );
    }

    // Persistência no banco Supabase
    supabase
      .from("medtask_tasks")
      .update({ status_id: targetStatusId, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .then();

    telemetry.track(
      "task_moved",
      `Tarefa "${movedTaskTitle || taskId}" movida para novo status`,
      { taskId, targetStatusId },
      "info",
      "task-context"
    );
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    if (!hasPermission("edit_task")) {
      toast.error("Permissão insuficiente para atualizar tarefas.");
      return;
    }

    let updatedTitle = "";
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          updatedTitle = updates.title || t.title;
          return { ...t, ...updates, updatedAt: new Date().toISOString() };
        }
        return t;
      })
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
    }

    // Persistência no banco Supabase
    supabase
      .from("medtask_tasks")
      .update(mapTaskToRow(updates))
      .eq("id", taskId)
      .then();

    telemetry.track(
      "task_updated",
      `Tarefa "${updatedTitle || taskId}" atualizada`,
      { taskId, updates: Object.keys(updates) },
      "info",
      "task-context"
    );
  };

  const createTask = (data: any) => {
    if (!hasPermission("create_task")) {
      toast.error("Permissão insuficiente para criar tarefas.");
      return null as unknown as Task;
    }

    const newId = `task-${Date.now()}`;
    const fallbackProjectId = currentProject?.id || areas[0]?.projects[0]?.id || "proj-default";
    const fallbackAreaId = currentArea?.id || areas[0]?.id || "area-default";

    const newTask: Task = {
      id: newId,
      workspaceId: store.workspace.id,
      projectId: data.projectId || fallbackProjectId,
      areaId: data.areaId || fallbackAreaId,
      groupId: data.groupId,
      parentId: data.parentId,
      title: data.title,
      description: data.description || "",
      taskType: data.taskType || (data.parentId ? "subtask" : "task"),
      statusId: data.statusId,
      priority: data.priority || "none",
      position: (tasks.length + 1) * 1000,
      assigneeIds: data.assigneeIds && data.assigneeIds.length > 0
        ? data.assigneeIds
        : data.taskType === "agent_task"
        ? [{ type: "agent", id: store.workspace.agents[0].id, name: store.workspace.agents[0].name, avatarUrl: store.workspace.agents[0].avatarUrl }]
        : [],
      storyPoints: data.storyPoints,
      aiContext: data.aiContext,
      customFields: data.customFields || {},
      dueDate: data.dueDate,
      tags: data.tags || [],
      checklists: data.checklists || [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    // Persistência no banco Supabase
    supabase
      .from("medtask_tasks")
      .insert(mapTaskToRow(newTask))
      .then();

    telemetry.track(
      "task_created",
      `Nova tarefa criada: "${newTask.title}"`,
      { taskId: newId, projectId: newTask.projectId, priority: newTask.priority },
      "success",
      "task-context"
    );

    toast.success("Tarefa criada com sucesso!");
    return newTask;
  };

  const deleteTask = (taskId: string) => {
    if (!hasPermission("delete_task")) {
      toast.error("Permissão insuficiente para excluir tarefas.");
      return;
    }

    const taskToDelete = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }

    // Remoção no banco Supabase
    supabase
      .from("medtask_tasks")
      .delete()
      .eq("id", taskId)
      .then();

    telemetry.track(
      "task_deleted",
      `Tarefa "${taskToDelete?.title || taskId}" excluída`,
      { taskId },
      "warn",
      "task-context"
    );

    toast.success("Tarefa excluída");
  };

  const createSubtask = (
    parentId: string,
    title: string,
    initialFields?: Partial<Task>
  ): Task | null => {
    if (!hasPermission("create_task")) {
      toast.error("Permissão insuficiente para criar subtarefas.");
      return null;
    }

    const parentTask = tasks.find((t) => t.id === parentId);
    if (!parentTask) {
      toast.error("Tarefa pai não encontrada para criar subtarefa.");
      return null;
    }

    const newId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSubtask: Task = {
      id: newId,
      workspaceId: parentTask.workspaceId,
      projectId: parentTask.projectId,
      areaId: parentTask.areaId,
      groupId: parentTask.groupId,
      parentId: parentTask.id,
      title: title.trim(),
      description: initialFields?.description || "",
      taskType: "subtask",
      statusId: initialFields?.statusId || parentTask.statusId,
      priority: initialFields?.priority || parentTask.priority || "none",
      position: (tasks.filter((t) => t.parentId === parentId).length + 1) * 1000,
      assigneeIds: initialFields?.assigneeIds || [],
      dueDate: initialFields?.dueDate,
      tags: initialFields?.tags || [],
      customFields: {
        secondaryStatus: "Não Iniciado",
        pillStatus: "Não Iniciado",
        ...initialFields?.customFields,
      },
      checklists: initialFields?.checklists || [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [...prev, newSubtask]);

    // Persistência no banco Supabase
    supabase
      .from("medtask_tasks")
      .insert(mapTaskToRow(newSubtask))
      .then();

    telemetry.track(
      "subtask_created",
      `Nova subtarefa criada: "${newSubtask.title}" vinculada a "${parentTask.title}"`,
      { parentId, subtaskId: newId, projectId: newSubtask.projectId },
      "success",
      "task-context"
    );

    toast.success(`Subitem "${title}" adicionado!`);
    return newSubtask;
  };

  const toggleTaskTimer = (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const isCurrentlyRunning = !!targetTask.customFields?.timerRunningSince;

    if (isCurrentlyRunning) {
      // Pausar timer
      const startTime = new Date(targetTask.customFields!.timerRunningSince!).getTime();
      const deltaSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      const accumulated = (targetTask.customFields?.timeSpentSeconds || 0) + deltaSeconds;

      const updatedCustomFields: TaskCustomFields = {
        ...targetTask.customFields,
        timeSpentSeconds: accumulated,
        timerRunningSince: null,
      };

      updateTask(taskId, { customFields: updatedCustomFields });
      const minutes = Math.floor(accumulated / 60);
      const seconds = accumulated % 60;
      toast.info(`Cronômetro pausado (${minutes}m ${seconds}s acumulados).`);
    } else {
      // Iniciar timer: primeiro pausar qualquer outra tarefa com timer rodando (regra de timer único)
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId && t.customFields?.timerRunningSince) {
            const start = new Date(t.customFields.timerRunningSince).getTime();
            const delta = Math.max(0, Math.floor((Date.now() - start) / 1000));
            const total = (t.customFields.timeSpentSeconds || 0) + delta;
            const updated: Task = {
              ...t,
              customFields: {
                ...t.customFields,
                timeSpentSeconds: total,
                timerRunningSince: null,
              },
              updatedAt: new Date().toISOString(),
            };
            supabase
              .from("medtask_tasks")
              .update(mapTaskToRow(updated))
              .eq("id", t.id)
              .then();
            return updated;
          }
          if (t.id === taskId) {
            const updated: Task = {
              ...t,
              customFields: {
                ...t.customFields,
                timerRunningSince: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            };
            supabase
              .from("medtask_tasks")
              .update(mapTaskToRow(updated))
              .eq("id", t.id)
              .then();
            return updated;
          }
          return t;
        })
      );
      toast.success(`Cronômetro iniciado para "${targetTask.title}".`);
    }
  };

  const toggleChecklist = (taskId: string, checklistId: string, itemId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    const canToggle =
      hasPermission("edit_task") ||
      (currentUser.role === "guest" && targetTask && isTaskVisibleForCurrentUser(targetTask));

    if (!canToggle) {
      toast.error("Permissão insuficiente para alterar critérios de aceite.");
      return;
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedChecklists = t.checklists.map((c) => {
            if (c.id === checklistId) {
              return {
                ...c,
                items: c.items.map((i) =>
                  i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i
                ),
              };
            }
            return c;
          });
          return { ...t, checklists: updatedChecklists };
        }
        return t;
      })
    );

    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => {
        if (!prev) return null;
        const updatedChecklists = prev.checklists.map((c) => {
          if (c.id === checklistId) {
            return {
              ...c,
              items: c.items.map((i) =>
                i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i
              ),
            };
          }
          return c;
        });
        return { ...prev, checklists: updatedChecklists };
      });
    }
  };

  const addComment = (taskId: string, content: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    const canComment =
      hasPermission("create_task") ||
      hasPermission("edit_task") ||
      (currentUser.role === "guest" && targetTask && isTaskVisibleForCurrentUser(targetTask));

    if (!canComment) {
      toast.error("Permissão insuficiente para comentar em tarefas.");
      return;
    }

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      taskId,
      authorType: "user",
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      content,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, comments: [...(t.comments || []), newComment] } : t
      )
    );

    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) =>
        prev ? { ...prev, comments: [...(prev.comments || []), newComment] } : null
      );
    }

    telemetry.track(
      "task_updated",
      `Comentário adicionado à tarefa ${taskId}`,
      { taskId, commentId: newComment.id },
      "info",
      "task-context"
    );

    toast.success("Comentário adicionado!");
  };

  const reviewApproval = (approvalId: string, decision: "approved" | "rejected", comment?: string) => {
    if (!hasPermission("review_approvals")) {
      toast.error("Permissão insuficiente para homologar solicitações de IA.");
      return;
    }

    setApprovals((prev) =>
      prev.map((app) =>
        app.id === approvalId
          ? {
              ...app,
              status: decision,
              reviewerComment: comment,
              reviewedAt: new Date().toISOString(),
            }
          : app
      )
    );

    telemetry.track(
      "approval_decision",
      `Aprovação ${approvalId} foi ${decision === "approved" ? "aprovada" : "rejeitada"}`,
      { approvalId, decision, comment },
      decision === "approved" ? "success" : "warn",
      "task-context"
    );

    toast.success(decision === "approved" ? "Solicitação aprovada!" : "Solicitação reprovada.");
  };

  const triggerClaim = (agentId: string) => {
    if (!isAiConfigured) {
      toast.error("Módulo de IA Inativo", {
        description: "Configure uma chave de API de IA em Configurações para habilitar a execução de agentes.",
      });
      return;
    }

    const agent = store.workspace.agents.find((a) => a.id === agentId);
    if (!agent) return;

    const unassignedTasks = tasks.filter(
      (t) =>
        t.taskType === "agent_task" &&
        !agentRuns.some((r) => r.taskId === t.id && r.status === "running")
    );

    if (unassignedTasks.length === 0) {
      toast.info(`Não há tarefas pendentes para ${agent.name}`);
      return;
    }

    const targetTask = unassignedTasks[0];
    toast.success(`${agent.name} reivindicou a tarefa: "${targetTask.title}"`);

    telemetry.track(
      "task_updated",
      `Agente ${agent.name} reivindicou a tarefa: "${targetTask.title}"`,
      { agentId, taskId: targetTask.id },
      "info",
      "task-context"
    );

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

  const updateMemberRole = (memberId: string, role: Member["role"]) => {
    if (!hasPermission("change_member_role")) {
      toast.error("Permissão insuficiente para alterar níveis de acesso.");
      return;
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role } : m))
    );
    const target = store.workspace.members.find((m) => m.id === memberId);
    if (target) {
      target.role = role;
    }
    telemetry.track(
      "member_role_updated",
      `Nível de permissão do usuário ${target?.name || memberId} atualizado para ${role}`,
      { memberId, role },
      "info",
      "task-context"
    );
    toast.success("Nível de acesso atualizado!");
  };

  const updateMemberPassword = (memberId: string, newPass: string) => {
    const isSelf = memberId === currentUser.id;
    if (!isSelf && !hasPermission("manage_members")) {
      toast.error("Permissão insuficiente para alterar senhas de outros membros.");
      return;
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, password: newPass } : m))
    );
    const target = store.workspace.members.find((m) => m.id === memberId);
    if (target) {
      target.password = newPass;
    }
    telemetry.track(
      "member_password_updated",
      `Senha do usuário ${target?.name || memberId} alterada com sucesso`,
      { memberId },
      "info",
      "task-context"
    );
    toast.success("Senha atualizada com sucesso!");
  };

  const regenerateMemberMcpToken = (memberId: string) => {
    const isSelf = memberId === currentUser.id;
    if (!isSelf && !hasPermission("manage_members")) {
      toast.error("Permissão insuficiente para regenerar tokens de outros membros.");
      return "";
    }

    const newToken = `medtask_user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, mcpToken: newToken } : m))
    );
    const target = store.workspace.members.find((m) => m.id === memberId);
    if (target) {
      target.mcpToken = newToken;
    }
    telemetry.track(
      "mcp_token_regenerated",
      `Token MCP regenerado para ${target?.name || memberId}`,
      { memberId, newToken },
      "info",
      "task-context"
    );
    toast.success("Novo token MCP gerado!");
    return newToken;
  };

  const inviteMember = async (data: {
    name: string;
    email: string;
    role: Member["role"];
    initialPassword?: string;
  }) => {
    if (!hasPermission("manage_members")) {
      toast.error("Permissão insuficiente para convidar novos membros.");
      return;
    }

    const cleanEmail = data.email.toLowerCase().trim();
    const existing = members.find((m) => m.email.toLowerCase().trim() === cleanEmail);
    if (existing) {
      toast.info(`O usuário com e-mail ${cleanEmail} já é membro do workspace.`);
      return;
    }

    const newId = `user-${Date.now()}`;
    const generatedToken =
      cleanEmail === "lucca@medhit.com.br" || cleanEmail.includes("lucca")
        ? "mh_live_lucca_sec82910"
        : `mh_sec_${data.name.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Math.random().toString(36).slice(2, 10)}`;
    const pass = cleanEmail === "lucca@medhit.com.br" ? "x32kd58" : (data.initialPassword || "");

    const newMember: Member = {
      id: newId,
      workspaceId: store.workspace.id,
      name: formatMemberName(data.name),
      email: cleanEmail,
      password: pass,
      mcpToken: generatedToken,
      role: data.role,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
      status: "active",
      lastLoginAt: new Date().toISOString(),
    };

    setMembers((prev) => [...prev, newMember]);
    store.workspace.members.push(newMember);

    // Envia convite via Resend com boas práticas e logo
    try {
      await fetch("/api/members/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: newMember.email,
          name: newMember.name,
          role: newMember.role,
          invitedBy: authenticatedUser?.name || "Equipe MedHit I&A",
        }),
      }).catch(() => null);
    } catch {
      // Falha silenciosa em dev
    }

    telemetry.track(
      "member_invited",
      `Usuário ${newMember.name} (${newMember.email}) convidado com papel ${newMember.role}`,
      { memberId: newId, email: newMember.email, role: newMember.role },
      "success",
      "task-context"
    );

    toast.success(`Convite enviado para ${newMember.email}!`);
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
        setCurrentProject,
        selectedTask,
        isNewTaskModalOpen,
        isNewBoardModalOpen,
        isNewTeamModalOpen,
        isDeleteBoardModalOpen,
        boardToDelete,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
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
        createGroup,
        updateGroup,
        deleteGroup,
        createSubtask,
        toggleTaskTimer,
        createTeam,
        updateTeam,
        deleteTeam,
        createFolder,
        deleteFolder,
        deleteTask,
        toggleChecklist,
        addComment,
        reviewApproval,
        triggerClaim,
        currentUser,
        authenticatedUser,
        isOwnerSession,
        isSimulating,
        restoreOwnerUser,
        isAuthenticated,
        hasHydrated,
        login,
        logout,
        hasPermission,
        switchActiveRole,
        switchActiveUser,
        updateMemberRole,
        updateMemberPassword,
        regenerateMemberMcpToken,
        inviteMember,
        isAiConfigured,
        aiApiKey,
        saveAiApiKey,
        removeAiApiKey,
        isTaskVisibleForCurrentUser,
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
