"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Status, Task } from "@/server/services/data-store";
import { cn } from "@/lib/utils";

interface ListViewProps {
  statuses: Status[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onQuickAddTask: (statusId: string, title: string) => void;
}

export function ListView({
  statuses,
  tasks,
  onTaskClick,
  onQuickAddTask,
}: ListViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (statusId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [statusId]: !prev[statusId],
    }));
  };

  const renderPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <span title="Urgente"><AlertCircle className="h-3.5 w-3.5 text-rose-500" /></span>;
      case "high":
        return <span title="Alta"><SignalHigh className="h-3.5 w-3.5 text-amber-500 dark:text-zinc-300" /></span>;
      case "medium":
        return <span title="Média"><SignalMedium className="h-3.5 w-3.5 text-sky-500 dark:text-zinc-400" /></span>;
      case "low":
        return <span title="Baixa"><SignalLow className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" /></span>;
      default:
        return <span title="Nenhuma"><Minus className="h-3.5 w-3.5 text-slate-300 dark:text-zinc-600" /></span>;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20 divide-y divide-slate-100 dark:divide-white/[0.06]">
      {statuses.map((status) => {
        const groupTasks = tasks.filter((t) => t.statusId === status.id);
        const isCollapsed = !!collapsedGroups[status.id];

        return (
          <div key={status.id} className="select-none">
            {/* Header do Grupo de Status */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/70 dark:bg-slate-950/60 hover:bg-slate-200/50 dark:hover:bg-white/[0.04] transition-colors border-b border-slate-200 dark:border-white/[0.06]">
              <button
                onClick={() => toggleGroup(status.id)}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                )}
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: status.color }}
                />
                <span>{status.name}</span>
                <span className="font-mono text-[10px] text-slate-400 font-normal">
                  ({groupTasks.length})
                </span>
              </button>

              <button
                onClick={() => onQuickAddTask(status.id, "Nova tarefa rápida")}
                className="h-6 w-6 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 flex items-center justify-center transition-colors cursor-pointer"
                title="Adicionar tarefa rápida"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Linhas de Tarefa do Grupo */}
            {!isCollapsed && (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {groupTasks.map((task) => {
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

                        {/* Avatares */}
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

                {groupTasks.length === 0 && (
                  <div className="py-3 px-4 text-center text-xs text-slate-400">
                    Nenhuma tarefa neste status
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
