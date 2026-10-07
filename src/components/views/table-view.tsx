/**
 * MedHit Integrações & Automações
 * Visão em Lista do MedHit Tasks (Padrão ClickUp / Monday.com)
 *
 * Arquitetura de Layout:
 * - Grade CSS estrita (--list-cols): 32px | minmax(280px, 1fr) | 140px | 160px | 130px | 130px | 72px
 * - Cabeçalho global sticky com alinhamento pixel a pixel
 * - Grupos colapsáveis por status com altura compacta (~72px para vazios)
 * - Exatamente UM ponto de criação rápida inline por grupo (com atalho Enter contínuo e Esc)
 * - Atalho global 'N' para acionar o primeiro grupo
 * - Ações, Prioridade e Status com Popovers portáveis
 * - Rodapé padrão: MedHit Tasks by Integrações & Automações
 */

"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Task, Status } from "@/server/services/data-store";
import { useTasks } from "@/context/task-context";
import {
  CheckCircle2,
  Circle,
  Plus,
  AlertCircle,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Minus,
  Check,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Trash2,
  Edit2,
  Search,
  Calendar,
  Eye,
  Copy,
  MoreHorizontal,
  FolderOpen,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as Popover from "@radix-ui/react-popover";

interface TableViewProps {
  statuses: Status[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  projectId?: string;
  areaId?: string;
}

const LIST_GRID_TEMPLATE = "32px minmax(280px, 1fr) 140px 160px 130px 130px 72px";

const PRIORITY_CONFIG: Record<
  Task["priority"],
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  urgent: { label: "Urgente", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: AlertCircle },
  high: { label: "Alta", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: SignalHigh },
  medium: { label: "Normal", color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20", icon: SignalMedium },
  low: { label: "Baixa", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: SignalLow },
  none: { label: "Sem prioridade", color: "text-slate-400", bg: "bg-slate-500/5", border: "border-transparent", icon: Minus },
};

const ALL_PRIORITIES: Task["priority"][] = ["urgent", "high", "medium", "low", "none"];

export function TableView({ statuses, tasks, onTaskClick, projectId, areaId }: TableViewProps) {
  const {
    moveTask,
    updateTask,
    createTask,
    deleteTask,
    members,
    currentProject,
    hasPermission,
    setIsNewTaskModalOpen,
  } = useTasks();

  const canEdit = hasPermission("edit_task");
  const canCreate = hasPermission("create_task");
  const canDelete = hasPermission("delete_task");

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>("all");

  // Grupos colapsados (armazenados em estado e persistidos via localStorage se disponível)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("medhit_list_collapsed_v1");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao carregar estado dos grupos:", e);
      }
    }
    // Concluído colapsado por padrão se tiver tarefas
    const doneSt = statuses.find((s) => s.category === "done");
    return doneSt ? { [doneSt.id]: true } : {};
  });

  const toggleGroupCollapse = (statusId: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [statusId]: !prev[statusId] };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("medhit_list_collapsed_v1", JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    statuses.forEach((s) => (next[s.id] = false));
    setCollapsedGroups(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("medhit_list_collapsed_v1", JSON.stringify(next));
    }
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    statuses.forEach((s) => (next[s.id] = true));
    setCollapsedGroups(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("medhit_list_collapsed_v1", JSON.stringify(next));
    }
  };

  // Edição inline de título
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  // Criação rápida inline ativa por statusId
  const [activeInlineStatusId, setActiveInlineStatusId] = useState<string | null>(null);
  const [inlineTitle, setInlineTitle] = useState("");
  const inlineInputRef = useRef<HTMLInputElement | null>(null);

  // Status de conclusão e inicial
  const doneStatus = statuses.find((s) => s.category === "done") || statuses[statuses.length - 1];
  const initialStatus = statuses[0] || doneStatus;

  // Foco no input de criação inline quando aberto
  useEffect(() => {
    if (activeInlineStatusId && inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  }, [activeInlineStatusId]);

  // Atalho global 'N' para abrir a criação rápida no primeiro grupo aberto
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "n" || e.key === "N") {
        if (!canCreate) return;
        e.preventDefault();
        const firstExpanded = statuses.find((s) => !collapsedGroups[s.id]) || statuses[0];
        if (firstExpanded) {
          setCollapsedGroups((prev) => ({ ...prev, [firstExpanded.id]: false }));
          setActiveInlineStatusId(firstExpanded.id);
          setInlineTitle("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [statuses, collapsedGroups, canCreate]);

  // Filtragem das tarefas
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery.trim()) {
        const matchesQuery = task.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
        if (!matchesQuery) return false;
      }
      if (filterPriority !== "all" && task.priority !== filterPriority) {
        return false;
      }
      if (filterAssigneeId !== "all") {
        const hasAssignee = task.assigneeIds.some((a) => a.id === filterAssigneeId);
        if (!hasAssignee) return false;
      }
      return true;
    });
  }, [tasks, searchQuery, filterPriority, filterAssigneeId]);

  // Métricas
  const totalTasksCount = tasks.length;
  const doneTasksCount = tasks.filter((t) => {
    const s = statuses.find((st) => st.id === t.statusId);
    return s?.category === "done";
  }).length;
  const percentDone = totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0;

  // Alternar checkbox de conclusão
  const handleToggleTaskDone = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!canEdit) {
      toast.error("Permissão insuficiente para alterar tarefas.");
      return;
    }
    const currentStatus = statuses.find((s) => s.id === task.statusId);
    const isDone = currentStatus?.category === "done";
    if (isDone) {
      moveTask(task.id, initialStatus.id);
      toast.info(`Tarefa reaberta para "${initialStatus.name}"`);
    } else {
      moveTask(task.id, doneStatus.id);
      toast.success("Tarefa concluída!");
    }
  };

  // Submissão da criação inline contínua
  const handleInlineSubmit = (statusId: string) => {
    const clean = inlineTitle.trim();
    if (!clean) {
      setActiveInlineStatusId(null);
      return;
    }

    createTask({
      title: clean,
      statusId,
      projectId: projectId || currentProject?.id || "",
      areaId: areaId || currentProject?.areaId || "",
      priority: "medium",
      taskType: "task",
      assigneeIds: [],
    });

    toast.success("Tarefa adicionada!");
    setInlineTitle("");
    // Mantém o input aberto e focado para cadastrar a próxima
    if (inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  };

  // Formatação curta de prazos
  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);
      const d = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isOverdue = d < today;
      const isToday = d.getTime() === today.getTime();

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = d.getTime() === tomorrow.getTime();

      const label = isToday
        ? "Hoje"
        : isTomorrow
        ? "Amanhã"
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

      return { label, isOverdue, isToday, isTomorrow };
    } catch {
      return null;
    }
  };

  const isAllCollapsed = statuses.every((s) => collapsedGroups[s.id]);

  return (
    <div className="w-full flex flex-col min-h-0 select-none pb-8" style={{ "--list-cols": LIST_GRID_TEMPLATE } as React.CSSProperties}>
      {/* 1. BARRA SUPERIOR COMPACTA (48px) */}
      <div className="h-12 border-b border-slate-200/80 dark:border-white/10 px-4 flex items-center justify-between gap-3 bg-white/40 dark:bg-[#070e1e]/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
          {/* Busca Rápida */}
          <div className="relative w-64 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar tarefa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Filtro por Responsável */}
          <select
            value={filterAssigneeId}
            onChange={(e) => setFilterAssigneeId(e.target.value)}
            className="px-2 py-1 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">Todos os responsáveis</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Filtro por Prioridade */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2 py-1 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">Todas as prioridades</option>
            {ALL_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_CONFIG[p].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Alternar Expandir/Recolher todos */}
          <button
            type="button"
            onClick={isAllCollapsed ? expandAll : collapseAll}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            title={isAllCollapsed ? "Expandir todos os grupos" : "Recolher todos os grupos"}
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAllCollapsed ? "Expandir todos" : "Recolher todos"}</span>
          </button>

          {/* Botão Primário Único Global */}
          {canCreate && (
            <Button
              onClick={() => setIsNewTaskModalOpen(true)}
              size="sm"
              className="h-8 px-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-1.5 rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Nova tarefa</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. CONTÊINER PRINCIPAL DA TABELA (SCROLL VERTICAL & HORIZONTAL SEGURO) */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="min-w-[940px] flex flex-col">
          {/* CABEÇALHO GLOBAL ÚNICO (STICKY 36px) */}
          <div
            role="row"
            className="sticky top-0 z-20 h-9 bg-slate-100/95 dark:bg-[#060c1a]/95 border-b border-slate-200 dark:border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 font-semibold grid items-center backdrop-blur-md"
            style={{ gridTemplateColumns: "var(--list-cols)" }}
          >
            <div className="text-center font-normal">#</div>
            <div className="pl-3 truncate">Tarefa</div>
            <div className="pl-2">Status</div>
            <div className="pl-2">Responsável</div>
            <div className="pl-2">Prioridade</div>
            <div className="pl-2">Data limite</div>
            <div className="text-right pr-3">Ações</div>
          </div>

          {/* BANNER DISCRETO DE PROJETO VAZIO (CABENDO PERFEITAMENTE EM 1080P) */}
          {totalTasksCount === 0 && (
            <div className="mx-4 my-2.5 px-4 py-2 rounded-xl border border-dashed border-sky-500/25 bg-sky-500/5 text-xs text-sky-400 flex items-center justify-between">
              <span className="font-medium">Comece criando sua primeira tarefa em um dos status abaixo:</span>
              <span className="text-[10px] font-mono text-slate-400">Atalho: pressione &apos;N&apos; para criar</span>
            </div>
          )}

          {/* 3. GRUPOS POR STATUS (ACORDEÃO COMPACTO) */}
          <div className="p-2 space-y-2">
            {statuses.map((status) => {
              const groupTasks = filteredTasks.filter((t) => t.statusId === status.id);
              const isCollapsed = collapsedGroups[status.id] || false;
              const isInlineOpen = activeInlineStatusId === status.id;

              return (
                <div
                  key={status.id}
                  className="rounded-xl border border-slate-200/80 dark:border-white/5 bg-white/50 dark:bg-[#081226]/50 overflow-hidden shadow-2xs"
                >
                  {/* CABEÇALHO DO GRUPO (36px) */}
                  <div
                    onClick={() => toggleGroupCollapse(status.id)}
                    className="h-9 px-3 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100/70 dark:hover:bg-slate-900/40 transition-colors cursor-pointer select-none"
                    aria-expanded={!isCollapsed}
                  >
                    <div className="flex items-center gap-2.5">
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 text-slate-400 transition-transform duration-150 shrink-0",
                          !isCollapsed && "rotate-90 text-slate-200"
                        )}
                      />

                      {/* Pill do Status (cor + ponto) */}
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${status.color}15`,
                          color: status.color,
                          border: `1px solid ${status.color}35`,
                        }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                        <span>{status.name}</span>
                      </div>

                      <span className="text-[11px] font-mono text-slate-400 font-semibold">
                        {groupTasks.length}
                      </span>
                    </div>

                    {/* Sem botão "Nova tarefa" aqui conforme especificação */}
                    <div className="text-[10px] font-mono text-slate-500">
                      {groupTasks.length === 0 ? "Vazio" : `${groupTasks.length} ${groupTasks.length === 1 ? "item" : "itens"}`}
                    </div>
                  </div>

                  {/* CONTEÚDO DO GRUPO (EXPANDIDO) */}
                  {!isCollapsed && (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {/* LINHAS DE TAREFA (40px CADA) */}
                      {groupTasks.map((task, idx) => {
                        const isDone = status.category === "done";
                        const isEditingThisTitle = editingTaskId === task.id;
                        const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none;
                        const PriorityIcon = priorityInfo.icon;
                        const dateInfo = formatShortDate(task.dueDate);
                        const primaryAssignee = task.assigneeIds[0];

                        return (
                          <div
                            key={task.id}
                            role="row"
                            className={cn(
                              "group/row h-10 grid items-center text-xs transition-colors hover:bg-slate-50/90 dark:hover:bg-white/[0.04]",
                              isDone && "opacity-75 bg-slate-50/20 dark:bg-slate-950/20"
                            )}
                            style={{ gridTemplateColumns: "var(--list-cols)" }}
                          >
                            {/* 1. # / Checkbox */}
                            <div className="text-center align-middle">
                              <button
                                type="button"
                                onClick={(e) => handleToggleTaskDone(e, task)}
                                className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors mx-auto cursor-pointer"
                                title={isDone ? "Reabrir tarefa" : "Concluir tarefa"}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <>
                                    <span className="text-[10px] font-mono text-slate-400 group-hover/row:hidden">
                                      {idx + 1}
                                    </span>
                                    <Circle className="h-4 w-4 text-slate-400 hidden group-hover/row:inline-block" />
                                  </>
                                )}
                              </button>
                            </div>

                            {/* 2. Tarefa (Título + Edição Inline) */}
                            <div className="pl-3 pr-2 min-w-0 flex items-center gap-2">
                              {isEditingThisTitle ? (
                                <input
                                  autoFocus
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onBlur={() => {
                                    if (editingTitle.trim() && editingTitle !== task.title) {
                                      updateTask(task.id, { title: editingTitle.trim() });
                                      toast.success("Título salvo!");
                                    }
                                    setEditingTaskId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      if (editingTitle.trim()) {
                                        updateTask(task.id, { title: editingTitle.trim() });
                                        toast.success("Título salvo!");
                                      }
                                      setEditingTaskId(null);
                                    }
                                    if (e.key === "Escape") {
                                      setEditingTaskId(null);
                                    }
                                  }}
                                  className="w-full bg-slate-100 dark:bg-slate-900 border border-sky-500 rounded px-2 py-0.5 text-xs text-slate-900 dark:text-white outline-none"
                                />
                              ) : (
                                <div className="flex items-center gap-2 truncate">
                                  <span
                                    onClick={() => onTaskClick(task)}
                                    onDoubleClick={() => {
                                      if (canEdit) {
                                        setEditingTaskId(task.id);
                                        setEditingTitle(task.title);
                                      }
                                    }}
                                    className={cn(
                                      "truncate font-medium text-slate-800 dark:text-slate-200 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer",
                                      isDone && "line-through text-slate-400 dark:text-slate-500"
                                    )}
                                    title={task.title}
                                  >
                                    {task.title}
                                  </span>

                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingTaskId(task.id);
                                        setEditingTitle(task.title);
                                      }}
                                      className="opacity-0 group-hover/row:opacity-100 text-slate-400 hover:text-sky-400 p-0.5 rounded transition-opacity cursor-pointer shrink-0"
                                      title="Editar título"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                  )}

                                  {/* Badges de Checklist */}
                                  {task.checklists && task.checklists.length > 0 && (
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.2 rounded shrink-0">
                                      ✓ {task.checklists[0]?.items?.filter((i) => i.isCompleted).length || 0}/
                                      {task.checklists[0]?.items?.length || 0}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* 3. Status (Pill Compacto com Dropdown Portável) */}
                            <div className="pl-2 pr-2">
                              <Popover.Root>
                                <Popover.Trigger asChild>
                                  <button
                                    type="button"
                                    disabled={!canEdit}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-mono font-bold uppercase transition-colors cursor-pointer w-full justify-between disabled:cursor-default"
                                    style={{
                                      backgroundColor: `${status.color}15`,
                                      color: status.color,
                                      border: `1px solid ${status.color}30`,
                                    }}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                                      <span className="truncate">{status.name}</span>
                                    </div>
                                    <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                                  </button>
                                </Popover.Trigger>

                                <Popover.Portal>
                                  <Popover.Content
                                    sideOffset={4}
                                    align="start"
                                    className="z-50 w-44 rounded-xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none space-y-0.5"
                                  >
                                    <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-white/5 mb-1">
                                      Mover para Status
                                    </div>
                                    {statuses.map((st) => (
                                      <Popover.Close asChild key={st.id}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            moveTask(task.id, st.id);
                                            toast.success(`Movida para "${st.name}"`);
                                          }}
                                          className={cn(
                                            "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer",
                                            task.statusId === st.id
                                              ? "bg-sky-500/15 text-sky-400 font-semibold"
                                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                          )}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: st.color }} />
                                            <span>{st.name}</span>
                                          </div>
                                          {task.statusId === st.id && <Check className="h-3.5 w-3.5 text-sky-400" />}
                                        </button>
                                      </Popover.Close>
                                    ))}
                                  </Popover.Content>
                                </Popover.Portal>
                              </Popover.Root>
                            </div>

                            {/* 4. Responsável (Avatar 24px + Nome) */}
                            <div className="pl-2 pr-2">
                              <Popover.Root>
                                <Popover.Trigger asChild>
                                  <button
                                    type="button"
                                    disabled={!canEdit}
                                    className="flex items-center gap-2 px-1.5 py-1 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer w-full text-left truncate disabled:cursor-default"
                                  >
                                    {primaryAssignee ? (
                                      <>
                                        <img
                                          src={primaryAssignee.avatarUrl}
                                          alt={primaryAssignee.name}
                                          className="h-6 w-6 rounded-full object-cover border border-sky-500/20 shrink-0"
                                        />
                                        <span className="truncate text-slate-700 dark:text-slate-300">
                                          {primaryAssignee.name}
                                        </span>
                                      </>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-slate-400 hover:text-slate-300">
                                        <div className="h-6 w-6 rounded-full border border-dashed border-slate-400 flex items-center justify-center shrink-0">
                                          <UserPlus className="h-3 w-3" />
                                        </div>
                                        <span className="text-[11px]">Atribuir</span>
                                      </div>
                                    )}
                                  </button>
                                </Popover.Trigger>

                                <Popover.Portal>
                                  <Popover.Content
                                    sideOffset={4}
                                    align="start"
                                    className="z-50 w-56 rounded-xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none space-y-0.5"
                                  >
                                    <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-white/5 mb-1">
                                      Responsável
                                    </div>
                                    <Popover.Close asChild>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateTask(task.id, { assigneeIds: [] });
                                          toast.info("Responsável removido");
                                        }}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                                      >
                                        <Minus className="h-3 w-3" />
                                        <span>Desatribuir</span>
                                      </button>
                                    </Popover.Close>
                                    {members.map((m) => {
                                      const isAssigned = task.assigneeIds.some((a) => a.id === m.id);
                                      return (
                                        <Popover.Close asChild key={m.id}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateTask(task.id, {
                                                assigneeIds: [{ id: m.id, name: m.name, avatarUrl: m.avatarUrl, type: "user" }],
                                              });
                                              toast.success(`Atribuído a ${m.name}`);
                                            }}
                                            className={cn(
                                              "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer",
                                              isAssigned
                                                ? "bg-sky-500/15 text-sky-400 font-semibold"
                                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                            )}
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <img src={m.avatarUrl} alt={m.name} className="h-5 w-5 rounded-full object-cover shrink-0" />
                                              <span className="truncate">{m.name}</span>
                                            </div>
                                            {isAssigned && <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                                          </button>
                                        </Popover.Close>
                                      );
                                    })}
                                  </Popover.Content>
                                </Popover.Portal>
                              </Popover.Root>
                            </div>

                            {/* 5. Prioridade */}
                            <div className="pl-2 pr-2">
                              <Popover.Root>
                                <Popover.Trigger asChild>
                                  <button
                                    type="button"
                                    disabled={!canEdit}
                                    className={cn(
                                      "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer w-full justify-between disabled:cursor-default",
                                      priorityInfo.bg,
                                      priorityInfo.color,
                                      priorityInfo.border
                                    )}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <PriorityIcon className="h-3 w-3 shrink-0" />
                                      <span className="text-[11px] font-semibold truncate">{priorityInfo.label}</span>
                                    </div>
                                    <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                                  </button>
                                </Popover.Trigger>

                                <Popover.Portal>
                                  <Popover.Content
                                    sideOffset={4}
                                    align="start"
                                    className="z-50 w-40 rounded-xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none space-y-0.5"
                                  >
                                    <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-white/5 mb-1">
                                      Prioridade
                                    </div>
                                    {ALL_PRIORITIES.map((p) => {
                                      const pConf = PRIORITY_CONFIG[p];
                                      const PIcon = pConf.icon;
                                      const isCurr = task.priority === p;
                                      return (
                                        <Popover.Close asChild key={p}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateTask(task.id, { priority: p });
                                              toast.success(`Prioridade: ${pConf.label}`);
                                            }}
                                            className={cn(
                                              "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer",
                                              isCurr
                                                ? "bg-sky-500/15 text-sky-400 font-semibold"
                                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                            )}
                                          >
                                            <div className="flex items-center gap-1.5">
                                              <PIcon className={cn("h-3.5 w-3.5", pConf.color)} />
                                              <span>{pConf.label}</span>
                                            </div>
                                            {isCurr && <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                                          </button>
                                        </Popover.Close>
                                      );
                                    })}
                                  </Popover.Content>
                                </Popover.Portal>
                              </Popover.Root>
                            </div>

                            {/* 6. Data Limite */}
                            <div className="pl-2 pr-2">
                              <Popover.Root>
                                <Popover.Trigger asChild>
                                  <button
                                    type="button"
                                    disabled={!canEdit}
                                    className={cn(
                                      "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer w-full text-left truncate disabled:cursor-default",
                                      dateInfo?.isOverdue && !isDone
                                        ? "text-rose-500 bg-rose-500/10 border border-rose-500/20"
                                        : dateInfo?.isToday || dateInfo?.isTomorrow
                                        ? "text-amber-500 bg-amber-500/10 border border-amber-500/20"
                                        : dateInfo
                                        ? "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                                    )}
                                  >
                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate text-[11px] font-mono">
                                      {dateInfo?.label || "Sem data"}
                                    </span>
                                  </button>
                                </Popover.Trigger>

                                <Popover.Portal>
                                  <Popover.Content
                                    sideOffset={4}
                                    align="start"
                                    className="z-50 w-52 rounded-xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none space-y-2"
                                  >
                                    <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-white/5 pb-1">
                                      Data de Entrega
                                    </div>
                                    <input
                                      type="date"
                                      defaultValue={task.dueDate || ""}
                                      onChange={(e) => {
                                        updateTask(task.id, { dueDate: e.target.value });
                                        toast.success("Prazo definido!");
                                      }}
                                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
                                    />
                                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-white/5 text-[10px]">
                                      <Popover.Close asChild>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const todayStr = new Date().toISOString().slice(0, 10);
                                            updateTask(task.id, { dueDate: todayStr });
                                            toast.success("Prazo: Hoje");
                                          }}
                                          className="px-2 py-1 rounded hover:bg-sky-500/10 text-sky-400 cursor-pointer"
                                        >
                                          Hoje
                                        </button>
                                      </Popover.Close>
                                      <Popover.Close asChild>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const tom = new Date();
                                            tom.setDate(tom.getDate() + 1);
                                            updateTask(task.id, { dueDate: tom.toISOString().slice(0, 10) });
                                            toast.success("Prazo: Amanhã");
                                          }}
                                          className="px-2 py-1 rounded hover:bg-sky-500/10 text-sky-400 cursor-pointer"
                                        >
                                          Amanhã
                                        </button>
                                      </Popover.Close>
                                      {task.dueDate && (
                                        <Popover.Close asChild>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateTask(task.id, { dueDate: undefined });
                                              toast.info("Prazo removido");
                                            }}
                                            className="px-2 py-1 rounded hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                                          >
                                            Limpar
                                          </button>
                                        </Popover.Close>
                                      )}
                                    </div>
                                  </Popover.Content>
                                </Popover.Portal>
                              </Popover.Root>
                            </div>

                            {/* 7. Ações (Visíveis no Hover) */}
                            <div className="text-right pr-3">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => onTaskClick(task)}
                                  className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                                  title="Ver detalhes"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>

                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTask(task.id);
                                      toast.info("Tarefa excluída");
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                    title="Excluir tarefa"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* LINHA ÚNICA DE CRIAÇÃO RÁPIDA INLINE POR GRUPO (36px) */}
                      {canCreate && (
                        <div className="h-9 px-3 flex items-center bg-slate-50/20 dark:bg-slate-950/20">
                          {isInlineOpen ? (
                            <div className="w-full flex items-center gap-2 pl-7 animate-in fade-in duration-100">
                              <input
                                ref={inlineInputRef}
                                type="text"
                                placeholder="Nome da tarefa e Enter"
                                value={inlineTitle}
                                onChange={(e) => setInlineTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleInlineSubmit(status.id);
                                  }
                                  if (e.key === "Escape") {
                                    setActiveInlineStatusId(null);
                                    setInlineTitle("");
                                  }
                                }}
                                onBlur={() => {
                                  if (!inlineTitle.trim()) {
                                    setActiveInlineStatusId(null);
                                  }
                                }}
                                className="w-full bg-slate-100 dark:bg-slate-900 border border-sky-500/50 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white outline-none placeholder:text-slate-500"
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveInlineStatusId(status.id);
                                setInlineTitle("");
                              }}
                              className="pl-7 flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>+ Adicionar tarefa</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RODAPÉ OBRIGATÓRIO */}
      <footer className="pt-4 text-center text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
        MedHit Tasks by Integrações & Automações
      </footer>
    </div>
  );
}
