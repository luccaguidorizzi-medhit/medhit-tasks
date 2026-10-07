"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Bot,
  FileText,
  Clock,
  CheckSquare,
  Plus,
  AlertCircle,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Minus,
  SlidersHorizontal,
  Users,
  Layers,
  Sparkles,
  ChevronsUpDown,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Status, Task } from "@/server/services/data-store";
import { EducationalTooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GroupByOption = "status" | "priority" | "assignee";

interface ListViewProps {
  statuses: Status[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onQuickAddTask: (statusId: string, title: string, priority?: Task["priority"]) => void;
}

interface GroupData {
  id: string;
  name: string;
  color?: string;
  avatarUrl?: string;
  icon?: React.ElementType;
  tasks: Task[];
  totalPoints: number;
  statusId?: string;
  priority?: Task["priority"];
}

/**
 * Visão em Lista Avançada com Agrupamentos Dinâmicos e Totalizadores
 * Mantido com precisão pela equipe MedHit Integrações & Automações
 */
export function ListView({
  statuses,
  tasks,
  onTaskClick,
  onQuickAddTask,
}: ListViewProps) {
  const [groupBy, setGroupBy] = useState<GroupByOption>("status");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [quickInputGroup, setQuickInputGroup] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    groups.forEach((g) => {
      allCollapsed[g.id] = true;
    });
    setCollapsedGroups(allCollapsed);
  };

  const expandAll = () => {
    setCollapsedGroups({});
  };

  // Ícones de Prioridade
  const renderPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <span title="Urgente"><AlertCircle className="h-3.5 w-3.5 text-rose-500" /></span>;
      case "high":
        return <span title="Alta"><SignalHigh className="h-3.5 w-3.5 text-amber-500" /></span>;
      case "medium":
        return <span title="Média"><SignalMedium className="h-3.5 w-3.5 text-sky-400" /></span>;
      case "low":
        return <span title="Baixa"><SignalLow className="h-3.5 w-3.5 text-slate-400" /></span>;
      default:
        return <span title="Nenhuma"><Minus className="h-3.5 w-3.5 text-slate-300 dark:text-zinc-600" /></span>;
    }
  };

  // Cálculo dos Grupos Dinâmicos
  const groups: GroupData[] = useMemo(() => {
    if (groupBy === "status") {
      return statuses.map((status) => {
        const groupTasks = tasks.filter((t) => t.statusId === status.id);
        const totalPoints = groupTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
        return {
          id: status.id,
          name: status.name,
          color: status.color,
          tasks: groupTasks,
          totalPoints,
          statusId: status.id,
        };
      });
    }

    if (groupBy === "priority") {
      const priorityConfigs: { priority: Task["priority"]; name: string; color: string }[] = [
        { priority: "urgent", name: "Urgente", color: "#f43f5e" },
        { priority: "high", name: "Alta Prioridade", color: "#f59e0b" },
        { priority: "medium", name: "Média Prioridade", color: "#38bdf8" },
        { priority: "low", name: "Baixa Prioridade", color: "#94a3b8" },
        { priority: "none", name: "Sem Prioridade", color: "#64748b" },
      ];

      return priorityConfigs.map((cfg) => {
        const groupTasks = tasks.filter((t) => t.priority === cfg.priority);
        const totalPoints = groupTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
        return {
          id: `prio-${cfg.priority}`,
          name: cfg.name,
          color: cfg.color,
          tasks: groupTasks,
          totalPoints,
          statusId: statuses[0]?.id,
          priority: cfg.priority,
        };
      });
    }

    if (groupBy === "assignee") {
      // Coleta todos os responsáveis distintos
      const assigneeMap = new Map<string, { id: string; name: string; avatarUrl?: string; type: string }>();

      tasks.forEach((t) => {
        if (t.assigneeIds.length === 0) {
          assigneeMap.set("unassigned", {
            id: "unassigned",
            name: "Não Atribuído",
            type: "none",
          });
        } else {
          t.assigneeIds.forEach((a) => {
            if (!assigneeMap.has(a.id)) {
              assigneeMap.set(a.id, {
                id: a.id,
                name: a.name,
                avatarUrl: a.avatarUrl,
                type: a.type,
              });
            }
          });
        }
      });

      if (!assigneeMap.has("unassigned")) {
        assigneeMap.set("unassigned", {
          id: "unassigned",
          name: "Não Atribuído",
          type: "none",
        });
      }

      return Array.from(assigneeMap.values()).map((assignee) => {
        const groupTasks = tasks.filter((t) => {
          if (assignee.id === "unassigned") {
            return t.assigneeIds.length === 0;
          }
          return t.assigneeIds.some((a) => a.id === assignee.id);
        });

        const totalPoints = groupTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);

        return {
          id: `ass-${assignee.id}`,
          name: assignee.name,
          color: assignee.type === "agent" ? "#a855f7" : "#38bdf8",
          avatarUrl: assignee.avatarUrl,
          tasks: groupTasks,
          totalPoints,
          statusId: statuses[0]?.id,
        };
      });
    }

    return [];
  }, [groupBy, statuses, tasks]);

  // Totalizadores Globais
  const totalTasks = tasks.length;
  const totalStoryPoints = useMemo(() => {
    return tasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  }, [tasks]);

  const completedTasksCount = useMemo(() => {
    return tasks.filter((t) => {
      const statusObj = statuses.find((s) => s.id === t.statusId);
      return statusObj?.category === "done";
    }).length;
  }, [tasks, statuses]);

  const agentTasksCount = useMemo(() => {
    return tasks.filter((t) => t.taskType === "agent_task").length;
  }, [tasks]);

  const handleQuickAddSubmit = (group: GroupData) => {
    if (!quickTitle.trim()) return;
    const targetStatus = group.statusId || statuses[0]?.id || "";
    onQuickAddTask(targetStatus, quickTitle.trim(), group.priority);
    setQuickTitle("");
    setQuickInputGroup(null);
  };

  return (
    <div className="space-y-4 select-none">
      {/* Barra de Controle de Agrupamento & Métricas Resumidas */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Seletor de Agrupamento Dinâmico */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-sky-400" />
            <span>Agrupamento:</span>
          </span>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setGroupBy("status")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                groupBy === "status"
                  ? "bg-sky-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Agrupar por Status
            </button>

            <button
              onClick={() => setGroupBy("priority")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                groupBy === "priority"
                  ? "bg-sky-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Agrupar por Prioridade
            </button>

            <button
              onClick={() => setGroupBy("assignee")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                groupBy === "assignee"
                  ? "bg-sky-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Agrupar por Responsável
            </button>
          </div>
        </div>

        {/* Totalizadores Globais & Botões de Expandir/Colapsar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Métricas Globais Pills */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300">
              Total: <strong>{totalTasks}</strong>
            </span>
            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Concluídas: <strong>{completedTasksCount}</strong>
            </span>
            <span className="px-2 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Pts: <strong>{totalStoryPoints}</strong>
            </span>
            {agentTasksCount > 0 && (
              <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                <Bot className="h-3 w-3" />
                <span>{agentTasksCount} IA</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-white/10 pl-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAll}
              className="h-7 px-2 text-[11px] text-slate-400 hover:text-sky-400 cursor-pointer"
            >
              Expandir
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="h-7 px-2 text-[11px] text-slate-400 hover:text-sky-400 cursor-pointer"
            >
              Colapsar
            </Button>
          </div>
        </div>
      </div>

      {/* Contêiner de Grupos */}
      <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20 divide-y divide-slate-100 dark:divide-white/[0.06]">
        {groups.map((group) => {
          const isCollapsed = !!collapsedGroups[group.id];
          const isAdding = quickInputGroup === group.id;

          return (
            <div key={group.id} className="select-none">
              {/* Header do Grupo com Totalizadores */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/70 dark:bg-slate-950/60 hover:bg-slate-200/50 dark:hover:bg-white/[0.04] transition-colors border-b border-slate-200 dark:border-white/[0.06]">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer group"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-400 transition-colors" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-400 transition-colors" />
                  )}

                  {/* Avatar se for responsável ou bolinha de cor */}
                  {group.avatarUrl ? (
                    <img
                      src={group.avatarUrl}
                      alt={group.name}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: group.color || "#38bdf8" }}
                    />
                  )}

                  <span>{group.name}</span>

                  {/* Totalizador de Tarefas do Grupo */}
                  <span className="font-mono text-[10px] text-slate-400 font-normal">
                    ({group.tasks.length} {group.tasks.length === 1 ? "tarefa" : "tarefas"})
                  </span>

                  {/* Totalizador de Story Points do Grupo */}
                  {group.totalPoints > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/5 font-semibold">
                      {group.totalPoints} pts
                    </span>
                  )}
                </button>

                {/* Botão Adicionar Tarefa Rápida no Grupo */}
                <button
                  onClick={() => {
                    setQuickInputGroup(isAdding ? null : group.id);
                    setQuickTitle("");
                  }}
                  className="h-6 w-6 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 flex items-center justify-center transition-colors cursor-pointer"
                  title={`Adicionar tarefa em ${group.name}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Input Inline de Adição Rápida */}
              {isAdding && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/5 flex items-center gap-2 animate-in fade-in">
                  <input
                    autoFocus
                    type="text"
                    placeholder={`+ Adicionar tarefa em "${group.name}"...`}
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleQuickAddSubmit(group);
                      if (e.key === "Escape") setQuickInputGroup(null);
                    }}
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs outline-none text-slate-900 dark:text-white"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleQuickAddSubmit(group)}
                    className="h-7 px-2.5 text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                  >
                    Adicionar
                  </Button>
                </div>
              )}

              {/* Linhas de Tarefa do Grupo */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {group.tasks.map((task) => {
                    const taskIdShort = task.id.replace("task-", "");
                    const completedChecklist = task.checklists
                      .flatMap((c) => c.items)
                      .filter((i) => i.isCompleted).length;
                    const totalChecklist = task.checklists.flatMap((c) => c.items).length;

                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className="h-10 px-4 flex items-center justify-between hover:bg-sky-500/5 transition-colors cursor-pointer group"
                      >
                        {/* Lado Esquerdo: Prioridade + ID + Título + Tag IA */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-4">
                          <span className="shrink-0">
                            {renderPriorityIcon(task.priority)}
                          </span>

                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 font-semibold shrink-0">
                            #MH-{taskIdShort}
                          </span>

                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-sky-500 transition-colors">
                            {task.title}
                          </span>

                          {task.taskType === "agent_task" && (
                            <span className="flex items-center gap-1 font-mono text-[9px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded shrink-0">
                              <Bot className="h-2.5 w-2.5" />
                              IA
                            </span>
                          )}
                        </div>

                        {/* Lado Direito: Metadados & Responsáveis */}
                        <div className="flex items-center gap-3.5 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                          {totalChecklist > 0 && (
                            <div className="flex items-center gap-1 font-mono text-[10px]">
                              <CheckSquare className="h-3 w-3" />
                              <span>
                                {completedChecklist}/{totalChecklist}
                              </span>
                            </div>
                          )}

                          {task.storyPoints !== undefined && (
                            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] px-1.5 py-0.2 rounded font-semibold">
                              {task.storyPoints} pts
                            </span>
                          )}

                          {task.dueDate && (
                            <span className="font-mono text-[10px] flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                          )}

                          {/* Avatares dos Responsáveis */}
                          <div className="flex items-center -space-x-1">
                            {task.assigneeIds.map((ass) => (
                              <img
                                key={ass.id}
                                src={ass.avatarUrl}
                                alt={ass.name}
                                title={ass.name}
                                className="h-5 w-5 rounded-full border border-slate-200 dark:border-slate-900 bg-slate-800 object-cover"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {group.tasks.length === 0 && (
                    <div className="py-3 px-4 text-center text-xs text-slate-400">
                      Nenhuma tarefa neste grupo
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Assinatura MedHit */}
      <div className="text-right text-[10px] font-mono text-slate-400 dark:text-slate-600">
        Medhit WorkTrack by Integrações & Automações
      </div>
    </div>
  );
}
