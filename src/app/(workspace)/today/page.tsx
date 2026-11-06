"use client";

/**
 * MedHit WorkTrack v2 - Painel de Produtividade Diária (Minhas Tarefas / Today)
 * Interface avançada no padrão Monday.com / Linear / MedHit Dark Mode & Light Mode.
 * 
 * Aperfeiçoamento cirúrgico de:
 * - Filtros temporais: Hoje, Atrasadas, Esta Semana, Concluídas e Todas
 * - Agrupamentos inteligentes: por Status, Projeto/Quadro, Prioridade e Urgência Temporal
 * - Ordenação dinâmica: Prazo, Prioridade, Título e Mais Recentes
 * - Alteração rápida de status via Monday Status Pill e Checkbox de conclusão
 * - Checklist rápido inline expansível com toggle imediato e adição de novos critérios
 * - Métricas reativas em tempo real com barra de ritmo diário (Burn-down)
 * - Responsividade completa para dispositivos móveis e estabilidade visual sob zoom 125%/150%
 * - Camadas (z-index) rigorosamente controladas para eliminar sobreposições indevidas
 * 
 * Assinado por: Equipe MedHit I&A
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useTasks } from "@/context/task-context";
import { Task, Status } from "@/server/services/data-store";
import {
  CalendarCheck2,
  AlertCircle,
  Clock,
  CalendarDays,
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Bot,
  Layers,
  ChevronRight,
  ChevronDown,
  User,
  Users,
  Lock,
  ShieldAlert,
  SlidersHorizontal,
  ArrowUpDown,
  CheckSquare,
  Square,
  Search,
  ArrowUpRight,
  Check,
  FolderKanban,
  X,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Minus,
  Sparkles,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  parseTaskDueDate,
  getStatusBadgeStyle,
  formatLocalDateToIso,
  normalizeSearchText,
} from "@/lib/task-utils";
import { toast } from "sonner";

type ActiveFilter = "today" | "overdue" | "week" | "completed" | "all";
type GroupByOption = "status" | "project" | "priority" | "due" | "none";
type SortByOption = "due_date" | "priority" | "title" | "recent";

export default function TodayTasksPage() {
  const {
    tasks,
    statuses,
    areas,
    currentProject,
    setSelectedTask,
    createTask,
    updateTask,
    toggleChecklist,
    currentUser,
    hasPermission,
    isTaskVisibleForCurrentUser,
  } = useTasks();

  const isGuest = currentUser.role === "guest";
  const canCreateTask = hasPermission("create_task");
  const canEditTask = hasPermission("edit_task");

  // Estados de Filtros e Visualização
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("today");
  const [viewScope, setViewScope] = useState<"my_tasks" | "team_tasks">("my_tasks");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<GroupByOption>("status");
  const [sortBy, setSortBy] = useState<SortByOption>("due_date");

  // Estados de Interação
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedChecklists, setExpandedChecklists] = useState<Record<string, boolean>>({});
  const [statusMenuOpenTaskId, setStatusMenuOpenTaskId] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddPriority, setQuickAddPriority] = useState<Task["priority"]>("high");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(currentProject?.id || "");
  const [inlineNewItemText, setInlineNewItemText] = useState<Record<string, string>>({});

  const statusDropdownRef = useRef<HTMLDivElement | null>(null);

  // Fecha popover de status ao clicar fora ou pressionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setStatusMenuOpenTaskId(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setStatusMenuOpenTaskId(null);
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (!statusDropdownRef.current) return;
        event.preventDefault();
        const buttons = Array.from(
          statusDropdownRef.current.querySelectorAll<HTMLButtonElement>("button[role='menuitem']")
        );
        if (buttons.length === 0) return;
        const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
        let nextIndex = 0;
        if (event.key === "ArrowDown") {
          nextIndex = currentIndex >= 0 && currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
        }
        buttons[nextIndex]?.focus();
      }
    }

    if (statusMenuOpenTaskId) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [statusMenuOpenTaskId]);

  const allProjects = useMemo(() => {
    return areas.flatMap((a) => a.projects);
  }, [areas]);

  // Mantém projeto selecionado sincronizado se inicializado vazio
  useEffect(() => {
    if (!selectedProjectId && allProjects.length > 0) {
      setSelectedProjectId(allProjects[0].id);
    }
  }, [allProjects, selectedProjectId]);

  // Data de referência diária e limites temporais normalizados
  const now = new Date();
  const todayStart = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now.toDateString()]
  );
  const todayEnd = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now.toDateString()]
  );
  const weekEnd = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now.toDateString()]
  );

  // Mapeia todas as tarefas com seus metadados de projeto, squad e status
  const enrichedTasks = useMemo(() => {
    return tasks.map((task) => {
      let taskArea = areas.find((a) => a.id === task.areaId);
      let taskProj = taskArea?.projects.find((p) => p.id === task.projectId);

      // Fallback em todas as áreas
      if (!taskProj) {
        for (const a of areas) {
          const found = a.projects.find((p) => p.id === task.projectId);
          if (found) {
            taskProj = found;
            taskArea = a;
            break;
          }
        }
      }

      const taskStatus = taskProj?.statuses.find((s) => s.id === task.statusId);
      // Status concluído estritamente ligado à categoria oficial do status
      const isDone = taskStatus?.category === "done";

      // Parsing seguro de data com normalização para meio-dia local
      const parsedDue = parseTaskDueDate(task.dueDate);

      const allChecklistItems = (task.checklists || []).flatMap((c) => c.items || []);
      const completedChecklistCount = allChecklistItems.filter((i) => i.isCompleted).length;
      const totalChecklistCount = allChecklistItems.length;

      return {
        ...task,
        assigneeIds: task.assigneeIds || [],
        checklists: task.checklists || [],
        projectName: taskProj?.name || "Projeto Geral",
        areaName: taskArea?.name || "Geral",
        projectColor: taskProj?.color || "#38bdf8",
        statusObj: taskStatus,
        availableStatuses: taskProj?.statuses || statuses,
        isDone,
        parsedDue,
        completedChecklistCount,
        totalChecklistCount,
      };
    });
  }, [tasks, areas, statuses]);

  // Contadores para o alternador de escopo (Minhas Tarefas vs Toda a Equipe)
  const myTasksCount = useMemo(() => {
    return enrichedTasks.filter((t) => {
      const isAssigned = (t.assigneeIds || []).some(
        (a) => a.id === currentUser.id || a.name.toLowerCase() === currentUser.name.toLowerCase()
      );
      const isReporter = t.reporterId === currentUser.id;
      return isAssigned || isReporter;
    }).length;
  }, [enrichedTasks, currentUser]);

  const teamTasksCount = useMemo(() => {
    return enrichedTasks.filter((t) => isTaskVisibleForCurrentUser(t)).length;
  }, [enrichedTasks, isTaskVisibleForCurrentUser]);

  // Filtra de acordo com o escopo pessoal ou da equipe com validação RBAC
  const scopedTasks = useMemo(() => {
    return enrichedTasks.filter((task) => {
      if (isGuest || viewScope === "my_tasks") {
        const isAssigned = (task.assigneeIds || []).some(
          (a) => a.id === currentUser.id || a.name.toLowerCase() === currentUser.name.toLowerCase()
        );
        const isReporter = task.reporterId === currentUser.id;
        return isAssigned || isReporter;
      }
      return isTaskVisibleForCurrentUser(task);
    });
  }, [enrichedTasks, isGuest, viewScope, currentUser, isTaskVisibleForCurrentUser]);

  // Classificação temporal de tarefas autorizadas do escopo
  const { todayList, overdueList, weekList, completedList, allScopedList } = useMemo(() => {
    const today: typeof enrichedTasks = [];
    const overdue: typeof enrichedTasks = [];
    const week: typeof enrichedTasks = [];
    const completed: typeof enrichedTasks = [];

    scopedTasks.forEach((t) => {
      if (t.isDone) {
        completed.push(t);
      }

      if (!t.parsedDue) {
        // Se não tiver prazo e estiver pendente, disponibiliza em Hoje
        if (!t.isDone) {
          today.push(t);
        }
        return;
      }

      const taskDate = t.parsedDue;

      if (taskDate < todayStart) {
        if (!t.isDone) {
          overdue.push(t);
        }
      } else if (taskDate >= todayStart && taskDate <= todayEnd) {
        today.push(t);
        week.push(t); // Tarefas de hoje são parte integrante da semana
      } else if (taskDate > todayEnd && taskDate <= weekEnd) {
        week.push(t);
      }
    });

    return {
      todayList: today,
      overdueList: overdue,
      weekList: week,
      completedList: completed,
      allScopedList: scopedTasks,
    };
  }, [scopedTasks, todayStart, todayEnd, weekEnd]);

  // Métricas em Tempo Real para o cabeçalho e Burn-down
  const todayDoneCount = todayList.filter((t) => t.isDone).length;
  const todayTotal = todayList.length;
  const progressPercent = todayTotal > 0 ? Math.round((todayDoneCount / todayTotal) * 100) : 0;

  // Filtragem de tarefas de acordo com o filtro de prazo ativo
  const filteredByTimeframe = useMemo(() => {
    switch (activeFilter) {
      case "overdue":
        return overdueList;
      case "week":
        return weekList;
      case "completed":
        return completedList;
      case "all":
        return allScopedList;
      case "today":
      default:
        return todayList;
    }
  }, [activeFilter, todayList, overdueList, weekList, completedList, allScopedList]);

  // Aplicação de filtros secundários (Quadro e Busca)
  const filteredTasks = useMemo(() => {
    return filteredByTimeframe.filter((t) => {
      if (boardFilter !== "all" && t.projectId !== boardFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = normalizeSearchText(searchQuery);
        const shortId = t.id.replace("task-", "").toLowerCase();
        const matchesTitle = normalizeSearchText(t.title).includes(query);
        const matchesDescription = normalizeSearchText(t.description).includes(query);
        const matchesId =
          t.id.toLowerCase().includes(query) ||
          ("mh-" + shortId).includes(query) ||
          ("#mh-" + shortId).includes(query);
        const matchesArea = normalizeSearchText(t.areaName).includes(query);
        const matchesProject = normalizeSearchText(t.projectName).includes(query);
        const matchesAssignee = (t.assigneeIds || []).some((a) =>
          normalizeSearchText(a.name).includes(query)
        );
        if (
          !matchesTitle &&
          !matchesDescription &&
          !matchesId &&
          !matchesArea &&
          !matchesProject &&
          !matchesAssignee
        ) {
          return false;
        }
      }
      return true;
    });
  }, [filteredByTimeframe, boardFilter, searchQuery]);

  // Ordenação das tarefas
  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];
    const priorityWeights: Record<Task["priority"], number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
      none: 0,
    };

    switch (sortBy) {
      case "priority":
        return list.sort((a, b) => (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0));
      case "title":
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case "recent":
        return list.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
        });
      case "due_date":
      default:
        return list.sort((a, b) => {
          if (!a.parsedDue && !b.parsedDue) return 0;
          if (!a.parsedDue) return 1;
          if (!b.parsedDue) return -1;
          return a.parsedDue.getTime() - b.parsedDue.getTime();
        });
    }
  }, [filteredTasks, sortBy]);

  // Agrupamento Inteligente das tarefas
  interface TaskGroup {
    id: string;
    title: string;
    color?: string;
    tasks: typeof sortedTasks;
    isDoneGroup?: boolean;
  }

  const groupedTasks = useMemo((): TaskGroup[] => {
    if (groupBy === "none") {
      return [
        {
          id: "all",
          title: "Todas as Demandas Filtradas",
          tasks: sortedTasks,
        },
      ];
    }

    if (groupBy === "status") {
      const statusMap = new Map<
        string,
        {
          title: string;
          color: string;
          category: Status["category"];
          tasks: typeof sortedTasks;
          isDone: boolean;
        }
      >();

      const categoryPriority: Record<Status["category"], number> = {
        todo: 1,
        backlog: 2,
        in_progress: 3,
        review: 4,
        done: 5,
        cancelled: 6,
      };

      // Popula com os status dos projetos filtrados ou padrão
      const relevantProjects =
        boardFilter === "all"
          ? allProjects
          : allProjects.filter((p) => p.id === boardFilter);

      relevantProjects.forEach((p) => {
        p.statuses.forEach((s) => {
          const key = s.name.trim().toLowerCase();
          if (!statusMap.has(key)) {
            statusMap.set(key, {
              title: s.name,
              color: s.color,
              category: s.category,
              tasks: [],
              isDone: s.category === "done",
            });
          }
        });
      });

      // Distribui as tarefas nos grupos
      sortedTasks.forEach((t) => {
        const key = t.statusObj?.name?.trim().toLowerCase() || (t.statusId ? t.statusId.toLowerCase() : "outros");
        if (statusMap.has(key)) {
          statusMap.get(key)!.tasks.push(t);
        } else {
          statusMap.set(key, {
            title: t.statusObj?.name || "Outros",
            color: t.statusObj?.color || "#64748b",
            category: t.statusObj?.category || "todo",
            tasks: [t],
            isDone: t.statusObj?.category === "done",
          });
        }
      });

      // Retorna apenas grupos que contêm tarefas, ordenados pela esteira de ciclo de vida (todo -> in_progress -> review -> done)
      return Array.from(statusMap.entries())
        .filter(([_, group]) => group.tasks.length > 0)
        .sort((a, b) => {
          const prioA = categoryPriority[a[1].category] ?? 99;
          const prioB = categoryPriority[b[1].category] ?? 99;
          return prioA - prioB;
        })
        .map(([key, group]) => ({
          id: `status-${key.replace(/\s+/g, "-")}`,
          title: group.title,
          color: group.color,
          tasks: group.tasks,
          isDoneGroup: group.isDone,
        }));
    }

    if (groupBy === "project") {
      const projectMap = new Map<string, { title: string; color: string; areaName: string; tasks: typeof sortedTasks }>();

      sortedTasks.forEach((t) => {
        if (!projectMap.has(t.projectId)) {
          projectMap.set(t.projectId, {
            title: t.projectName,
            color: t.projectColor,
            areaName: t.areaName,
            tasks: [],
          });
        }
        projectMap.get(t.projectId)!.tasks.push(t);
      });

      return Array.from(projectMap.entries()).map(([id, group]) => ({
        id: `proj-${id}`,
        title: `${group.areaName} / ${group.title}`,
        color: group.color,
        tasks: group.tasks,
      }));
    }

    if (groupBy === "priority") {
      const priorityOrder: Task["priority"][] = ["urgent", "high", "medium", "low", "none"];
      const priorityLabels: Record<Task["priority"], { label: string; color: string }> = {
        urgent: { label: "Urgente", color: "#f43f5e" },
        high: { label: "Alta", color: "#f59e0b" },
        medium: { label: "Média", color: "#38bdf8" },
        low: { label: "Baixa", color: "#94a3b8" },
        none: { label: "Normal / Sem Prioridade", color: "#64748b" },
      };

      return priorityOrder
        .map((p) => {
          const matchingTasks = sortedTasks.filter((t) => t.priority === p);
          return {
            id: `priority-${p}`,
            title: priorityLabels[p].label,
            color: priorityLabels[p].color,
            tasks: matchingTasks,
          };
        })
        .filter((g) => g.tasks.length > 0);
    }

    if (groupBy === "due") {
      const overdueTasks = sortedTasks.filter((t) => t.parsedDue && t.parsedDue < todayStart && !t.isDone);
      const todayTasksList = sortedTasks.filter((t) => t.parsedDue && t.parsedDue >= todayStart && t.parsedDue <= todayEnd && !t.isDone);
      const weekTasksList = sortedTasks.filter((t) => t.parsedDue && t.parsedDue > todayEnd && t.parsedDue <= weekEnd && !t.isDone);
      const futureTasksList = sortedTasks.filter((t) => t.parsedDue && t.parsedDue > weekEnd && !t.isDone);
      const noDueTasks = sortedTasks.filter((t) => !t.parsedDue && !t.isDone);
      const doneList = sortedTasks.filter((t) => t.isDone);

      const dueGroups: TaskGroup[] = [];
      if (overdueTasks.length > 0) {
        dueGroups.push({ id: "due-overdue", title: "Atrasadas / Alertas", color: "#f43f5e", tasks: overdueTasks });
      }
      if (todayTasksList.length > 0) {
        dueGroups.push({ id: "due-today", title: "Vencendo Hoje", color: "#38bdf8", tasks: todayTasksList });
      }
      if (weekTasksList.length > 0) {
        dueGroups.push({ id: "due-week", title: "Próximos Dias / Esta Semana", color: "#818cf8", tasks: weekTasksList });
      }
      if (futureTasksList.length > 0) {
        dueGroups.push({ id: "due-future", title: "Futuras / Mais de 7 Dias", color: "#a855f7", tasks: futureTasksList });
      }
      if (noDueTasks.length > 0) {
        dueGroups.push({ id: "due-nodate", title: "Sem Prazo Cadastrado", color: "#94a3b8", tasks: noDueTasks });
      }
      if (doneList.length > 0) {
        dueGroups.push({ id: "due-done", title: "Concluídas", color: "#10b981", tasks: doneList, isDoneGroup: true });
      }

      return dueGroups;
    }

    return [{ id: "default", title: "Tarefas", tasks: sortedTasks }];
  }, [groupBy, sortedTasks, boardFilter, allProjects, todayStart, todayEnd, weekEnd]);

  // Alternadores de colapso de grupos
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleChecklistExpand = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChecklists((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Toggle rápido de conclusão (marca como Done ou reabre para o primeiro status)
  const handleToggleDone = (task: typeof enrichedTasks[0], e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditTask) {
      toast.error("Permissão insuficiente para alterar o status da demanda.");
      return;
    }

    const proj = areas.flatMap((a) => a.projects).find((p) => p.id === task.projectId);
    const doneStatus =
      proj?.statuses.find((s) => s.category === "done") ||
      proj?.statuses[proj.statuses.length - 1] ||
      statuses.find((s) => s.category === "done");
    const initialStatus = proj?.statuses[0] || statuses[0];

    if (!task.isDone && doneStatus) {
      updateTask(task.id, { statusId: doneStatus.id });
      toast.success(`Demanda "${task.title}" marcada como concluída! 🎉`);
    } else if (task.isDone && initialStatus) {
      updateTask(task.id, { statusId: initialStatus.id });
      toast.info(`Demanda "${task.title}" reaberta.`);
    }
  };

  // Alteração de status rápida via Monday Status Pill
  const handleSelectStatus = (task: typeof enrichedTasks[0], newStatusId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditTask) {
      toast.error("Permissão insuficiente para alterar o status da demanda.");
      return;
    }

    updateTask(task.id, { statusId: newStatusId });
    setStatusMenuOpenTaskId(null);

    const chosenStatus = task.availableStatuses.find((s) => s.id === newStatusId);
    if (chosenStatus?.category === "done") {
      toast.success(`Demanda "${task.title}" concluída! 🎉`);
    } else {
      toast.success(`Status alterado para "${chosenStatus?.name || "Atualizado"}"`);
    }
  };

  // Adicionar novo item de critério de aceite inline na tarefa
  const handleAddInlineChecklistItem = (task: typeof enrichedTasks[0], e: React.FormEvent) => {
    e.preventDefault();
    const itemText = inlineNewItemText[task.id]?.trim();
    if (!itemText) {
      setInlineNewItemText((prev) => ({ ...prev, [task.id]: "" }));
      return;
    }

    if (!canEditTask) {
      toast.error("Permissão insuficiente para editar checklist.");
      return;
    }

    const currentChecklists = task.checklists || [];
    const baseChecklist = currentChecklists[0] || {
      id: `chk-${Date.now()}`,
      taskId: task.id,
      title: "Critérios de Aceite",
      items: [],
    };

    const newItem = {
      id: `chk-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      checklistId: baseChecklist.id,
      title: itemText,
      isCompleted: false,
    };

    const updatedChecklists =
      currentChecklists.length === 0
        ? [{ ...baseChecklist, items: [newItem] }]
        : currentChecklists.map((c, idx) => (idx === 0 ? { ...c, items: [...c.items, newItem] } : c));

    updateTask(task.id, { checklists: updatedChecklists });
    setInlineNewItemText((prev) => ({ ...prev, [task.id]: "" }));
    setExpandedChecklists((prev) => ({ ...prev, [task.id]: true }));
    toast.success("Novo critério adicionado ao checklist!");
  };

  // Valida permissão para alternar critérios de checklist (membros com edit_task ou convidados na própria demanda)
  const canCollaborateOnTask = (task: typeof enrichedTasks[0]) => {
    const isAssigned =
      (task.assigneeIds || []).some(
        (a) => a.id === currentUser.id || a.name.toLowerCase() === currentUser.name.toLowerCase()
      ) || task.reporterId === currentUser.id;
    return canEditTask || (isGuest && isAssigned);
  };

  // Criação rápida de tarefa para hoje atribuída ao usuário atual
  const handleCreateTodayTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateTask) {
      toast.error("Permissão insuficiente. Convidados não podem criar novas tarefas.");
      return;
    }
    if (!quickAddTitle.trim()) {
      toast.error("Informe o título da demanda.");
      return;
    }

    const targetProject =
      areas.flatMap((a) => a.projects).find((p) => p.id === selectedProjectId) ||
      allProjects[0] ||
      areas[0]?.projects[0];

    if (!targetProject) {
      toast.error("Nenhum quadro de projeto disponível.");
      return;
    }

    const targetArea = areas.find((a) => a.projects.some((p) => p.id === targetProject.id));
    const areaId = targetProject.areaId || targetArea?.id || areas[0]?.id || "area-1";
    const targetStatus = targetProject.statuses[0]?.id || statuses[0]?.id;
    const nowIsoDate = formatLocalDateToIso(new Date());

    createTask({
      title: quickAddTitle.trim(),
      projectId: targetProject?.id,
      areaId: areaId,
      statusId: targetStatus,
      priority: quickAddPriority,
      dueDate: nowIsoDate,
      taskType: "task",
      assigneeIds: [
        {
          type: "user",
          id: currentUser.id,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
        },
      ],
    });

    setQuickAddTitle("");
    toast.success("Nova demanda para hoje registrada na sua esteira de foco!");
  };

  // Formatação de data em português
  const formattedToday = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const renderPriorityBadge = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center gap-1 shrink-0">
            <AlertCircle className="h-3 w-3" />
            Urgente
          </span>
        );
      case "high":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1 shrink-0">
            <SignalHigh className="h-3 w-3" />
            Alta
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1 shrink-0">
            <SignalMedium className="h-3 w-3" />
            Média
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-500/30 flex items-center gap-1 shrink-0">
            <SignalLow className="h-3 w-3" />
            Baixa
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium text-slate-400 border border-slate-200 dark:border-white/10 shrink-0">
            Normal
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 relative">
      {/* Iluminação ambiente cósmica MedHit */}
      <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Top Header: Título Dinâmico, Papel e Alternador de Escopo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-sky-500/15">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-500 border border-sky-500/30">
              FOCO CIRÚRGICO DIÁRIO
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono capitalize">
              {formattedToday}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
              Perfil: {currentUser.role}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarCheck2 className="h-7 w-7 text-sky-400 shrink-0" />
            <span>Minhas Tarefas (Today's Tasks)</span>
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Painel diário de alto rendimento no padrão Monday / Linear. Gerencie suas entregas,
            atualize status e critérios em tempo real e elimine gargalos da operação médica.
          </p>
        </div>

        {/* Alternador de Escopo: Minhas Tarefas vs Toda a Equipe */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
            <button
              onClick={() => setViewScope("my_tasks")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewScope === "my_tasks"
                  ? "bg-sky-500 text-slate-950 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <User className="h-3.5 w-3.5" />
              <span>Minhas Tarefas ({myTasksCount})</span>
            </button>

            <button
              disabled={isGuest}
              onClick={() => !isGuest && setViewScope("team_tasks")}
              title={
                isGuest
                  ? "Acesso restrito: Convidados só podem ver tarefas atribuídas a si mesmos"
                  : "Ver todas as tarefas da equipe"
              }
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                isGuest && "opacity-45 cursor-not-allowed",
                !isGuest && "cursor-pointer",
                viewScope === "team_tasks" && !isGuest
                  ? "bg-sky-500 text-slate-950 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Toda a Equipe ({teamTasksCount})</span>
              {isGuest && <Lock className="h-3 w-3 text-amber-500" />}
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Aviso de Convidado (se aplicável) */}
      {isGuest && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3 text-xs text-amber-700 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
          <span>
            <strong>Acesso de Convidado (Guest):</strong> Seu usuário tem permissão para visualizar apenas
            as demandas atribuídas diretamente a você. Demandas de outros membros permanecem protegidas.
          </span>
        </div>
      )}

      {/* Cards de Métricas em Tempo Real (5 Filtros Temporais) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Hoje */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={activeFilter === "today"}
          aria-label={`Filtrar por demandas vencendo hoje: ${todayList.length} itens`}
          onClick={() => setActiveFilter("today")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveFilter("today");
            }
          }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500/40",
            activeFilter === "today"
              ? "border-sky-500/50 bg-sky-500/10 shadow-sky-500/10"
              : "border-slate-200 dark:border-sky-500/20 bg-white/70 dark:bg-[#0c1830]/70 hover:border-sky-500/40"
          )}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              Vencendo Hoje
            </span>
            <Flame className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {todayList.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {todayDoneCount} concluídas ({progressPercent}%)
          </div>
        </div>

        {/* Card 2: Atrasadas */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={activeFilter === "overdue"}
          aria-label={`Filtrar por demandas atrasadas: ${overdueList.length} itens`}
          onClick={() => setActiveFilter("overdue")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveFilter("overdue");
            }
          }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40",
            activeFilter === "overdue"
              ? "border-rose-500/50 bg-rose-500/10 shadow-rose-500/10"
              : "border-slate-200 dark:border-sky-500/20 bg-white/70 dark:bg-[#0c1830]/70 hover:border-rose-500/40"
          )}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-rose-500 dark:text-rose-400 font-bold">
              Atrasadas / Alertas
            </span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-500">
            {overdueList.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Necessitam resolução
          </div>
        </div>

        {/* Card 3: Esta Semana */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={activeFilter === "week"}
          aria-label={`Filtrar por demandas desta semana: ${weekList.length} itens`}
          onClick={() => setActiveFilter("week")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveFilter("week");
            }
          }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
            activeFilter === "week"
              ? "border-indigo-500/50 bg-indigo-500/10 shadow-indigo-500/10"
              : "border-slate-200 dark:border-sky-500/20 bg-white/70 dark:bg-[#0c1830]/70 hover:border-indigo-500/40"
          )}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              Esta Semana
            </span>
            <CalendarDays className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {weekList.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Previsão na esteira
          </div>
        </div>

        {/* Card 4: Concluídas */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={activeFilter === "completed"}
          aria-label={`Filtrar por demandas concluídas: ${completedList.length} itens`}
          onClick={() => setActiveFilter("completed")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveFilter("completed");
            }
          }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40",
            activeFilter === "completed"
              ? "border-emerald-500/50 bg-emerald-500/10 shadow-emerald-500/10"
              : "border-slate-200 dark:border-sky-500/20 bg-white/70 dark:bg-[#0c1830]/70 hover:border-emerald-500/40"
          )}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              Concluídas
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-500">
            {completedList.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Histórico finalizado
          </div>
        </div>

        {/* Card 5: Todas as Demandas */}
        <div
          role="button"
          tabIndex={0}
          aria-pressed={activeFilter === "all"}
          aria-label={`Filtrar por todas as demandas: ${allScopedList.length} itens`}
          onClick={() => setActiveFilter("all")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveFilter("all");
            }
          }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer shadow-xs col-span-2 sm:col-span-1 focus:outline-none focus:ring-2 focus:ring-sky-500/40",
            activeFilter === "all"
              ? "border-sky-500/50 bg-sky-500/10 shadow-sky-500/10"
              : "border-slate-200 dark:border-sky-500/20 bg-white/70 dark:bg-[#0c1830]/70 hover:border-sky-500/40"
          )}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              Todas Demandas
            </span>
            <Layers className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {allScopedList.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Backlog completo
          </div>
        </div>
      </div>

      {/* Barra de Ritmo de Entrega Diária (Burn-down) */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-400" />
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              Ritmo de Entrega do Dia (Burn-down)
            </span>
          </div>
          <span className="font-mono text-sky-500 dark:text-sky-400 font-bold">
            {progressPercent}% Concluído ({todayDoneCount}/{todayTotal})
          </span>
        </div>
        <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm shadow-sky-500/30"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Input Rápido: Adicionar Nova Demanda para Hoje */}
      {!canCreateTask ? (
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500 shrink-0" />
            <span>A criação de novas demandas é restrita a membros e administradores autorizados.</span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Modo Leitura</span>
        </div>
      ) : (
        <form
          onSubmit={handleCreateTodayTask}
          className="p-3 rounded-2xl border border-slate-200 dark:border-sky-500/25 bg-white/90 dark:bg-[#0c1830]/90 backdrop-blur-xl flex flex-col md:flex-row items-center gap-3 shadow-lg shadow-black/5"
        >
          <div className="flex items-center gap-2 flex-1 w-full pl-2">
            <Plus className="h-4 w-4 text-sky-400 shrink-0" />
            <input
              type="text"
              placeholder="+ Adicionar nova demanda para hoje com prazo imediato..."
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap">
            {/* Seletor de Quadro de Destino */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 text-xs font-semibold outline-none cursor-pointer max-w-[150px] truncate text-slate-800 dark:text-slate-200"
              title="Quadro de destino"
            >
              {allProjects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>

            {/* Seletor de Prioridade */}
            <select
              value={quickAddPriority}
              onChange={(e) => setQuickAddPriority(e.target.value as Task["priority"])}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 text-xs font-semibold outline-none cursor-pointer text-slate-800 dark:text-slate-200"
            >
              <option value="urgent" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Urgente</option>
              <option value="high" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Alta</option>
              <option value="medium" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Média</option>
              <option value="low" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Baixa</option>
            </select>

            <Button
              type="submit"
              size="sm"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 cursor-pointer"
            >
              Adicionar Hoje
            </Button>
          </div>
        </form>
      )}

      {/* Barra de Controles Avançados: Filtros, Agrupamento, Ordenação e Busca */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Filtros por Prazo */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter("today")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
              activeFilter === "today"
                ? "bg-sky-500 text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <CalendarCheck2 className="h-3.5 w-3.5" />
            <span>Hoje ({todayList.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter("overdue")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
              activeFilter === "overdue"
                ? "bg-rose-500 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Atrasadas ({overdueList.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter("week")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
              activeFilter === "week"
                ? "bg-sky-500 text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Esta Semana ({weekList.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter("completed")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
              activeFilter === "completed"
                ? "bg-emerald-500 text-slate-950 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Concluídas ({completedList.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
              activeFilter === "all"
                ? "bg-sky-500 text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Todas ({allScopedList.length})</span>
          </button>
        </div>

        {/* Agrupamento, Ordenação, Quadro e Busca */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Busca Textual */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 flex-1 sm:flex-none">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-900 dark:text-white outline-none w-24 sm:w-32 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Agrupar por */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Agrupar:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="status" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Status</option>
              <option value="project" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Quadro / Projeto</option>
              <option value="priority" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Prioridade</option>
              <option value="due" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Prazo / Urgência</option>
              <option value="none" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Sem Agrupamento</option>
            </select>
          </div>

          {/* Ordenar por */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortByOption)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="due_date" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Prazo</option>
              <option value="priority" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Prioridade</option>
              <option value="title" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Título</option>
              <option value="recent" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Recentes</option>
            </select>
          </div>

          {/* Filtro por Quadro Específico */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
            <FolderKanban className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <select
              value={boardFilter}
              onChange={(e) => setBoardFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer max-w-[120px] truncate"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Todos os Quadros</option>
              {allProjects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Tarefas Agrupadas no Padrão Monday / Linear */}
      <div className="space-y-4">
        {groupedTasks.map((group) => {
          const isCollapsed = collapsedGroups[group.id] || false;
          const groupDoneCount = group.tasks.filter((t) => t.isDone).length;
          const groupTotal = group.tasks.length;
          const groupPercent = groupTotal > 0 ? Math.round((groupDoneCount / groupTotal) * 100) : 0;

          return (
            <div
              key={group.id}
              className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl shadow-lg transition-all"
            >
              {/* Cabeçalho do Grupo Monday Style */}
              <div
                role="button"
                tabIndex={0}
                aria-expanded={!isCollapsed}
                aria-label={isCollapsed ? `Expandir grupo ${group.title}` : `Recolher grupo ${group.title}`}
                onClick={() => toggleGroupCollapse(group.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleGroupCollapse(group.id);
                  }
                }}
                className={cn(
                  "px-4 py-3 bg-slate-50/90 dark:bg-slate-900/60 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-100/80 dark:hover:bg-slate-900/90 transition-colors rounded-t-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/40",
                  isCollapsed ? "rounded-b-2xl border-b-0" : "border-b border-slate-200/80 dark:border-white/10"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-transform">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>

                  {group.color && (
                    <span
                      className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: group.color }}
                    />
                  )}

                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {group.title}
                  </h2>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    {groupTotal} {groupTotal === 1 ? "demanda" : "demandas"}
                  </span>
                </div>

                {/* Barra de Progresso do Grupo */}
                {groupTotal > 0 && (
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                      {groupDoneCount}/{groupTotal} concluídas ({groupPercent}%)
                    </span>
                    <div className="h-2 w-16 sm:w-24 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${groupPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Corpo de Tarefas do Grupo */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {group.tasks.map((task) => {
                    const taskIdShort = task.id.replace("task-", "");
                    const isChecklistOpen = expandedChecklists[task.id] || false;
                    const isStatusMenuOpen = statusMenuOpenTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "transition-colors",
                          task.isDone && "bg-slate-50/50 dark:bg-slate-950/20",
                          isStatusMenuOpen && "relative z-30"
                        )}
                      >
                        {/* Linha Principal da Tarefa */}
                        <div
                          onClick={() => setSelectedTask(task)}
                          className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-sky-500/5 cursor-pointer group"
                        >
                          {/* Lado Esquerdo: Checkbox + ID + Título + Tags */}
                          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                            {/* Checkbox de Conclusão Rápida */}
                            <button
                              disabled={!canEditTask}
                              onClick={(e) => canEditTask && handleToggleDone(task, e)}
                              aria-label={
                                task.isDone
                                  ? `Marcar demanda "${task.title}" como pendente`
                                  : `Marcar demanda "${task.title}" como concluída`
                              }
                              className={cn(
                                "p-1.5 sm:p-1 text-slate-400 transition-colors shrink-0 mt-0.5 sm:mt-0 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/40",
                                canEditTask ? "hover:text-emerald-500 cursor-pointer" : "opacity-45 cursor-not-allowed"
                              )}
                              title={
                                !canEditTask
                                  ? "Permissão insuficiente para alterar o status"
                                  : task.isDone
                                  ? "Marcar como pendente"
                                  : "Marcar como concluída"
                              }
                            >
                              {task.isDone ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-slate-400 group-hover:text-sky-400" />
                              )}
                            </button>

                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 font-semibold shrink-0">
                                  #MH-{taskIdShort}
                                </span>

                                <h3
                                  className={cn(
                                    "text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors truncate",
                                    task.isDone && "line-through text-slate-400 dark:text-slate-500 font-normal"
                                  )}
                                >
                                  {task.title}
                                </h3>

                                {task.taskType === "agent_task" && (
                                  <span className="flex items-center gap-1 font-mono text-[9px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded shrink-0">
                                    <Bot className="h-2.5 w-2.5" />
                                    IA
                                  </span>
                                )}
                              </div>

                              {/* Localização da Tarefa: Área / Projeto */}
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: task.projectColor }}
                                />
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {task.areaName}
                                </span>
                                <span className="text-slate-400">/</span>
                                <span className="truncate">{task.projectName}</span>
                              </div>
                            </div>
                          </div>

                          {/* Lado Direito: Checklist Toggle + Status Pill + Prioridade + Prazo + Responsáveis */}
                          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-between md:justify-end shrink-0 pl-8 md:pl-0">
                            {/* Checklist Badge Expansível */}
                            {task.totalChecklistCount > 0 ? (
                              <button
                                onClick={(e) => toggleChecklistExpand(task.id, e)}
                                className={cn(
                                  "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all border cursor-pointer",
                                  task.completedChecklistCount === task.totalChecklistCount
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-sky-500/40"
                                )}
                                title="Expandir lista de critérios de aceite"
                              >
                                <CheckSquare className="h-3 w-3" />
                                <span>
                                  {task.completedChecklistCount}/{task.totalChecklistCount}
                                </span>
                                {isChecklistOpen ? (
                                  <ChevronDown className="h-3 w-3 ml-0.5" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 ml-0.5" />
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={(e) => toggleChecklistExpand(task.id, e)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 transition-colors border border-dashed border-slate-200 dark:border-white/10 cursor-pointer"
                                title="Adicionar critérios de aceite"
                              >
                                <Plus className="h-3 w-3" />
                                <span className="hidden sm:inline">Critérios</span>
                              </button>
                            )}

                            {/* Status Pill (Monday.com Style com Dropdown Interativo) */}
                            <div className="relative" ref={isStatusMenuOpen ? statusDropdownRef : undefined}>
                              <button
                                disabled={!canEditTask}
                                aria-haspopup="menu"
                                aria-expanded={isStatusMenuOpen}
                                aria-label={`Status atual: ${task.statusObj?.name || "Status"}. Clique para alterar.`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (canEditTask) {
                                    setStatusMenuOpenTaskId(isStatusMenuOpen ? null : task.id);
                                  }
                                }}
                                className={cn(
                                  "px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0 focus:outline-none focus:ring-2 focus:ring-sky-500/40",
                                  canEditTask ? "cursor-pointer hover:opacity-90 active:scale-95" : "cursor-default"
                                )}
                                style={getStatusBadgeStyle(task.statusObj?.color)}
                                title="Clique para alterar status rapidamente"
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: task.statusObj?.color || "#38bdf8" }}
                                />
                                <span>{task.statusObj?.name || "Status"}</span>
                                {canEditTask && <ChevronDown className="h-3 w-3 opacity-60" />}
                              </button>

                              {/* Dropdown Flutuante de Status (z-30 seguro) */}
                              {isStatusMenuOpen && (
                                <div
                                  role="menu"
                                  aria-label="Alterar Status"
                                  className="absolute right-0 top-full mt-1.5 w-44 max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-[#0b1528] border border-slate-200 dark:border-sky-500/30 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 z-30 select-none space-y-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                                    Alterar Status
                                  </div>
                                  {task.availableStatuses.map((st) => (
                                    <button
                                      key={st.id}
                                      role="menuitem"
                                      onClick={(e) => handleSelectStatus(task, st.id, e)}
                                      className={cn(
                                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left focus:outline-none focus:bg-sky-500/20",
                                        task.statusId === st.id
                                          ? "bg-sky-500/15 text-sky-500 dark:text-sky-400"
                                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                      )}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <span
                                          className="h-2 w-2 rounded-full shrink-0"
                                          style={{ backgroundColor: st.color }}
                                        />
                                        <span className="truncate">{st.name}</span>
                                      </div>
                                      {task.statusId === st.id && (
                                        <Check className="h-3 w-3 text-sky-400 shrink-0" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Badge de Prioridade */}
                            {renderPriorityBadge(task.priority)}

                            {/* Indicador de Prazo */}
                            {task.dueDate && (
                              <div
                                className={cn(
                                  "flex items-center gap-1 font-mono text-[10px] shrink-0 px-2 py-0.5 rounded-md border",
                                  task.parsedDue && task.parsedDue < todayStart && !task.isDone
                                    ? "text-rose-500 bg-rose-500/10 border-rose-500/25"
                                    : task.parsedDue && task.parsedDue >= todayStart && task.parsedDue <= todayEnd
                                    ? "text-sky-500 dark:text-sky-400 bg-sky-500/10 border-sky-500/25"
                                    : "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10"
                                )}
                              >
                                <Clock className="h-3 w-3" />
                                <span>
                                  {task.parsedDue
                                    ? task.parsedDue.toLocaleDateString("pt-BR", {
                                        day: "2-digit",
                                        month: "short",
                                      })
                                    : task.dueDate}
                                </span>
                              </div>
                            )}

                            {/* Avatares dos Responsáveis */}
                            <div className="flex items-center -space-x-1.5 shrink-0">
                              {task.assigneeIds.map((ass) => (
                                <img
                                  key={ass.id}
                                  src={ass.avatarUrl}
                                  alt={ass.name}
                                  title={ass.name}
                                  className="h-6 w-6 rounded-full border border-white dark:border-slate-900 object-cover shadow-xs"
                                />
                              ))}
                            </div>

                            {/* Botão de Ação / Detalhes */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                              }}
                              aria-label={`Abrir painel de inspeção da demanda "${task.title}"`}
                              className="p-1 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500/40"
                              title="Abrir painel de inspeção completo"
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Acordeão de Checklist Inline Expansível */}
                        {isChecklistOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="px-6 py-3 bg-slate-50/80 dark:bg-slate-950/40 border-t border-slate-100 dark:border-white/5 space-y-2 animate-in fade-in"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <CheckSquare className="h-3.5 w-3.5 text-sky-400" />
                                <span>Critérios de Aceite & Validação ({task.completedChecklistCount}/{task.totalChecklistCount})</span>
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Clique para marcar ou adicione novos critérios abaixo
                              </span>
                            </div>

                            {/* Itens do Checklist */}
                            <div className="space-y-1">
                              {task.checklists.flatMap((c) =>
                                c.items.map((item) => (
                                  <div
                                    key={item.id}
                                    onClick={() => canCollaborateOnTask(task) && toggleChecklist(task.id, c.id, item.id)}
                                    className={cn(
                                      "flex items-center gap-2 p-1.5 rounded-lg text-xs transition-colors select-none",
                                      canCollaborateOnTask(task) ? "hover:bg-white/60 dark:hover:bg-white/5 cursor-pointer" : "cursor-default"
                                    )}
                                  >
                                    <button
                                      disabled={!canCollaborateOnTask(task)}
                                      aria-label={
                                        item.isCompleted
                                          ? `Desmarcar critério "${item.title}"`
                                          : `Marcar critério "${item.title}" como concluído`
                                      }
                                      className={cn(
                                        "shrink-0 focus:outline-none focus:ring-1 focus:ring-sky-500/40 rounded",
                                        item.isCompleted ? "text-emerald-500" : "text-slate-400"
                                      )}
                                    >
                                      {item.isCompleted ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                      ) : (
                                        <Square className="h-4 w-4" />
                                      )}
                                    </button>

                                    <span
                                      className={cn(
                                        "text-xs transition-colors flex-1",
                                        item.isCompleted
                                          ? "line-through text-slate-400 dark:text-slate-500 font-normal"
                                          : "text-slate-800 dark:text-slate-200 font-medium"
                                      )}
                                    >
                                      {item.title}
                                    </span>
                                  </div>
                                ))
                              )}

                              {task.totalChecklistCount === 0 && (
                                <p className="text-xs text-slate-400 italic py-1">
                                  Nenhum critério adicionado ainda. Insira o primeiro critério abaixo:
                                </p>
                              )}
                            </div>

                            {/* Mini Formulário de Inserção de Novo Critério */}
                            {canEditTask && (
                              <form
                                onSubmit={(e) => handleAddInlineChecklistItem(task, e)}
                                className="flex items-center gap-2 pt-1"
                              >
                                <input
                                  type="text"
                                  placeholder="+ Novo critério de aceite (pressione Enter)..."
                                  value={inlineNewItemText[task.id] || ""}
                                  onChange={(e) =>
                                    setInlineNewItemText((prev) => ({
                                      ...prev,
                                      [task.id]: e.target.value,
                                    }))
                                  }
                                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs outline-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500/40"
                                />
                                <Button
                                  type="submit"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                                >
                                  Adicionar
                                </Button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Estado Vazio (Nenhuma Demanda Encontrada) */}
        {groupedTasks.length === 0 && (
          <div className="py-14 px-6 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 dark:border-sky-500/20 bg-white/40 dark:bg-[#0c1830]/40 backdrop-blur-xl">
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Nenhuma demanda encontrada neste filtro!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                Todas as tarefas deste critério foram concluídas ou você não possui demandas pendentes
                com esses parâmetros. Excelente trabalho!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Assinatura Corporativa MedHit */}
      <div className="pt-4 text-center">
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600">
          Medhit WorkTrack • Assinado por: Equipe MedHit I&A
        </span>
      </div>
    </div>
  );
}
