/**
 * MedHit Integrações & Automações
 * Tabela Interativa de Demandas - Monday.com Grid Style.
 *
 * Visão em grade unificada com:
 * - Coluna de Status com badges coloridos interativos e dropdown de troca instantânea
 * - Coluna de Responsável com atribuição rápida de colaboradores
 * - Coluna de Prioridade com pills visuais
 * - Coluna de Prazos com cálculo automático de dias restantes / atraso
 * - Adição inline ultra-rápida (pressione Enter para criar)
 * - Edição inline de títulos e datas
 * - Modos de visualização: Tabela Unificada (Monday Grid), Agrupada por Status ou por Prioridade
 * - Filtros rápidos por texto, status e prioridade
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useState, useMemo } from "react";
import { Task, Status } from "@/server/services/data-store";
import { useTasks } from "@/context/task-context";
import {
  CheckCircle2,
  Clock,
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
  Filter,
  Layers,
  ArrowUpDown,
  Calendar,
  Sparkles,
  ListFilter,
  CheckSquare,
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

type GroupMode = "unified" | "status" | "priority";

const PRIORITY_OPTIONS: {
  id: Task["priority"];
  label: string;
  color: string;
  badgeBg: string;
  icon: React.ElementType;
}[] = [
  { id: "urgent", label: "Urgente", color: "#f43f5e", badgeBg: "bg-rose-500 hover:bg-rose-600", icon: AlertCircle },
  { id: "high", label: "Alta", color: "#f97316", badgeBg: "bg-orange-500 hover:bg-orange-600", icon: SignalHigh },
  { id: "medium", label: "Média", color: "#eab308", badgeBg: "bg-amber-500 hover:bg-amber-600", icon: SignalMedium },
  { id: "low", label: "Baixa", color: "#38bdf8", badgeBg: "bg-sky-500 hover:bg-sky-600", icon: SignalLow },
  { id: "none", label: "Normal", color: "#64748b", badgeBg: "bg-slate-500 hover:bg-slate-600", icon: Minus },
];

export function TableView({ statuses, tasks, onTaskClick, projectId, areaId }: TableViewProps) {
  const {
    moveTask,
    updateTask,
    createTask,
    deleteTask,
    members,
    currentProject,
    currentArea,
    hasPermission,
  } = useTasks();

  const canEdit = hasPermission("edit_task");
  const canCreate = hasPermission("create_task");
  const canDelete = hasPermission("delete_task");

  // Filtros e Agrupamento
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatusId, setFilterStatusId] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [groupMode, setGroupMode] = useState<GroupMode>("unified");

  // Menus interativos suspensos (dropdowns ativos)
  const [activeStatusMenu, setActiveStatusMenu] = useState<string | null>(null);
  const [activePriorityMenu, setActivePriorityMenu] = useState<string | null>(null);
  const [activeAssigneeMenu, setActiveAssigneeMenu] = useState<string | null>(null);

  // Estados de grupos colapsados no modo agrupado
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Edição inline de título
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  // Edição inline de data limite
  const [editingDateTaskId, setEditingDateTaskId] = useState<string | null>(null);

  // Input inline de nova tarefa principal
  const [newQuickTitle, setNewQuickTitle] = useState("");
  const [quickAddStatusId, setQuickAddStatusId] = useState<string>(statuses[0]?.id || "");

  // Input inline de nova tarefa por grupo
  const [newTitleByGroup, setNewTitleByGroup] = useState<Record<string, string>>({});

  const doneCategoryStatuses = statuses.filter((s) => s.category === "done");
  const doneStatusId = doneCategoryStatuses[0]?.id || statuses[statuses.length - 1]?.id;

  // Filtragem
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

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => {
    const s = statuses.find((st) => st.id === t.statusId);
    return s?.category === "done";
  });
  const percentDone = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  const handleToggleDone = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!canEdit) return;

    const currentStatus = statuses.find((s) => s.id === task.statusId);
    if (currentStatus?.category === "done") {
      const initialStatus = statuses[0]?.id;
      if (initialStatus) {
        moveTask(task.id, initialStatus);
        toast.info(`Tarefa "${task.title}" reaberta`);
      }
    } else if (doneStatusId) {
      moveTask(task.id, doneStatusId);
      toast.success(`Tarefa "${task.title}" concluída!`);
    }
  };

  const handleCreateUnifiedTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = newQuickTitle.trim();
    if (!title || !canCreate) return;

    const targetStatus = filterStatusId !== "all" ? filterStatusId : statuses[0]?.id || "";

    createTask({
      title,
      statusId: targetStatus,
      projectId: projectId || currentProject?.id,
      areaId: areaId || currentArea?.id,
      priority: filterPriority !== "all" ? (filterPriority as Task["priority"]) : "medium",
      taskType: "task",
    });

    setNewQuickTitle("");
    toast.success("Tarefa adicionada!");
  };

  const handleCreateGroupTask = (targetStatusId: string, groupKey: string) => {
    const title = (newTitleByGroup[groupKey] || "").trim();
    if (!title || !canCreate) return;

    createTask({
      title,
      statusId: targetStatusId,
      projectId: projectId || currentProject?.id,
      areaId: areaId || currentArea?.id,
      priority: "medium",
      taskType: "task",
    });

    setNewTitleByGroup((prev) => ({ ...prev, [groupKey]: "" }));
    toast.success("Tarefa adicionada!");
  };

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const due = new Date(dateStr);
    const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.ceil((dueDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)}d atrasada`,
        color: "text-rose-500 bg-rose-500/10 border-rose-500/30 font-semibold",
      };
    }
    if (diffDays === 0) {
      return {
        text: "Hoje",
        color: "text-amber-500 bg-amber-500/10 border-amber-500/30 font-semibold",
      };
    }
    if (diffDays === 1) {
      return {
        text: "Amanhã",
        color: "text-sky-500 bg-sky-500/10 border-sky-500/30 font-semibold",
      };
    }
    return {
      text: due.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      color: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10",
    };
  };

  // Renderizador de Linha de Tarefa
  const renderTaskRow = (task: Task) => {
    const taskStatus = statuses.find((s) => s.id === task.statusId) || statuses[0] || {
      id: "unknown",
      name: "A Fazer",
      color: "#64748b",
      category: "todo" as const,
    };
    const priorityCfg = PRIORITY_OPTIONS.find((p) => p.id === task.priority) || PRIORITY_OPTIONS[4];
    const dueInfo = formatDueDate(task.dueDate);
    const isDone = taskStatus.category === "done";

    return (
      <tr
        key={task.id}
        onClick={() => onTaskClick(task)}
        className="h-11 hover:bg-sky-500/5 transition-colors cursor-pointer group border-b border-slate-100 dark:border-white/[0.04]"
      >
        {/* Checkbox de conclusão rápida */}
        <td className="py-2 px-3 text-center w-10" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => handleToggleDone(e, task)}
            className={cn(
              "h-4 w-4 rounded border transition-all flex items-center justify-center cursor-pointer",
              isDone
                ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-xs"
                : "border-slate-300 dark:border-white/20 hover:border-sky-500"
            )}
            title={isDone ? "Reabrir tarefa" : "Marcar como concluída"}
          >
            {isDone && <Check className="h-3 w-3 stroke-[3]" />}
          </button>
        </td>

        {/* Título da Demanda com Edição Inline */}
        <td
          className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200 group-hover:text-sky-500 transition-colors max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {editingTaskId === task.id ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingTitle.trim()) {
                  updateTask(task.id, { title: editingTitle.trim() });
                  toast.success("Título atualizado");
                }
                setEditingTaskId(null);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                autoFocus
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingTaskId(null);
                }}
                onBlur={() => {
                  if (editingTitle.trim() && editingTitle !== task.title) {
                    updateTask(task.id, { title: editingTitle.trim() });
                    toast.success("Título atualizado");
                  }
                  setEditingTaskId(null);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-sky-500 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white outline-none shadow-sm"
              />
            </form>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span
                onDoubleClick={() => {
                  if (!canEdit) return;
                  setEditingTaskId(task.id);
                  setEditingTitle(task.title);
                }}
                onClick={() => onTaskClick(task)}
                className={cn(
                  "cursor-pointer truncate",
                  isDone && "line-through text-slate-400 dark:text-slate-500"
                )}
                title="Clique para abrir detalhes, clique duas vezes para editar título"
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
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-sky-500 transition-opacity cursor-pointer shrink-0"
                  title="Editar título inline"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </td>

        {/* Coluna de Status Interativo (Monday Style) */}
        <td className="py-2 px-3 text-center w-36 relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              if (!canEdit) return;
              setActiveStatusMenu(activeStatusMenu === task.id ? null : task.id);
              setActivePriorityMenu(null);
              setActiveAssigneeMenu(null);
            }}
            className={cn(
              "w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1",
              canEdit ? "hover:brightness-110 cursor-pointer" : "cursor-default"
            )}
            style={{ backgroundColor: taskStatus.color || "#64748b" }}
          >
            <span className="truncate">{taskStatus.name}</span>
            {canEdit && <ChevronDown className="h-3 w-3 opacity-80 shrink-0" />}
          </button>

          {/* Dropdown de Seleção de Status */}
          {activeStatusMenu === task.id && (
            <div className="absolute top-full left-2 right-2 mt-1 bg-white dark:bg-[#0c1830] border border-slate-200 dark:border-sky-500/30 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
              {statuses.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    moveTask(task.id, s.id);
                    setActiveStatusMenu(null);
                    toast.success(`Status alterado para: ${s.name}`);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-sky-500/10 transition-colors cursor-pointer"
                >
                  <span className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-700 dark:text-slate-200 truncate">{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </td>

        {/* Coluna de Responsável Interativo */}
        <td className="py-2 px-3 text-center w-36 relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              if (!canEdit) return;
              setActiveAssigneeMenu(activeAssigneeMenu === task.id ? null : task.id);
              setActiveStatusMenu(null);
              setActivePriorityMenu(null);
            }}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-700 dark:text-slate-300 transition-colors",
              canEdit ? "hover:border-sky-500/40 cursor-pointer" : "cursor-default"
            )}
          >
            {task.assigneeIds.length > 0 ? (
              <>
                <img
                  src={task.assigneeIds[0].avatarUrl}
                  alt={task.assigneeIds[0].name}
                  className="h-4 w-4 rounded-full object-cover shrink-0"
                />
                <span className="truncate max-w-[80px]">{task.assigneeIds[0].name.split(" ")[0]}</span>
              </>
            ) : (
              <span className="text-slate-400 italic flex items-center gap-1">
                <UserPlus className="h-3 w-3" /> Atribuir
              </span>
            )}
          </button>

          {/* Dropdown de Responsáveis */}
          {activeAssigneeMenu === task.id && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#0c1830] border border-slate-200 dark:border-sky-500/30 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 max-h-48 overflow-y-auto">
              {members.map((m) => {
                const isAssigned = task.assigneeIds.some((a) => a.id === m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      const updated = isAssigned
                        ? task.assigneeIds.filter((a) => a.id !== m.id)
                        : [
                            ...task.assigneeIds,
                            { type: "user" as const, id: m.id, name: m.name, avatarUrl: m.avatarUrl },
                          ];
                      updateTask(task.id, { assigneeIds: updated });
                      setActiveAssigneeMenu(null);
                      toast.success(`${m.name} atualizado`);
                    }}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-sky-500/10 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img src={m.avatarUrl} alt={m.name} className="h-4 w-4 rounded-full object-cover shrink-0" />
                      <span className="text-slate-700 dark:text-slate-200 truncate">{m.name}</span>
                    </div>
                    {isAssigned && <Check className="h-3 w-3 text-sky-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}
        </td>

        {/* Coluna de Prioridade Interativa (Monday Style) */}
        <td className="py-2 px-3 text-center w-32 relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              if (!canEdit) return;
              setActivePriorityMenu(activePriorityMenu === task.id ? null : task.id);
              setActiveStatusMenu(null);
              setActiveAssigneeMenu(null);
            }}
            className={cn(
              "w-full py-1.5 px-2 rounded-lg text-[11px] font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1",
              canEdit ? "hover:brightness-110 cursor-pointer" : "cursor-default"
            )}
            style={{ backgroundColor: priorityCfg.color }}
          >
            <priorityCfg.icon className="h-3 w-3 shrink-0" />
            <span className="truncate">{priorityCfg.label}</span>
          </button>

          {/* Dropdown de Prioridade */}
          {activePriorityMenu === task.id && (
            <div className="absolute top-full left-2 right-2 mt-1 bg-white dark:bg-[#0c1830] border border-slate-200 dark:border-sky-500/30 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
              {PRIORITY_OPTIONS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    updateTask(task.id, { priority: p.id });
                    setActivePriorityMenu(null);
                    toast.success(`Prioridade: ${p.label}`);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-sky-500/10 cursor-pointer"
                >
                  <p.icon className="h-3 w-3 shrink-0" style={{ color: p.color }} />
                  <span className="text-slate-700 dark:text-slate-200 truncate">{p.label}</span>
                </div>
              ))}
            </div>
          )}
        </td>

        {/* Coluna de Data Limite com Edição Inline */}
        <td className="py-2 px-3 text-center w-28" onClick={(e) => e.stopPropagation()}>
          {editingDateTaskId === task.id ? (
            <input
              type="date"
              autoFocus
              value={task.dueDate?.split("T")[0] || ""}
              onChange={(e) => {
                updateTask(task.id, { dueDate: e.target.value || undefined });
                setEditingDateTaskId(null);
                toast.success("Data atualizada");
              }}
              onBlur={() => setEditingDateTaskId(null)}
              className="bg-white dark:bg-slate-900 border border-sky-500 rounded px-1.5 py-0.5 text-[11px] text-slate-900 dark:text-white outline-none shadow-xs"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                if (canEdit) setEditingDateTaskId(task.id);
              }}
              className={cn(
                "cursor-pointer transition-transform hover:scale-105 inline-block",
                !canEdit && "cursor-default"
              )}
              title={canEdit ? "Clique para alterar o prazo" : undefined}
            >
              {dueInfo ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border",
                    dueInfo.color
                  )}
                >
                  <Clock className="h-2.5 w-2.5" />
                  {dueInfo.text}
                </span>
              ) : (
                <span className="text-slate-400 hover:text-sky-500 font-mono text-[10px] flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3" /> + Prazo
                </span>
              )}
            </button>
          )}
        </td>

        {/* Coluna de Ações (Excluir) */}
        <td className="py-2 px-3 text-center w-12" onClick={(e) => e.stopPropagation()}>
          {canDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Deseja excluir a tarefa "${task.title}"?`)) {
                  deleteTask(task.id);
                  toast.success("Tarefa excluída");
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
              title="Excluir tarefa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div
      className="space-y-4 pb-12 select-none"
      onClick={() => {
        setActiveStatusMenu(null);
        setActivePriorityMenu(null);
        setActiveAssigneeMenu(null);
      }}
    >
      {/* Barra de Ferramentas da Tabela (Filtros, Busca & Modos) */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Esquerda: Campo de Busca e Filtros Rápidos */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Input de Busca */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Filtro por Status */}
          <select
            value={filterStatusId}
            onChange={(e) => setFilterStatusId(e.target.value)}
            className="bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Filtro por Prioridade */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
            <option value="none">Normal</option>
          </select>
        </div>

        {/* Direita: Modos de Agrupamento */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="h-3 w-3 text-sky-400" />
            <span>Exibição:</span>
          </span>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setGroupMode("unified")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                groupMode === "unified"
                  ? "bg-sky-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Grade Monday
            </button>

            <button
              type="button"
              onClick={() => setGroupMode("status")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                groupMode === "status"
                  ? "bg-sky-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Por Status
            </button>

            <button
              type="button"
              onClick={() => setGroupMode("priority")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                groupMode === "priority"
                  ? "bg-sky-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Por Prioridade
            </button>
          </div>
        </div>
      </div>

      {/* MODO 1: TABELA UNIFICADA (MONDAY GRID TRADICIONAL) */}
      {groupMode === "unified" && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl overflow-hidden shadow-sm">
          {/* Cabeçalho da Grade */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_#38bdf8]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                Todas as Demandas do Projeto
              </h2>
              <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                ({filteredTasks.length} {filteredTasks.length === 1 ? "tarefa" : "tarefas"})
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {percentDone}% Concluído
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/60 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold select-none">
                  <th className="py-2.5 px-3 w-10 text-center"></th>
                  <th className="py-2.5 px-3">Tarefa</th>
                  <th className="py-2.5 px-3 w-36 text-center">Status</th>
                  <th className="py-2.5 px-3 w-36 text-center">Responsável</th>
                  <th className="py-2.5 px-3 w-32 text-center">Prioridade</th>
                  <th className="py-2.5 px-3 w-28 text-center">Data Limite</th>
                  <th className="py-2.5 px-3 w-12 text-center"></th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                      {searchQuery || filterStatusId !== "all" || filterPriority !== "all"
                        ? "Nenhuma tarefa encontrada para os filtros selecionados."
                        : "Nenhuma tarefa criada ainda. Adicione uma demanda abaixo!"}
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => renderTaskRow(task))
                )}

                {/* Linha Rápida de Adição de Tarefa no Final da Tabela */}
                {canCreate && (
                  <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/10">
                    <td className="py-2.5 px-3 text-center text-slate-400">
                      <Plus className="h-4 w-4 mx-auto text-sky-400" />
                    </td>
                    <td colSpan={6} className="py-2 px-3">
                      <form onSubmit={handleCreateUnifiedTask} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="+ Adicionar nova tarefa (digite o nome e pressione Enter)..."
                          value={newQuickTitle}
                          onChange={(e) => setNewQuickTitle(e.target.value)}
                          className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 placeholder:italic py-1"
                        />
                        {newQuickTitle.trim() && (
                          <Button
                            type="submit"
                            size="sm"
                            className="h-6 px-3 text-[11px] font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg cursor-pointer shrink-0"
                          >
                            Adicionar
                          </Button>
                        )}
                      </form>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODO 2: AGRUPADO POR STATUS */}
      {groupMode === "status" && (
        <div className="space-y-4">
          {statuses.map((status) => {
            const groupTasks = filteredTasks.filter((t) => t.statusId === status.id);
            const isCollapsed = Boolean(collapsedGroups[status.id]);

            return (
              <div
                key={status.id}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl overflow-hidden shadow-sm"
              >
                {/* Header do Grupo com Cor à Esquerda */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/40"
                  style={{ borderLeftColor: status.color, borderLeftWidth: "4px" }}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedGroups((prev) => ({
                          ...prev,
                          [status.id]: !prev[status.id],
                        }))
                      }
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title={isCollapsed ? "Expandir grupo" : "Recolher grupo"}
                    >
                      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.name}
                    </span>
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                      {groupTasks.length} {groupTasks.length === 1 ? "item" : "itens"}
                    </span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/60 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold select-none">
                          <th className="py-2 px-3 w-10 text-center"></th>
                          <th className="py-2 px-3">Tarefa</th>
                          <th className="py-2 px-3 w-36 text-center">Status</th>
                          <th className="py-2 px-3 w-36 text-center">Responsável</th>
                          <th className="py-2 px-3 w-32 text-center">Prioridade</th>
                          <th className="py-2 px-3 w-28 text-center">Data Limite</th>
                          <th className="py-2 px-3 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupTasks.map((task) => renderTaskRow(task))}

                        {/* Linha Inline de Criação Rápida */}
                        {canCreate && (
                          <tr className="bg-slate-50/50 dark:bg-white/[0.02]">
                            <td className="py-2 px-3 text-center text-slate-400">
                              <Plus className="h-3.5 w-3.5 mx-auto" />
                            </td>
                            <td colSpan={6} className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder={`+ Adicionar tarefa em "${status.name}" (pressione Enter)...`}
                                  value={newTitleByGroup[status.id] || ""}
                                  onChange={(e) =>
                                    setNewTitleByGroup((prev) => ({
                                      ...prev,
                                      [status.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleCreateGroupTask(status.id, status.id);
                                    }
                                  }}
                                  className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 placeholder:italic py-0.5"
                                />
                                {newTitleByGroup[status.id]?.trim() && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleCreateGroupTask(status.id, status.id)}
                                    className="h-6 px-2.5 text-[11px] font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg cursor-pointer shrink-0"
                                  >
                                    Adicionar
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODO 3: AGRUPADO POR PRIORIDADE */}
      {groupMode === "priority" && (
        <div className="space-y-4">
          {PRIORITY_OPTIONS.map((priority) => {
            const groupTasks = filteredTasks.filter((t) => t.priority === priority.id);
            const isCollapsed = Boolean(collapsedGroups[priority.id]);

            return (
              <div
                key={priority.id}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl overflow-hidden shadow-sm"
              >
                {/* Header do Grupo com Cor de Prioridade */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/40"
                  style={{ borderLeftColor: priority.color, borderLeftWidth: "4px" }}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedGroups((prev) => ({
                          ...prev,
                          [priority.id]: !prev[priority.id],
                        }))
                      }
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title={isCollapsed ? "Expandir grupo" : "Recolher grupo"}
                    >
                      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white flex items-center gap-1 shadow-xs"
                      style={{ backgroundColor: priority.color }}
                    >
                      <priority.icon className="h-3 w-3" />
                      {priority.label}
                    </span>
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                      {groupTasks.length} {groupTasks.length === 1 ? "item" : "itens"}
                    </span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/60 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold select-none">
                          <th className="py-2 px-3 w-10 text-center"></th>
                          <th className="py-2 px-3">Tarefa</th>
                          <th className="py-2 px-3 w-36 text-center">Status</th>
                          <th className="py-2 px-3 w-36 text-center">Responsável</th>
                          <th className="py-2 px-3 w-32 text-center">Prioridade</th>
                          <th className="py-2 px-3 w-28 text-center">Data Limite</th>
                          <th className="py-2 px-3 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupTasks.map((task) => renderTaskRow(task))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Barra de Totais / Rodapé Monday Style */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-[#0c1830]/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {totalTasks} {totalTasks === 1 ? "demanda no total" : "demandas no total"}
          </span>
          <span className="text-emerald-500 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            {percentDone}% concluído
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {statuses.map((s) => {
              const count = tasks.filter((t) => t.statusId === s.id).length;
              return (
                <span
                  key={s.id}
                  className="px-2 py-0.5 rounded-md border text-slate-700 dark:text-slate-300"
                  style={{ borderColor: `${s.color}40`, backgroundColor: `${s.color}15` }}
                >
                  {s.name}: <strong>{count}</strong>
                </span>
              );
            })}
          </div>
        </div>
        <div className="text-[11px] font-mono text-slate-400 shrink-0">
          MedHit Tasks by Integrações & Automações
        </div>
      </div>
    </div>
  );
}
