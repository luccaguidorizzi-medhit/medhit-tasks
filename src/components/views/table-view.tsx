/**
 * MedHit Integrações & Automações
 * Tabela Interativa de Demandas (Monday Style).
 * 
 * Recursos:
 * - Agrupamento visual por Status com cabeçalhos coloridos
 * - Badges de Status interativos clicáveis para troca rápida
 * - Badges de Prioridade interativos clicáveis
 * - Atribuição rápida de Responsável
 * - Indicação de Prazos com alerta visual
 * - Linha rápida "+ Adicionar Tarefa" inline em cada grupo
 * - Checkbox de conclusão rápida
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useState } from "react";
import { Task, Status, Member } from "@/server/services/data-store";
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

const PRIORITY_OPTIONS: {
  id: Task["priority"];
  label: string;
  color: string;
  icon: React.ElementType;
}[] = [
  { id: "urgent", label: "Urgente", color: "#f43f5e", icon: AlertCircle },
  { id: "high", label: "Alta", color: "#f97316", icon: SignalHigh },
  { id: "medium", label: "Média", color: "#eab308", icon: SignalMedium },
  { id: "low", label: "Baixa", color: "#38bdf8", icon: SignalLow },
  { id: "none", label: "Normal", color: "#94a3b8", icon: Minus },
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

  // Menus ativos inline
  const [activeStatusMenu, setActiveStatusMenu] = useState<string | null>(null);
  const [activePriorityMenu, setActivePriorityMenu] = useState<string | null>(null);
  const [activeAssigneeMenu, setActiveAssigneeMenu] = useState<string | null>(null);

  // Estados de grupos colapsados
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Edição inline de título
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  // Edição inline de data limite
  const [editingDateTaskId, setEditingDateTaskId] = useState<string | null>(null);

  // Inputs inline de nova tarefa por grupo
  const [newTitleByStatus, setNewTitleByStatus] = useState<Record<string, string>>({});

  const doneCategoryStatuses = statuses.filter((s) => s.category === "done");
  const doneStatusId = doneCategoryStatuses[0]?.id || statuses[statuses.length - 1]?.id;

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
      // Reabre tarefa para o primeiro status
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

  const handleQuickAdd = (statusId: string) => {
    const title = (newTitleByStatus[statusId] || "").trim();
    if (!title || !canCreate) return;

    createTask({
      title,
      statusId,
      projectId: projectId || currentProject?.id,
      areaId: areaId || currentArea?.id,
      priority: "medium",
      taskType: "task",
    });

    setNewTitleByStatus((prev) => ({ ...prev, [statusId]: "" }));
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
      return { text: `${Math.abs(diffDays)}d atrasada`, color: "text-rose-500 bg-rose-500/10 border-rose-500/25" };
    }
    if (diffDays === 0) {
      return { text: "Hoje", color: "text-amber-500 bg-amber-500/10 border-amber-500/25" };
    }
    if (diffDays === 1) {
      return { text: "Amanhã", color: "text-sky-500 bg-sky-500/10 border-sky-500/25" };
    }
    return {
      text: due.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      color: "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10",
    };
  };

  return (
    <div className="space-y-6 pb-12 select-none" onClick={() => {
      setActiveStatusMenu(null);
      setActivePriorityMenu(null);
      setActiveAssigneeMenu(null);
    }}>
      {/* Grupos organizados por status */}
      {statuses.map((status) => {
        const groupTasks = tasks.filter((t) => t.statusId === status.id);

        return (
          <div
            key={status.id}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl overflow-hidden shadow-sm"
          >
            {/* Cabeçalho do Grupo */}
            <div
              className="px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-white/10"
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
                  title={collapsedGroups[status.id] ? "Expandir grupo" : "Recolher grupo"}
                >
                  {collapsedGroups[status.id] ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-900 dark:text-white"
                  style={{ backgroundColor: `${status.color}25`, border: `1px solid ${status.color}50` }}
                >
                  {status.name}
                </span>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                  {groupTasks.length} {groupTasks.length === 1 ? "item" : "itens"}
                </span>
              </div>
            </div>

            {/* Conteúdo do Grupo (Recolhido ou Tabela) */}
            {collapsedGroups[status.id] ? (
              <div className="px-5 py-3 text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50/30 dark:bg-slate-950/20">
                Grupo recolhido ({groupTasks.length} {groupTasks.length === 1 ? "tarefa" : "tarefas"})
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-white/5 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-semibold select-none">
                      <th className="py-2 px-3 w-10 text-center"></th>
                      <th className="py-2 px-3">Tarefa</th>
                      <th className="py-2 px-3 w-40 text-center">Status</th>
                      <th className="py-2 px-3 w-36 text-center">Responsável</th>
                      <th className="py-2 px-3 w-32 text-center">Prioridade</th>
                      <th className="py-2 px-3 w-28 text-center">Data Limite</th>
                      <th className="py-2 px-3 w-12 text-center"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {groupTasks.map((task) => {
                      const taskStatus = statuses.find((s) => s.id === task.statusId) || status;
                      const priorityCfg = PRIORITY_OPTIONS.find((p) => p.id === task.priority) || PRIORITY_OPTIONS[4];
                      const dueInfo = formatDueDate(task.dueDate);
                      const isDone = taskStatus.category === "done";

                      return (
                        <tr
                          key={task.id}
                          onClick={() => onTaskClick(task)}
                          className="h-11 hover:bg-sky-500/5 transition-colors cursor-pointer group"
                        >
                          {/* Checkbox de conclusão rápida */}
                          <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleToggleDone(e, task)}
                              className={cn(
                                "h-4 w-4 rounded border transition-colors flex items-center justify-center cursor-pointer",
                                isDone
                                  ? "bg-emerald-500 border-emerald-500 text-slate-950"
                                  : "border-slate-300 dark:border-white/20 hover:border-sky-500"
                              )}
                              title={isDone ? "Reabrir tarefa" : "Marcar como concluída"}
                            >
                              {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                            </button>
                          </td>

                          {/* Título da Demanda com Edição Inline */}
                          <td
                            className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200 group-hover:text-sky-500 transition-colors"
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
                                  className="w-full bg-white dark:bg-slate-900 border border-sky-500 rounded px-2 py-0.5 text-xs text-slate-900 dark:text-white outline-none"
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
                                    "cursor-pointer",
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

                        {/* Badge de Status Interativo (Monday Style) */}
                        <td className="py-2 px-3 text-center relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!canEdit) return;
                              setActiveStatusMenu(activeStatusMenu === task.id ? null : task.id);
                              setActivePriorityMenu(null);
                              setActiveAssigneeMenu(null);
                            }}
                            className={cn(
                              "w-full py-1 px-2.5 rounded-lg text-[11px] font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1",
                              canEdit ? "hover:opacity-90 cursor-pointer" : "cursor-default"
                            )}
                            style={{ backgroundColor: taskStatus.color || "#64748b" }}
                          >
                            <span className="truncate">{taskStatus.name}</span>
                            {canEdit && <ChevronDown className="h-3 w-3 opacity-70" />}
                          </button>

                          {/* Dropdown de Status */}
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
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                                  <span className="text-slate-700 dark:text-slate-200">{s.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Responsável Interativo */}
                        <td className="py-2 px-3 text-center relative" onClick={(e) => e.stopPropagation()}>
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
                                  className="h-4 w-4 rounded-full object-cover"
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
                                    <div className="flex items-center gap-2">
                                      <img src={m.avatarUrl} alt={m.name} className="h-4 w-4 rounded-full object-cover" />
                                      <span className="text-slate-700 dark:text-slate-200">{m.name}</span>
                                    </div>
                                    {isAssigned && <Check className="h-3 w-3 text-sky-500" />}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Prioridade Interativa (Monday Style) */}
                        <td className="py-2 px-3 text-center relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!canEdit) return;
                              setActivePriorityMenu(activePriorityMenu === task.id ? null : task.id);
                              setActiveStatusMenu(null);
                              setActiveAssigneeMenu(null);
                            }}
                            className={cn(
                              "w-full py-1 px-2 rounded-lg text-[11px] font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1",
                              canEdit ? "hover:opacity-90 cursor-pointer" : "cursor-default"
                            )}
                            style={{ backgroundColor: priorityCfg.color }}
                          >
                            <priorityCfg.icon className="h-3 w-3" />
                            <span>{priorityCfg.label}</span>
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
                                  <p.icon className="h-3 w-3" style={{ color: p.color }} />
                                  <span className="text-slate-700 dark:text-slate-200">{p.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Data Limite com Edição Inline */}
                        <td
                          className="py-2 px-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                              className="bg-white dark:bg-slate-900 border border-sky-500 rounded px-1.5 py-0.5 text-[11px] text-slate-900 dark:text-white outline-none"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (canEdit) setEditingDateTaskId(task.id);
                              }}
                              className={cn(
                                "cursor-pointer transition-transform hover:scale-105",
                                !canEdit && "cursor-default"
                              )}
                              title={canEdit ? "Clique para alterar o prazo diretamente" : undefined}
                            >
                              {dueInfo ? (
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                                    dueInfo.color
                                  )}
                                >
                                  <Clock className="h-2.5 w-2.5" />
                                  {dueInfo.text}
                                </span>
                              ) : (
                                <span className="text-slate-400 hover:text-sky-500 font-mono text-[10px]">
                                  + Data
                                </span>
                              )}
                            </button>
                          )}
                        </td>

                        {/* Ações (Excluir) */}
                        <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
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
                  })}

                  {/* Linha Inline de Criação Rápida no final do grupo */}
                  {canCreate && (
                    <tr className="bg-slate-50/40 dark:bg-white/[0.01]">
                      <td className="py-2 px-3 text-center text-slate-400">
                        <Plus className="h-3.5 w-3.5 mx-auto" />
                      </td>
                      <td colSpan={6} className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`+ Adicionar tarefa em "${status.name}" (pressione Enter)...`}
                            value={newTitleByStatus[status.id] || ""}
                            onChange={(e) =>
                              setNewTitleByStatus((prev) => ({
                                ...prev,
                                [status.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleQuickAdd(status.id);
                              }
                            }}
                            className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 placeholder:italic py-0.5"
                          />
                          {newTitleByStatus[status.id]?.trim() && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleQuickAdd(status.id)}
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

      {/* Barra de Totais / Rodapé */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-[#0c1830]/60 p-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {totalTasks} {totalTasks === 1 ? "demanda no total" : "demandas no total"}
          </span>
          <span className="text-emerald-500 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            {percentDone}% concluído
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          MedHit Tasks by Integrações & Automações
        </div>
      </div>
    </div>
  );
}
