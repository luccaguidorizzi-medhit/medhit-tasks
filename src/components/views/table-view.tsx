/**
 * MedHit Integrações & Automações
 * Visualização de Tarefas em Lista (ClickUp Style).
 * 
 * Tabela única, coesa e unificada inspirada no ClickUp:
 * - Cabeçalhos globais e colunas perfeitamente alinhadas:
 *   TAREFA, STATUS, RESPONSÁVEL, PRIORIDADE, DATA LIMITE, AÇÕES.
 * - Grupos por status colapsáveis com contador e botão rápido.
 * - Criação inline contínua (+ Nova tarefa, Enter para criar e manter foco).
 * - Pílulas de status, prioridade, responsável e prazo utilizando Popover portável
 *   (elimina corte de menus por overflow e barras de rolagem estranhas).
 * - Edição inline direta de títulos de tarefas (duplo clique ou botão de editar).
 * - Barra superior com busca, filtros rápidos e progresso de conclusão.
 * - Zero termos artificiais ou referências legadas.
 * 
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Task, Status } from "@/server/services/data-store";
import { useTasks } from "@/context/task-context";
import * as Popover from "@radix-ui/react-popover";
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
  X,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TableViewProps {
  statuses: Status[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  projectId?: string;
  areaId?: string;
}

const PRIORITY_CONFIG: Record<
  Task["priority"],
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  urgent: {
    label: "Urgente",
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    icon: AlertCircle,
  },
  high: {
    label: "Alta",
    color: "text-orange-500 dark:text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: SignalHigh,
  },
  medium: {
    label: "Média",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: SignalMedium,
  },
  low: {
    label: "Baixa",
    color: "text-sky-500 dark:text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    icon: SignalLow,
  },
  none: {
    label: "Normal",
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    icon: Minus,
  },
};

const ALL_PRIORITIES: Task["priority"][] = ["urgent", "high", "medium", "low", "none"];

export function TableView({ statuses, tasks, onTaskClick, projectId, areaId }: TableViewProps) {
  const {
    moveTask,
    updateTask,
    createTask,
    deleteTask,
    members,
    hasPermission,
  } = useTasks();

  const canEdit = hasPermission("edit_task");
  const canCreate = hasPermission("create_task");
  const canDelete = hasPermission("delete_task");

  // Filtros de busca
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatusId, setFilterStatusId] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  // Grupos colapsados por status
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Edição inline de título
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  // Criação inline ativa por statusId
  const [inlineCreateStatusId, setInlineCreateStatusId] = useState<string | null>(null);
  const [inlineTitle, setInlineTitle] = useState("");
  const inlineInputRef = useRef<HTMLInputElement | null>(null);

  // Status de conclusão e inicial
  const doneStatus = statuses.find((s) => s.category === "done") || statuses[statuses.length - 1];
  const initialStatus = statuses[0] || doneStatus;

  // Foco no input de criação inline quando ativado
  useEffect(() => {
    if (inlineCreateStatusId && inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  }, [inlineCreateStatusId]);

  // Filtragem das tarefas
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery.trim()) {
        const matchesQuery = task.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
        if (!matchesQuery) return false;
      }
      if (filterStatusId !== "all" && task.statusId !== filterStatusId) {
        return false;
      }
      if (filterPriority !== "all" && task.priority !== filterPriority) {
        return false;
      }
      return true;
    });
  }, [tasks, searchQuery, filterStatusId, filterPriority]);

  const totalTasksCount = tasks.length;
  const doneTasksCount = tasks.filter((t) => {
    const s = statuses.find((st) => st.id === t.statusId);
    return s?.category === "done";
  }).length;
  const percentDone = totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0;

  // Toggle de conclusão (Checkbox)
  const handleToggleTaskDone = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!canEdit) {
      toast.error("Você não tem permissão para editar tarefas.");
      return;
    }

    const currentStatus = statuses.find((s) => s.id === task.statusId);
    const isDone = currentStatus?.category === "done";

    if (isDone) {
      moveTask(task.id, initialStatus.id);
      toast.info(`Tarefa reaberta para "${initialStatus.name}"`);
    } else {
      if (doneStatus) {
        moveTask(task.id, doneStatus.id);
        toast.success(`Tarefa concluída!`);
      }
    }
  };

  // Salvar título inline
  const handleSaveInlineTitle = (taskId: string) => {
    const trimmed = editingTitle.trim();
    if (trimmed && trimmed !== tasks.find((t) => t.id === taskId)?.title) {
      updateTask(taskId, { title: trimmed });
      toast.success("Título atualizado!");
    }
    setEditingTaskId(null);
  };

  // Criar tarefa inline contínua
  const handleInlineCreateSubmit = (statusId: string) => {
    const trimmed = inlineTitle.trim();
    if (!trimmed) {
      setInlineCreateStatusId(null);
      return;
    }

    createTask({
      title: trimmed,
      statusId,
      projectId,
      areaId,
      priority: "medium",
      taskType: "task",
    });

    toast.success("Tarefa criada!");
    setInlineTitle("");
    // Mantém o input aberto e focado para fluxo contínuo
    if (inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  };

  // Formatação amigável de data
  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const targetDate = new Date(dateStr + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const isToday = targetDate.getTime() === today.getTime();
      const isTomorrow = targetDate.getTime() === tomorrow.getTime();
      const isOverdue = targetDate.getTime() < today.getTime();

      let label = targetDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      if (isToday) label = "Hoje";
      if (isTomorrow) label = "Amanhã";

      return {
        label,
        isOverdue,
        isToday,
      };
    } catch {
      return { label: dateStr, isOverdue: false, isToday: false };
    }
  };

  return (
    <div className="w-full space-y-4 select-none pb-12">
      {/* Barra de Filtros & Ações Rápidas (Estilo ClickUp) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 dark:bg-[#081226]/80 border border-slate-200 dark:border-sky-500/20 backdrop-blur-xl shadow-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Busca por texto */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/80 dark:bg-[#0c1830] border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-sky-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filtro por Status */}
          <select
            value={filterStatusId}
            onChange={(e) => setFilterStatusId(e.target.value)}
            className="bg-slate-100/80 dark:bg-[#0c1830] border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-sky-500 transition-colors"
          >
            <option value="all">Todos os Status</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                {s.name}
              </option>
            ))}
          </select>

          {/* Filtro por Prioridade */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-100/80 dark:bg-[#0c1830] border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-sky-500 transition-colors"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
            <option value="none">Normal</option>
          </select>

          {(searchQuery || filterStatusId !== "all" || filterPriority !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterStatusId("all");
                setFilterPriority("all");
              }}
              className="text-xs text-sky-500 hover:text-sky-400 font-medium px-2 py-1 rounded-lg hover:bg-sky-500/10 transition-colors cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Resumo & Progresso do Projeto */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">
              {doneTasksCount}/{totalTasksCount} concluídas
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30">
              {percentDone}%
            </span>
          </div>

          {canCreate && (
            <Button
              onClick={() => {
                setCollapsedGroups((prev) => ({ ...prev, [initialStatus.id]: false }));
                setInlineCreateStatusId(initialStatus.id);
                setInlineTitle("");
              }}
              size="sm"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-1.5 rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Tarefa</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabela Única e Coesa (ClickUp Style) */}
      <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#091326]/80 backdrop-blur-xl shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Cabeçalho Global Único com Colunas Perfeitamente Alinhadas */}
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-slate-950/40 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3 font-semibold text-slate-500 dark:text-slate-400 min-w-[240px]">
                Tarefa
              </th>
              <th className="py-2.5 px-3 w-36 font-semibold text-slate-500 dark:text-slate-400">
                Status
              </th>
              <th className="py-2.5 px-3 w-40 font-semibold text-slate-500 dark:text-slate-400">
                Responsável
              </th>
              <th className="py-2.5 px-3 w-32 font-semibold text-slate-500 dark:text-slate-400">
                Prioridade
              </th>
              <th className="py-2.5 px-3 w-32 font-semibold text-slate-500 dark:text-slate-400">
                Data Limite
              </th>
              <th className="py-2.5 px-3 w-20 text-right font-semibold text-slate-500 dark:text-slate-400">
                Ações
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
            {statuses.map((status) => {
              const groupTasks = filteredTasks.filter((t) => t.statusId === status.id);
              const isCollapsed = collapsedGroups[status.id] || false;
              const isInlineActive = inlineCreateStatusId === status.id;

              // Se houver filtro ativo e o grupo estiver vazio, oculta a seção
              if ((searchQuery || filterStatusId !== "all" || filterPriority !== "all") && groupTasks.length === 0) {
                return null;
              }

              return (
                <React.Fragment key={status.id}>
                  {/* Linha Divisória de Grupo por Status (ClickUp Status Header Bar) */}
                  <tr className="bg-slate-50/80 dark:bg-slate-950/60 border-t border-b border-slate-200/80 dark:border-white/10">
                    <td colSpan={7} className="py-2 px-3">
                      <div className="flex items-center justify-between">
                        <div
                          onClick={() =>
                            setCollapsedGroups((prev) => ({ ...prev, [status.id]: !isCollapsed }))
                          }
                          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <span className="text-slate-400 hover:text-slate-200 transition-colors">
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </span>

                          {/* Pílula de Identificação do Status */}
                          <div
                            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: `${status.color}20`,
                              color: status.color,
                              border: `1px solid ${status.color}40`,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            <span>{status.name}</span>
                          </div>

                          <span className="text-[11px] font-mono text-slate-400 font-semibold">
                            {groupTasks.length}
                          </span>
                        </div>

                        {canCreate && (
                          <button
                            type="button"
                            onClick={() => {
                              setCollapsedGroups((prev) => ({ ...prev, [status.id]: false }));
                              setInlineCreateStatusId(status.id);
                              setInlineTitle("");
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Nova tarefa</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Tarefas do Grupo */}
                  {!isCollapsed && (
                    <>
                      {groupTasks.length === 0 && !isInlineActive ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-4 text-center text-xs text-slate-400 dark:text-slate-500"
                          >
                            Nenhuma tarefa neste status.{" "}
                            {canCreate && (
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineCreateStatusId(status.id);
                                  setInlineTitle("");
                                }}
                                className="text-sky-500 hover:underline cursor-pointer font-medium ml-1"
                              >
                                + Adicionar tarefa
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        groupTasks.map((task) => {
                          const isDone = status.category === "done";
                          const isEditingTitle = editingTaskId === task.id;
                          const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none;
                          const PriorityIcon = priorityInfo.icon;
                          const dueDateInfo = formatDueDate(task.dueDate);

                          return (
                            <tr
                              key={task.id}
                              className={cn(
                                "group/row hover:bg-slate-50/90 dark:hover:bg-white/[0.03] transition-colors border-b border-slate-100 dark:divide-white/5",
                                isDone && "opacity-75 bg-slate-50/30 dark:bg-slate-950/20"
                              )}
                            >
                              {/* 1. Checkbox / Conclusão */}
                              <td className="py-2.5 px-3 text-center align-middle">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleTaskDone(e, task)}
                                  className="text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                                  title={isDone ? "Marcar como não concluída" : "Marcar como concluída"}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600 hover:text-emerald-400" />
                                  )}
                                </button>
                              </td>

                              {/* 2. Título da Tarefa & Edição Inline */}
                              <td className="py-2.5 px-3 align-middle">
                                {isEditingTitle ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      autoFocus
                                      type="text"
                                      value={editingTitle}
                                      onChange={(e) => setEditingTitle(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveInlineTitle(task.id);
                                        if (e.key === "Escape") setEditingTaskId(null);
                                      }}
                                      onBlur={() => handleSaveInlineTitle(task.id)}
                                      className="w-full bg-white dark:bg-[#0c1830] border border-sky-500 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white outline-none shadow-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveInlineTitle(task.id)}
                                      className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
                                      title="Salvar (Enter)"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-2">
                                    <span
                                      onClick={() => onTaskClick(task)}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        if (canEdit) {
                                          setEditingTaskId(task.id);
                                          setEditingTitle(task.title);
                                        }
                                      }}
                                      className={cn(
                                        "font-medium text-slate-900 dark:text-slate-100 hover:text-sky-500 dark:hover:text-sky-300 transition-colors cursor-pointer truncate",
                                        isDone && "line-through text-slate-400 dark:text-slate-500 font-normal"
                                      )}
                                      title="Clique para abrir detalhes, duplo-clique para editar título"
                                    >
                                      {task.title}
                                    </span>

                                    {canEdit && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingTaskId(task.id);
                                          setEditingTitle(task.title);
                                        }}
                                        className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-opacity cursor-pointer shrink-0"
                                        title="Editar título inline"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* 3. Coluna de Status (Popover portável sem corte de tela) */}
                              <td className="py-2.5 px-3 align-middle">
                                <Popover.Root>
                                  <Popover.Trigger asChild>
                                    <button
                                      type="button"
                                      disabled={!canEdit}
                                      className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all text-left truncate cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-default"
                                      style={{
                                        backgroundColor: `${status.color}15`,
                                        color: status.color,
                                        border: `1px solid ${status.color}35`,
                                      }}
                                      title="Clique para alterar status"
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span
                                          className="h-2 w-2 rounded-full shrink-0"
                                          style={{ backgroundColor: status.color }}
                                        />
                                        <span className="truncate text-[11px] font-semibold">{status.name}</span>
                                      </div>
                                      <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                                    </button>
                                  </Popover.Trigger>

                                  <Popover.Portal>
                                    <Popover.Content
                                      sideOffset={4}
                                      align="start"
                                      className="z-50 w-48 rounded-xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none"
                                    >
                                      <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-white/5 mb-1">
                                        Alterar Status
                                      </div>
                                      <div className="space-y-0.5">
                                        {statuses.map((s) => (
                                          <Popover.Close asChild key={s.id}>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                moveTask(task.id, s.id);
                                                toast.success(`Status alterado para "${s.name}"`);
                                              }}
                                              className={cn(
                                                "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer",
                                                task.statusId === s.id
                                                  ? "bg-sky-500/15 text-sky-400 font-semibold"
                                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                              )}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span
                                                  className="h-2 w-2 rounded-full shrink-0"
                                                  style={{ backgroundColor: s.color }}
                                                />
                                                <span>{s.name}</span>
                                              </div>
                                              {task.statusId === s.id && (
                                                <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                                              )}
                                            </button>
                                          </Popover.Close>
                                        ))}
                                      </div>
                                    </Popover.Content>
                                  </Popover.Portal>
                                </Popover.Root>
                              </td>

                              {/* 4. Coluna de Responsável (Popover portável) */}
                              <td className="py-2.5 px-3 align-middle">
                                <Popover.Root>
                                  <Popover.Trigger asChild>
                                    <button
                                      type="button"
                                      disabled={!canEdit}
                                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-slate-600 dark:text-slate-400 text-xs w-full disabled:cursor-default"
                                      title="Clique para atribuir responsável"
                                    >
                                      {task.assigneeIds && task.assigneeIds.length > 0 ? (
                                        <div className="flex items-center gap-1.5 truncate">
                                          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                                            {task.assigneeIds.map((assignee, idx) => (
                                              <img
                                                key={idx}
                                                src={assignee.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"}
                                                alt={assignee.name}
                                                className="h-5 w-5 rounded-full border border-white dark:border-slate-900 object-cover"
                                              />
                                            ))}
                                          </div>
                                          <span className="text-[11px] text-slate-800 dark:text-slate-200 truncate">
                                            {task.assigneeIds[0]?.name.split(" ")[0]}
                                            {task.assigneeIds.length > 1 && ` +${task.assigneeIds.length - 1}`}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-400">
                                          <UserPlus className="h-3.5 w-3.5" />
                                          <span>Atribuir</span>
                                        </div>
                                      )}
                                    </button>
                                  </Popover.Trigger>

                                  <Popover.Portal>
                                    <Popover.Content
                                      sideOffset={4}
                                      align="start"
                                      className="z-50 w-52 rounded-xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none"
                                    >
                                      <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-white/5 mb-1">
                                        Colaboradores
                                      </div>
                                      <div className="space-y-0.5 max-h-48 overflow-y-auto">
                                        {members.map((member) => {
                                          const isAssigned = task.assigneeIds?.some((a) => a.id === member.id);
                                          return (
                                            <button
                                              key={member.id}
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                let newAssignees = [...(task.assigneeIds || [])];
                                                if (isAssigned) {
                                                  newAssignees = newAssignees.filter((a) => a.id !== member.id);
                                                } else {
                                                  newAssignees.push({
                                                    type: "user",
                                                    id: member.id,
                                                    name: member.name,
                                                    avatarUrl: member.avatarUrl,
                                                  });
                                                }
                                                updateTask(task.id, { assigneeIds: newAssignees });
                                              }}
                                              className={cn(
                                                "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer",
                                                isAssigned
                                                  ? "bg-sky-500/15 text-sky-400 font-semibold"
                                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                              )}
                                            >
                                              <div className="flex items-center gap-2 truncate">
                                                <img
                                                  src={member.avatarUrl}
                                                  alt={member.name}
                                                  className="h-5 w-5 rounded-full object-cover shrink-0"
                                                />
                                                <span className="truncate">{member.name}</span>
                                              </div>
                                              {isAssigned && (
                                                <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </Popover.Content>
                                  </Popover.Portal>
                                </Popover.Root>
                              </td>

                              {/* 5. Coluna de Prioridade (Popover portável) */}
                              <td className="py-2.5 px-3 align-middle">
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
                                      title="Clique para alterar prioridade"
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <PriorityIcon className="h-3.5 w-3.5 shrink-0" />
                                        <span className="text-[11px] font-semibold">{priorityInfo.label}</span>
                                      </div>
                                      <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                                    </button>
                                  </Popover.Trigger>

                                  <Popover.Portal>
                                    <Popover.Content
                                      sideOffset={4}
                                      align="start"
                                      className="z-50 w-36 rounded-xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none"
                                    >
                                      <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-white/5 mb-1">
                                        Prioridade
                                      </div>
                                      <div className="space-y-0.5">
                                        {ALL_PRIORITIES.map((p) => {
                                          const pConfig = PRIORITY_CONFIG[p];
                                          const PIcon = pConfig.icon;
                                          const isCurrent = task.priority === p;
                                          return (
                                            <Popover.Close asChild key={p}>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  updateTask(task.id, { priority: p });
                                                  toast.success(`Prioridade definida para "${pConfig.label}"`);
                                                }}
                                                className={cn(
                                                  "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer",
                                                  isCurrent
                                                    ? "bg-sky-500/15 text-sky-400 font-semibold"
                                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                                )}
                                              >
                                                <div className="flex items-center gap-1.5">
                                                  <PIcon className={cn("h-3.5 w-3.5", pConfig.color)} />
                                                  <span>{pConfig.label}</span>
                                                </div>
                                                {isCurrent && (
                                                  <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                                                )}
                                              </button>
                                            </Popover.Close>
                                          );
                                        })}
                                      </div>
                                    </Popover.Content>
                                  </Popover.Portal>
                                </Popover.Root>
                              </td>

                              {/* 6. Coluna de Data Limite (Popover portável) */}
                              <td className="py-2.5 px-3 align-middle">
                                <Popover.Root>
                                  <Popover.Trigger asChild>
                                    <button
                                      type="button"
                                      disabled={!canEdit}
                                      className={cn(
                                        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer w-full text-left truncate disabled:cursor-default",
                                        dueDateInfo?.isOverdue
                                          ? "text-rose-500 bg-rose-500/10 border border-rose-500/20"
                                          : dueDateInfo?.isToday
                                          ? "text-amber-500 bg-amber-500/10 border border-amber-500/20"
                                          : dueDateInfo
                                          ? "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                                      )}
                                      title="Clique para definir prazo"
                                    >
                                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate text-[11px]">
                                        {dueDateInfo?.label || "Sem data"}
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
                                        Definir Data Limite
                                      </div>
                                      <input
                                        type="date"
                                        defaultValue={task.dueDate || ""}
                                        onChange={(e) => {
                                          updateTask(task.id, { dueDate: e.target.value });
                                          toast.success("Prazo atualizado!");
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
                                              toast.success("Definido para Hoje!");
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
                                              const tomorrow = new Date();
                                              tomorrow.setDate(tomorrow.getDate() + 1);
                                              updateTask(task.id, { dueDate: tomorrow.toISOString().slice(0, 10) });
                                              toast.success("Definido para Amanhã!");
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
                                                toast.info("Data removida!");
                                              }}
                                              className="px-2 py-1 rounded hover:bg-rose-500/10 text-rose-400 cursor-pointer"
                                            >
                                              Limpar
                                            </button>
                                          </Popover.Close>
                                        )}
                                      </div>
                                    </Popover.Content>
                                  </Popover.Portal>
                                </Popover.Root>
                              </td>

                              {/* 7. Coluna de Ações */}
                              <td className="py-2.5 px-3 text-right align-middle">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => onTaskClick(task)}
                                    className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                                    title="Visualizar detalhes da tarefa"
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
                              </td>
                            </tr>
                          );
                        })
                      )}

                      {/* Linha de Criação Rápida Inline no Rodapé do Grupo */}
                      {isInlineActive ? (
                        <tr className="bg-sky-500/5 dark:bg-sky-500/10 border-t border-sky-500/30 animate-in fade-in duration-100">
                          <td className="py-2.5 px-3 text-center align-middle">
                            <Plus className="h-4 w-4 text-sky-500 mx-auto" />
                          </td>
                          <td colSpan={6} className="py-2.5 px-3 align-middle">
                            <div className="flex items-center gap-2">
                              <input
                                ref={inlineInputRef}
                                type="text"
                                placeholder="Nome da nova tarefa... (Pressione Enter para salvar e continuar, Esc para cancelar)"
                                value={inlineTitle}
                                onChange={(e) => setInlineTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleInlineCreateSubmit(status.id);
                                  }
                                  if (e.key === "Escape") {
                                    setInlineCreateStatusId(null);
                                    setInlineTitle("");
                                  }
                                }}
                                className="w-full bg-white dark:bg-[#0c1830] border border-sky-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none placeholder:text-slate-400 shadow-xs"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleInlineCreateSubmit(status.id)}
                                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shrink-0 rounded-xl cursor-pointer"
                              >
                                Criar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setInlineCreateStatusId(null);
                                  setInlineTitle("");
                                }}
                                className="text-xs shrink-0 rounded-xl cursor-pointer"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        canCreate && (
                          <tr className="border-t border-slate-100 dark:border-white/5">
                            <td colSpan={7} className="p-1.5 bg-slate-50/40 dark:bg-slate-950/20">
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineCreateStatusId(status.id);
                                  setInlineTitle("");
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-300 hover:bg-sky-500/5 text-xs font-medium transition-colors cursor-pointer text-left"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>+ Nova tarefa</span>
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rodapé Padronizado MedHit Tasks */}
      <footer className="pt-6 pb-2 text-center text-[11px] font-mono text-slate-400 dark:text-slate-500">
        MedHit Tasks by Integrações & Automações
      </footer>
    </div>
  );
}
