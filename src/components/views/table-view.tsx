/**
 * MedHit Integrações & Automações
 * Tabela Interativa de Demandas - Monday.com Board Experience.
 *
 * Visão completa e elegante estilo Monday.com:
 * - Visão Monday por padrão: "Demandas em Aberto" e "Demandas Concluídas" com barra colorida
 * - Coluna de Status interativa: botões retangulares sólidos com seletor em grade de cores vibrantes
 * - Coluna de Responsável com seletor rápido de colaboradores
 * - Coluna de Prioridade com pills visuais e menu seletor
 * - Coluna de Prazos inteligentes ("Hoje", "Amanhã", "Xd atrasada", data formatada) com edição instantânea
 * - Edição inline de títulos (duplo clique ou ícone de edição)
 * - Criação de tarefas em fluxo contínuo (pressione Enter para criar e continuar digitando)
 * - Battery Meter: régua segmentada de progresso no rodapé da coluna de Status
 * - Alternância de Modos: Visão Monday, Grade Geral, Por Status, Por Prioridade
 * - Filtros rápidos por texto, status e prioridade
 *
 * Autoria e Assinatura: Lagana Flow / MedHit Integrações & Automações
 */

"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  Layers,
  Calendar,
  Sparkles,
  CheckSquare,
  ArrowRight,
  ListFilter,
  BarChart2,
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

type ViewMode = "monday" | "unified" | "status" | "priority";

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

  // Filtros e Modo de Visualização
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatusId, setFilterStatusId] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("monday");

  // Menus interativos suspensos (dropdowns ativos)
  const [activeStatusMenu, setActiveStatusMenu] = useState<string | null>(null);
  const [activePriorityMenu, setActivePriorityMenu] = useState<string | null>(null);
  const [activeAssigneeMenu, setActiveAssigneeMenu] = useState<string | null>(null);

  // Grupos colapsados
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    done: false,
  });

  // Edição inline de título
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  // Edição inline de data limite
  const [editingDateTaskId, setEditingDateTaskId] = useState<string | null>(null);

  // Inputs inline de nova tarefa por chave de grupo
  const [inlineInputs, setInlineInputs] = useState<Record<string, string>>({});
  const inlineInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Status de conclusão
  const doneCategoryStatuses = statuses.filter((s) => s.category === "done");
  const doneStatusId = doneCategoryStatuses[0]?.id || statuses[statuses.length - 1]?.id || "";
  const initialStatusId = statuses[0]?.id || "";

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

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveStatusMenu(null);
      setActivePriorityMenu(null);
      setActiveAssigneeMenu(null);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const handleToggleDone = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!canEdit) return;

    const currentStatus = statuses.find((s) => s.id === task.statusId);
    if (currentStatus?.category === "done") {
      if (initialStatusId) {
        moveTask(task.id, initialStatusId);
        toast.info(`Demanda "${task.title}" reaberta`);
      }
    } else if (doneStatusId) {
      moveTask(task.id, doneStatusId);
      toast.success(`Demanda "${task.title}" concluída!`);
    }
  };

  const handleCreateTaskInGroup = (groupKey: string, defaultStatusId: string) => {
    const title = (inlineInputs[groupKey] || "").trim();
    if (!title || !canCreate) return;

    createTask({
      title,
      statusId: defaultStatusId,
      projectId: projectId || currentProject?.id,
      areaId: areaId || currentArea?.id,
      priority: filterPriority !== "all" ? (filterPriority as Task["priority"]) : "medium",
      taskType: "task",
    });

    setInlineInputs((prev) => ({ ...prev, [groupKey]: "" }));
    toast.success("Demanda criada com sucesso!");

    // Mantém o foco no input para digitação contínua e rápida
    setTimeout(() => {
      inlineInputRefs.current[groupKey]?.focus();
    }, 50);
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

  // Renderizador de Linha de Tarefa estilo Monday.com
  const renderTaskRow = (task: Task, rowIndex: number, totalRowsInGroup: number, groupAccentColor: string) => {
    const taskStatus = statuses.find((s) => s.id === task.statusId) || statuses[0] || {
      id: "unknown",
      name: "A Fazer",
      color: "#64748b",
      category: "todo" as const,
    };
    const priorityCfg = PRIORITY_OPTIONS.find((p) => p.id === task.priority) || PRIORITY_OPTIONS[4];
    const dueInfo = formatDueDate(task.dueDate);
    const isDone = taskStatus.category === "done";

    // Detecta se a linha está na metade inferior do grupo para abrir os menus para cima e evitar clipping
    const openUpwards = totalRowsInGroup > 2 && rowIndex >= totalRowsInGroup - 2;

    return (
      <tr
        key={task.id}
        onClick={() => onTaskClick(task)}
        className="h-10 hover:bg-sky-500/5 dark:hover:bg-sky-500/[0.04] transition-colors cursor-pointer group border-b border-slate-100 dark:border-white/[0.05]"
      >
        {/* Borda lateral colorida no estilo Monday + Checkbox */}
        <td
          className="py-1.5 px-3 text-center w-10 relative"
          style={{ borderLeft: `4px solid ${groupAccentColor}` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => handleToggleDone(e, task)}
            className={cn(
              "h-4 w-4 rounded border transition-all flex items-center justify-center cursor-pointer mx-auto",
              isDone
                ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-xs"
                : "border-slate-300 dark:border-white/20 hover:border-sky-500 group-hover:border-slate-400"
            )}
            title={isDone ? "Reabrir demanda" : "Marcar como concluída"}
          >
            {isDone && <Check className="h-3 w-3 stroke-[3]" />}
          </button>
        </td>

        {/* Título da Demanda com Edição Inline */}
        <td
          className="py-1.5 px-3 font-medium text-slate-800 dark:text-slate-200 group-hover:text-sky-500 transition-colors"
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
                  "cursor-pointer truncate max-w-lg select-text",
                  isDone && "line-through text-slate-400 dark:text-slate-500"
                )}
                title="Clique para abrir detalhes, clique duas vezes para editar o nome"
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
                  title="Editar nome da demanda"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </td>

        {/* Coluna de Status Interativo (Monday.com Signature Solid Tile) */}
        <td className="py-1 px-2.5 text-center w-36 relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              if (!canEdit) return;
              setActiveStatusMenu(activeStatusMenu === task.id ? null : task.id);
              setActivePriorityMenu(null);
              setActiveAssigneeMenu(null);
            }}
            className={cn(
              "w-full h-7 rounded-md text-[11px] font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1.5 px-2",
              canEdit ? "hover:brightness-110 hover:shadow-md cursor-pointer" : "cursor-default"
            )}
            style={{ backgroundColor: taskStatus.color || "#64748b" }}
          >
            <span className="truncate">{taskStatus.name}</span>
            {canEdit && <ChevronDown className="h-3 w-3 opacity-80 shrink-0" />}
          </button>

          {/* Paleta Suspensa de Status Estilo Monday.com */}
          {activeStatusMenu === task.id && (
            <div
              className={cn(
                "absolute left-1 right-1 z-50 bg-white dark:bg-[#081226] border border-slate-200 dark:border-sky-500/30 rounded-xl shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100",
                openUpwards ? "bottom-full mb-1" : "top-full mt-1"
              )}
            >
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold px-2 py-0.5 text-left">
                Alterar Status
              </div>
              <div className="grid grid-cols-1 gap-1">
                {statuses.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      moveTask(task.id, s.id);
                      setActiveStatusMenu(null);
                      toast.success(`Status alterado para: ${s.name}`);
                    }}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-white transition-transform hover:scale-[1.02] shadow-xs cursor-pointer"
                    style={{ backgroundColor: s.color }}
                  >
                    <span className="truncate">{s.name}</span>
                    {task.statusId === s.id && <Check className="h-3.5 w-3.5 stroke-[3] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </td>

        {/* Coluna de Responsável Interativo */}
        <td className="py-1 px-2.5 text-center w-36 relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              if (!canEdit) return;
              setActiveAssigneeMenu(activeAssigneeMenu === task.id ? null : task.id);
              setActiveStatusMenu(null);
              setActivePriorityMenu(null);
            }}
            className={cn(
              "w-full h-7 flex items-center justify-center gap-1.5 px-2 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-700 dark:text-slate-300 transition-colors",
              canEdit ? "hover:border-sky-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" : "cursor-default"
            )}
          >
            {task.assigneeIds.length > 0 ? (
              <>
                <img
                  src={task.assigneeIds[0].avatarUrl}
                  alt={task.assigneeIds[0].name}
                  className="h-4 w-4 rounded-full object-cover shrink-0 ring-1 ring-sky-400/40"
                />
                <span className="truncate max-w-[85px] font-medium">{task.assigneeIds[0].name.split(" ")[0]}</span>
              </>
            ) : (
              <span className="text-slate-400 italic flex items-center gap-1 text-[10px]">
                <UserPlus className="h-3 w-3" /> Atribuir
              </span>
            )}
          </button>

          {/* Dropdown de Responsáveis */}
          {activeAssigneeMenu === task.id && (
            <div
              className={cn(
                "absolute left-0 right-0 z-50 bg-white dark:bg-[#081226] border border-slate-200 dark:border-sky-500/30 rounded-xl shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 max-h-48 overflow-y-auto",
                openUpwards ? "bottom-full mb-1" : "top-full mt-1"
              )}
            >
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold px-2 py-0.5 text-left">
                Colaboradores
              </div>
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
                      toast.success(`${m.name} ${isAssigned ? "removido" : "atribuído"}`);
                    }}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-sky-500/10 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img src={m.avatarUrl} alt={m.name} className="h-4 w-4 rounded-full object-cover shrink-0" />
                      <span className="text-slate-700 dark:text-slate-200 truncate">{m.name}</span>
                    </div>
                    {isAssigned && <Check className="h-3.5 w-3.5 text-sky-400 stroke-[3] shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}
        </td>

        {/* Coluna de Prioridade Interativa */}
        <td className="py-1 px-2.5 text-center w-32 relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              if (!canEdit) return;
              setActivePriorityMenu(activePriorityMenu === task.id ? null : task.id);
              setActiveStatusMenu(null);
              setActiveAssigneeMenu(null);
            }}
            className={cn(
              "w-full h-7 rounded-md text-[11px] font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1.5 px-2",
              canEdit ? "hover:brightness-110 hover:shadow-md cursor-pointer" : "cursor-default"
            )}
            style={{ backgroundColor: priorityCfg.color }}
          >
            <priorityCfg.icon className="h-3 w-3 shrink-0" />
            <span className="truncate">{priorityCfg.label}</span>
          </button>

          {/* Paleta Suspensa de Prioridades */}
          {activePriorityMenu === task.id && (
            <div
              className={cn(
                "absolute left-1 right-1 z-50 bg-white dark:bg-[#081226] border border-slate-200 dark:border-sky-500/30 rounded-xl shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100",
                openUpwards ? "bottom-full mb-1" : "top-full mt-1"
              )}
            >
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold px-2 py-0.5 text-left">
                Definir Prioridade
              </div>
              <div className="grid grid-cols-1 gap-1">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      updateTask(task.id, { priority: p.id });
                      setActivePriorityMenu(null);
                      toast.success(`Prioridade: ${p.label}`);
                    }}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-white transition-transform hover:scale-[1.02] shadow-xs cursor-pointer"
                    style={{ backgroundColor: p.color }}
                  >
                    <div className="flex items-center gap-1.5">
                      <p.icon className="h-3 w-3 shrink-0" />
                      <span>{p.label}</span>
                    </div>
                    {task.priority === p.id && <Check className="h-3.5 w-3.5 stroke-[3] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </td>

        {/* Coluna de Data Limite com Edição Rápida */}
        <td className="py-1 px-2.5 text-center w-28" onClick={(e) => e.stopPropagation()}>
          {editingDateTaskId === task.id ? (
            <input
              type="date"
              autoFocus
              value={task.dueDate?.split("T")[0] || ""}
              onChange={(e) => {
                updateTask(task.id, { dueDate: e.target.value || undefined });
                setEditingDateTaskId(null);
                toast.success("Prazo atualizado");
              }}
              onBlur={() => setEditingDateTaskId(null)}
              className="bg-white dark:bg-slate-900 border border-sky-500 rounded px-1.5 py-0.5 text-[11px] text-slate-900 dark:text-white outline-none shadow-xs w-full"
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
              title={canEdit ? "Clique para alterar a data de entrega" : undefined}
            >
              {dueInfo ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border shadow-2xs",
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

        {/* Coluna de Ações Rápidas */}
        <td className="py-1 px-2.5 text-center w-12" onClick={(e) => e.stopPropagation()}>
          {canDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Deseja excluir a demanda "${task.title}"?`)) {
                  deleteTask(task.id);
                  toast.success("Demanda excluída");
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
              title="Excluir demanda"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </td>
      </tr>
    );
  };

  // Renderizador da Barra de Bateria (Monday Battery Meter) no rodapé do grupo
  const renderBatteryMeter = (groupTasks: Task[]) => {
    if (groupTasks.length === 0) return null;

    return (
      <div
        className="w-full h-3 rounded-md overflow-hidden flex bg-slate-200 dark:bg-slate-800 shadow-2xs"
        title="Distribuição de Status (Monday Battery Meter)"
      >
        {statuses.map((s) => {
          const count = groupTasks.filter((t) => t.statusId === s.id).length;
          const pct = Math.round((count / groupTasks.length) * 100);
          if (pct === 0) return null;

          return (
            <div
              key={s.id}
              style={{ width: `${pct}%`, backgroundColor: s.color }}
              className="h-full transition-all duration-300 hover:brightness-110"
              title={`${s.name}: ${count} (${pct}%)`}
            />
          );
        })}
      </div>
    );
  };

  // Renderizador de um Grupo Coeso no estilo Monday.com
  const renderGroupSection = (
    groupKey: string,
    groupTitle: string,
    accentColor: string,
    groupTasks: Task[],
    defaultStatusId: string,
    emptyMessage: string
  ) => {
    const isCollapsed = Boolean(collapsedGroups[groupKey]);
    const groupPercent = groupTasks.length > 0
      ? Math.round((groupTasks.filter((t) => statuses.find((s) => s.id === t.statusId)?.category === "done").length / groupTasks.length) * 100)
      : 0;

    return (
      <div
        key={groupKey}
        className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0c1830]/85 backdrop-blur-xl overflow-hidden shadow-sm transition-all"
      >
        {/* Barra de Título do Grupo Estilo Monday */}
        <div
          className="px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/40"
          style={{ borderLeft: `6px solid ${accentColor}` }}
        >
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                setCollapsedGroups((prev) => ({
                  ...prev,
                  [groupKey]: !prev[groupKey],
                }))
              }
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title={isCollapsed ? "Expandir grupo" : "Recolher grupo"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <span
              className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ color: accentColor }}
            >
              <span>{groupTitle}</span>
            </span>

            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-semibold">
              {groupTasks.length} {groupTasks.length === 1 ? "demanda" : "demandas"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {groupTasks.length > 0 && (
              <span className="text-emerald-500 font-bold flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="h-3 w-3" />
                {groupPercent}% feito
              </span>
            )}
          </div>
        </div>

        {/* Tabela do Grupo */}
        {!isCollapsed && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold select-none">
                  <th className="py-2 px-3 w-10 text-center"></th>
                  <th className="py-2 px-3">Demanda / Tarefa</th>
                  <th className="py-2 px-3 w-36 text-center">Status</th>
                  <th className="py-2 px-3 w-36 text-center">Responsável</th>
                  <th className="py-2 px-3 w-32 text-center">Prioridade</th>
                  <th className="py-2 px-3 w-28 text-center">Data Limite</th>
                  <th className="py-2 px-3 w-12 text-center"></th>
                </tr>
              </thead>

              <tbody>
                {groupTasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs italic"
                      style={{ borderLeft: `4px solid ${accentColor}` }}
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  groupTasks.map((task, idx) => renderTaskRow(task, idx, groupTasks.length, accentColor))
                )}

                {/* Linha Inline de Criação Rápida */}
                {canCreate && (
                  <tr className="bg-slate-50/40 dark:bg-white/[0.01] border-t border-slate-200/60 dark:border-white/5">
                    <td
                      className="py-2 px-3 text-center text-slate-400"
                      style={{ borderLeft: `4px solid ${accentColor}` }}
                    >
                      <Plus className="h-4 w-4 mx-auto text-sky-400" />
                    </td>
                    <td colSpan={6} className="py-1.5 px-3">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleCreateTaskInGroup(groupKey, defaultStatusId);
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          ref={(el) => {
                            inlineInputRefs.current[groupKey] = el;
                          }}
                          type="text"
                          placeholder={`+ Adicionar nova demanda em "${groupTitle}" (digite e pressione Enter)...`}
                          value={inlineInputs[groupKey] || ""}
                          onChange={(e) =>
                            setInlineInputs((prev) => ({
                              ...prev,
                              [groupKey]: e.target.value,
                            }))
                          }
                          className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 placeholder:italic py-1"
                        />
                        {(inlineInputs[groupKey] || "").trim() && (
                          <Button
                            type="submit"
                            size="sm"
                            className="h-6 px-3 text-[11px] font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg cursor-pointer shrink-0 shadow-xs"
                          >
                            Adicionar
                          </Button>
                        )}
                      </form>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Rodapé do Grupo com Medidor de Bateria Monday */}
              {groupTasks.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100/30 dark:bg-slate-950/30 border-t border-slate-200 dark:border-white/10">
                    <td className="py-2 px-3" style={{ borderLeft: `4px solid ${accentColor}` }}></td>
                    <td className="py-2 px-3 text-[10px] font-mono text-slate-400 font-semibold">
                      Total do Grupo: {groupTasks.length}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {renderBatteryMeter(groupTasks)}
                    </td>
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Barra de Ferramentas da Grade Monday (Filtros, Busca & Modos) */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Esquerda: Campo de Busca e Filtros Rápidos */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Input de Busca */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar demandas..."
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

        {/* Direita: Modos de Visualização Monday */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="h-3 w-3 text-sky-400" />
            <span>Exibição:</span>
          </span>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("monday")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "monday"
                  ? "bg-sky-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Visão Monday
            </button>

            <button
              type="button"
              onClick={() => setViewMode("unified")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "unified"
                  ? "bg-sky-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Grade Geral
            </button>

            <button
              type="button"
              onClick={() => setViewMode("status")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "status"
                  ? "bg-sky-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Por Status
            </button>

            <button
              type="button"
              onClick={() => setViewMode("priority")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "priority"
                  ? "bg-sky-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Por Prioridade
            </button>
          </div>
        </div>
      </div>

      {/* MODO 1: VISÃO MONDAY PADRÃO (Demandas em Aberto & Concluídas) */}
      {viewMode === "monday" && (
        <div className="space-y-5">
          {/* Grupo 1: Demandas em Aberto */}
          {(() => {
            const openTasks = filteredTasks.filter((t) => {
              const s = statuses.find((st) => st.id === t.statusId);
              return s?.category !== "done";
            });
            return renderGroupSection(
              "active",
              "Demandas em Aberto",
              "#38bdf8",
              openTasks,
              initialStatusId,
              "Nenhuma demanda em aberto no momento. Parabéns! Adicione uma nova tarefa abaixo."
            );
          })()}

          {/* Grupo 2: Demandas Concluídas */}
          {(() => {
            const completedTasks = filteredTasks.filter((t) => {
              const s = statuses.find((st) => st.id === t.statusId);
              return s?.category === "done";
            });
            return renderGroupSection(
              "done",
              "Demandas Concluídas",
              "#10b981",
              completedTasks,
              doneStatusId,
              "Nenhuma demanda concluída ainda. Marque uma tarefa como feita para vê-la aqui!"
            );
          })()}
        </div>
      )}

      {/* MODO 2: GRADE GERAL (Tabela Única com Todas as Tarefas) */}
      {viewMode === "unified" && (
        <div className="space-y-4">
          {renderGroupSection(
            "all",
            "Todas as Demandas do Projeto",
            "#6366f1",
            filteredTasks,
            initialStatusId,
            searchQuery || filterStatusId !== "all" || filterPriority !== "all"
              ? "Nenhuma demanda encontrada para os filtros selecionados."
              : "Nenhuma demanda criada ainda. Adicione uma demanda abaixo!"
          )}
        </div>
      )}

      {/* MODO 3: AGRUPADO POR STATUS (Sem tabelas desconexas com cabeçalhos redundantes) */}
      {viewMode === "status" && (
        <div className="space-y-4">
          {statuses.map((status) => {
            const groupTasks = filteredTasks.filter((t) => t.statusId === status.id);
            return renderGroupSection(
              status.id,
              status.name,
              status.color || "#64748b",
              groupTasks,
              status.id,
              `Nenhuma demanda com status "${status.name}". Adicione uma demanda abaixo!`
            );
          })}
        </div>
      )}

      {/* MODO 4: AGRUPADO POR PRIORIDADE */}
      {viewMode === "priority" && (
        <div className="space-y-4">
          {PRIORITY_OPTIONS.map((prio) => {
            const groupTasks = filteredTasks.filter((t) => t.priority === prio.id);
            return renderGroupSection(
              `prio-${prio.id}`,
              `Prioridade: ${prio.label}`,
              prio.color,
              groupTasks,
              initialStatusId,
              `Nenhuma demanda com prioridade "${prio.label}".`
            );
          })}
        </div>
      )}

      {/* Barra de Totais / Rodapé Geral Monday Style */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-[#0c1830]/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {totalTasks} {totalTasks === 1 ? "demanda no total" : "demandas no total"}
          </span>
          <span className="text-emerald-500 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            {percentDone}% concluído
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[11px] flex-wrap">
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
