"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTasks } from "@/context/task-context";
import { Task } from "@/server/services/data-store";
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
  Tag,
  ArrowRight,
  Filter,
  Sparkles,
  Layers,
  ChevronRight,
  User,
  Users,
  Lock,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EducationalTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Tela de Produtividade Diária: Tarefas para Hoje (Today's Tasks)
 * Desenvolvido pela equipe MedHit Integrações & Automações
 */
export default function TodayTasksPage() {
  const {
    tasks,
    statuses,
    areas,
    currentProject,
    setSelectedTask,
    createTask,
    updateTask,
    currentUser,
    hasPermission,
    isTaskVisibleForCurrentUser,
  } = useTasks();

  const isGuest = currentUser.role === "guest";
  const canCreateTask = hasPermission("create_task");
  const canEditTask = hasPermission("edit_task");

  const [activeFilter, setActiveFilter] = useState<"today" | "overdue" | "next7days" | "all">("today");
  const [viewScope, setViewScope] = useState<"my_tasks" | "team_tasks">("my_tasks");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState<Task["priority"]>("high");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(currentProject?.id || "");

  const allProjects = useMemo(() => {
    return areas.flatMap((a) => a.projects);
  }, [areas]);

  // Data de referência: hoje à meia-noite
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const next7DaysEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59);

  // Mapeia todas as tarefas com seus metadados de projeto e squad
  const enrichedTasks = useMemo(() => {
    return tasks.map((task) => {
      let taskArea = areas.find((a) => a.id === task.areaId);
      let taskProj = taskArea?.projects.find((p) => p.id === task.projectId);

      // Fallback procurando em todas as áreas
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
      const isDone =
        taskStatus?.category === "done" ||
        (task.checklists.length > 0 &&
          task.checklists.every((c) => c.items.every((i) => i.isCompleted)));

      // Normaliza due date
      let parsedDue: Date | null = null;
      if (task.dueDate) {
        parsedDue = new Date(task.dueDate);
      }

      return {
        ...task,
        projectName: taskProj?.name || "Projeto Geral",
        areaName: taskArea?.name || "Geral",
        projectColor: taskProj?.color || "#38bdf8",
        statusObj: taskStatus,
        isDone,
        parsedDue,
      };
    });
  }, [tasks, areas]);

  // Contadores para o alternador de escopo (Minhas Tarefas vs Equipe)
  const myTasksCount = useMemo(() => {
    return enrichedTasks.filter((t) => {
      const isAssigned = t.assigneeIds.some(
        (a) => a.id === currentUser.id || a.name.toLowerCase() === currentUser.name.toLowerCase()
      );
      const isReporter = t.reporterId === currentUser.id;
      return isAssigned || isReporter;
    }).length;
  }, [enrichedTasks, currentUser]);

  const teamTasksCount = useMemo(() => {
    return enrichedTasks.filter((t) => isTaskVisibleForCurrentUser(t)).length;
  }, [enrichedTasks, isTaskVisibleForCurrentUser]);

  // Filtra as tarefas de acordo com o escopo pessoal ou da equipe com validação RBAC
  const scopedTasks = useMemo(() => {
    return enrichedTasks.filter((task) => {
      // Convidados NUNCA veem tarefas que não lhes pertencem
      if (isGuest || viewScope === "my_tasks") {
        const isAssigned = task.assigneeIds.some(
          (a) => a.id === currentUser.id || a.name.toLowerCase() === currentUser.name.toLowerCase()
        );
        const isReporter = task.reporterId === currentUser.id;
        return isAssigned || isReporter;
      }
      return isTaskVisibleForCurrentUser(task);
    });
  }, [enrichedTasks, isGuest, viewScope, currentUser, isTaskVisibleForCurrentUser]);

  // Classificação por data a partir das tarefas autorizadas do escopo
  const { todayList, overdueList, next7DaysList, allActiveList } = useMemo(() => {
    const today: typeof enrichedTasks = [];
    const overdue: typeof enrichedTasks = [];
    const next7: typeof enrichedTasks = [];
    const allActive: typeof enrichedTasks = [];

    scopedTasks.forEach((t) => {
      if (!t.isDone) {
        allActive.push(t);
      }

      if (!t.parsedDue) {
        // Se não tiver prazo, consideramos disponível para hoje se não estiver feita
        if (!t.isDone) today.push(t);
        return;
      }

      const taskDate = t.parsedDue;

      if (taskDate < todayStart) {
        // Vencida no passado
        if (!t.isDone) {
          overdue.push(t);
        }
      } else if (taskDate >= todayStart && taskDate <= todayEnd) {
        // Vencendo hoje
        today.push(t);
      } else if (taskDate > todayEnd && taskDate <= next7DaysEnd) {
        // Próximos 7 dias
        next7.push(t);
      }
    });

    return {
      todayList: today,
      overdueList: overdue,
      next7DaysList: next7,
      allActiveList: allActive,
    };
  }, [scopedTasks, todayStart, todayEnd, next7DaysEnd]);

  // Lista selecionada de acordo com o filtro ativo
  const displayedTasks = useMemo(() => {
    let list: typeof todayList;
    switch (activeFilter) {
      case "overdue":
        list = overdueList;
        break;
      case "next7days":
        list = next7DaysList;
        break;
      case "all":
        list = allActiveList;
        break;
      case "today":
      default:
        list = todayList;
        break;
    }

    if (boardFilter !== "all") {
      return list.filter((t) => t.projectId === boardFilter);
    }

    return list;
  }, [activeFilter, boardFilter, todayList, overdueList, next7DaysList, allActiveList]);

  // Métricas do Dia
  const todayDoneCount = todayList.filter((t) => t.isDone).length;
  const todayTotal = todayList.length;
  const progressPercent = todayTotal > 0 ? Math.round((todayDoneCount / todayTotal) * 100) : 100;

  // Toggle de conclusão rápida
  const handleToggleDone = (task: typeof enrichedTasks[0], e: React.MouseEvent) => {
    e.stopPropagation();

    // Localiza o status 'done' ou o primeiro status do projeto
    const proj = areas.flatMap((a) => a.projects).find((p) => p.id === task.projectId);
    const doneStatus = proj?.statuses.find((s) => s.category === "done") || proj?.statuses[proj.statuses.length - 1];
    const initialStatus = proj?.statuses[0];

    if (!task.isDone && doneStatus) {
      updateTask(task.id, { statusId: doneStatus.id });
      toast.success(`Tarefa "${task.title}" concluída com sucesso! 🎉`);
    } else if (task.isDone && initialStatus) {
      updateTask(task.id, { statusId: initialStatus.id });
      toast.info(`Tarefa "${task.title}" reaberta.`);
    }
  };

  // Criação de tarefa rápida para hoje
  const handleCreateTodayTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateTask) {
      toast.error("Permissão insuficiente. Convidados não podem criar novas tarefas.");
      return;
    }
    if (!quickTitle.trim()) {
      toast.error("Informe o título da demanda.");
      return;
    }

    const targetProject =
      areas.flatMap((a) => a.projects).find((p) => p.id === selectedProjectId) ||
      areas[0]?.projects[0];

    const targetStatus = targetProject?.statuses[0]?.id || statuses[0]?.id;

    createTask({
      title: quickTitle.trim(),
      projectId: targetProject?.id,
      areaId: targetProject?.areaId,
      statusId: targetStatus,
      priority: quickPriority,
      dueDate: new Date().toISOString(),
      taskType: "task",
    });

    setQuickTitle("");
    toast.success("Nova tarefa para hoje adicionada com foco imediato!");
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
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center gap-1">
            <AlertCircle className="h-2.5 w-2.5" />
            Urgente
          </span>
        );
      case "high":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            Alta
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            Média
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            Baixa
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium text-slate-400">
            Normal
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto p-6 md:p-8 space-y-6 relative select-none">
      {/* Luz ambiente cósmica */}
      <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Header com Data Dinâmica e Alternador de Escopo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-sky-500/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-500 border border-sky-500/30">
              FOCO CIRÚRGICO
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono capitalize">
              {formattedToday}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
              Papel: {currentUser.role}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarCheck2 className="h-6 w-6 text-sky-400" />
            <span>Tarefas para Hoje (Today's Tasks)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Painel diário de alto rendimento. Priorize suas entregas mais impactantes e elimine gargalos da operação.
          </p>
        </div>

        {/* Alternador de Escopo: Minhas Tarefas vs Toda a Equipe */}
        <div className="flex items-center gap-2">
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
            <strong>Acesso de Convidado (Guest):</strong> Seu usuário tem permissão para visualizar apenas as tarefas atribuídas diretamente a você. Demandas de outros membros permanecem ocultas.
          </span>
        </div>
      )}

      {/* Métricas e Barra de Ritmo de Entrega */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card Hoje */}
        <div
          onClick={() => setActiveFilter("today")}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer shadow-xs",
            activeFilter === "today"
              ? "border-sky-500/50 bg-sky-500/10 shadow-sky-500/10"
              : "border-slate-200 dark:border-sky-500/20 bg-white/70 dark:bg-[#0c1830]/70 hover:border-sky-500/40"
          )}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
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

        {/* Card Atrasadas */}
        <div
          onClick={() => setActiveFilter("overdue")}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer shadow-xs",
            activeFilter === "overdue"
              ? "border-rose-500/50 bg-rose-500/10 shadow-rose-500/10"
              : "border-slate-200 dark:border-sky-500/20 bg-white/70 dark:bg-[#0c1830]/70 hover:border-rose-500/40"
          )}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-rose-400 font-bold">
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

        {/* Card Próximos 7 Dias */}
        <div
          onClick={() => setActiveFilter("next7days")}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer shadow-xs",
            activeFilter === "next7days"
              ? "border-indigo-500/50 bg-indigo-500/10 shadow-indigo-500/10"
              : "border-slate-200 dark:border-sky-500/20 bg-white/70 dark:bg-[#0c1830]/70 hover:border-indigo-500/40"
          )}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              Próximos 7 Dias
            </span>
            <CalendarDays className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {next7DaysList.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Previsão na esteira
          </div>
        </div>

        {/* Card Todas as Ativas */}
        <div
          onClick={() => setActiveFilter("all")}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer shadow-xs",
            activeFilter === "all"
              ? "border-emerald-500/50 bg-emerald-500/10 shadow-emerald-500/10"
              : "border-slate-200 dark:border-sky-500/20 bg-white/70 dark:bg-[#0c1830]/70 hover:border-emerald-500/40"
          )}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              Todas Ativas
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {allActiveList.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Backlog em andamento
          </div>
        </div>
      </div>

      {/* Barra de Progresso do Foco Diário */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-400" />
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              Ritmo de Entrega Diária (Burn-down)
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

      {/* Input Rápido: Adicionar Tarefa para Hoje */}
      {!canCreateTask ? (
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500 shrink-0" />
            <span>A criação de novas tarefas para hoje é permitida apenas para Membros da equipe e Administradores.</span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Apenas Leitura</span>
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
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <select
              value={quickPriority}
              onChange={(e) => setQuickPriority(e.target.value as Task["priority"])}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
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

      {/* Barra de Filtros Rápidos */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0c1830] p-1 rounded-xl border border-slate-200 dark:border-sky-500/20">
          <button
            onClick={() => setActiveFilter("today")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              activeFilter === "today"
                ? "bg-sky-500 text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <CalendarCheck2 className="h-3.5 w-3.5" />
            <span>Vencendo Hoje ({todayList.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter("overdue")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              activeFilter === "overdue"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Atrasadas ({overdueList.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter("next7days")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              activeFilter === "next7days"
                ? "bg-sky-500 text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Próximos 7 Dias ({next7DaysList.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              activeFilter === "all"
                ? "bg-sky-500 text-slate-950 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <span>Todas Ativas ({allActiveList.length})</span>
          </button>
        </div>

        {/* Filtro por Quadro / Projeto específico ou Todos os Quadros */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0c1830] px-2.5 py-1 rounded-xl border border-slate-200 dark:border-sky-500/20 text-xs text-slate-700 dark:text-slate-300">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-mono text-slate-400">Quadro:</span>
            <select
              value={boardFilter}
              onChange={(e) => setBoardFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer pr-1"
            >
              <option value="all">Todos os Quadros</option>
              {allProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400 font-mono hidden sm:inline">
            Exibindo {displayedTasks.length} demandas
          </div>
        </div>
      </div>

      {/* Lista de Tarefas do Dia */}
      <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl shadow-lg overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.05]">
        {displayedTasks.map((task) => {
          const taskIdShort = task.id.replace("task-", "");

          return (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={cn(
                "p-4 flex items-center justify-between gap-4 hover:bg-sky-500/5 transition-colors cursor-pointer group",
                task.isDone && "opacity-60 bg-slate-50/50 dark:bg-slate-950/20"
              )}
            >
              {/* Lado Esquerdo: Checkbox + Título + Squad/Board */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {/* Checkbox de Conclusão Rápida */}
                <button
                  disabled={!canEditTask}
                  onClick={(e) => canEditTask && handleToggleDone(task, e)}
                  className={cn(
                    "p-1 text-slate-400 transition-colors shrink-0",
                    canEditTask ? "hover:text-emerald-500 cursor-pointer" : "opacity-45 cursor-not-allowed"
                  )}
                  title={
                    !canEditTask
                      ? "Apenas membros e administradores podem alterar o status da tarefa diretamente"
                      : task.isDone
                      ? "Marcar como não concluída"
                      : "Concluir tarefa"
                  }
                >
                  {task.isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400 group-hover:text-sky-400" />
                  )}
                </button>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                      #MH-{taskIdShort}
                    </span>

                    <h3
                      className={cn(
                        "text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-400 transition-colors",
                        task.isDone && "line-through text-slate-400 dark:text-slate-500"
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

                  {/* Localização da Tarefa (Squad e Projeto) */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: task.projectColor }}
                    />
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {task.areaName}
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className="truncate">{task.projectName}</span>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Prioridade + Prazo + Avatares */}
              <div className="flex items-center gap-3 shrink-0">
                {renderPriorityBadge(task.priority)}

                {/* Prazo */}
                {task.dueDate && (
                  <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(task.dueDate).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                )}

                {/* Avatares */}
                <div className="flex items-center -space-x-1.5">
                  {task.assigneeIds.map((ass) => (
                    <img
                      key={ass.id}
                      src={ass.avatarUrl}
                      alt={ass.name}
                      title={ass.name}
                      className="h-6 w-6 rounded-full border border-white dark:border-slate-900 object-cover"
                    />
                  ))}
                </div>

                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          );
        })}

        {displayedTasks.length === 0 && (
          <div className="py-12 px-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Nenhuma demanda neste filtro!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                Todas as tarefas deste critério foram concluídas ou não há prazos cadastrados. Bom trabalho!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Assinatura MedHit */}
      <div className="pt-4 text-center">
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600">
          MedHit Tasks by Integrações & Automações
        </span>
      </div>
    </div>
  );
}
