"use client";

import React, { useState } from "react";
import { Task, Status } from "@/server/services/data-store";
import {
  Inbox,
  Plus,
  ArrowRight,
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EducationalTooltip } from "@/components/ui/tooltip";

interface BacklogViewProps {
  statuses: Status[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onMoveToBoard: (taskId: string, targetStatusId: string) => void;
  onQuickAddTask: (title: string, priority: Task["priority"]) => void;
}

export function BacklogView({
  statuses,
  tasks,
  onTaskClick,
  onMoveToBoard,
  onQuickAddTask,
}: BacklogViewProps) {
  const [newTitle, setNewTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<Task["priority"]>("medium");
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Consideramos backlog as tarefas no primeiro status ou marcadas como 'todo'/'backlog'
  const firstStatus = statuses[0];
  const todoStatus = statuses.find((s) => s.category === "todo" || s.name.toLowerCase().includes("fazer")) || statuses[0];
  const inProgressStatus = statuses.find((s) => s.category === "in_progress") || statuses[1] || statuses[0];

  // Identifica backlog items
  const backlogTasks = tasks.filter((t) => {
    if (filterTag && !t.tags?.includes(filterTag)) return false;
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onQuickAddTask(newTitle.trim(), selectedPriority);
    setNewTitle("");
  };

  const getPriorityBadge = (p: Task["priority"]) => {
    switch (p) {
      case "urgent":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-500 border border-rose-500/20">Urgente</span>;
      case "high":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/20">Alta</span>;
      case "medium":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono text-sky-400 bg-sky-500/15 border border-sky-500/20">Média</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800/40">Baixa</span>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none max-w-6xl mx-auto w-full">
      {/* Backlog Header Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Backlog de Demandas</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">
                {backlogTasks.length} itens
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Triagem de ideias, demandas brutas e itens a serem priorizados antes de ir para o fluxo ativo do quadro.
            </p>
          </div>
        </div>

        {/* Quick Add Inline Form */}
        <form onSubmit={handleCreate} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="+ Digite uma demanda e pressione Enter..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 md:w-80 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors"
          />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as Task["priority"])}
            className="bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
          <Button
            type="submit"
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
          >
            Adicionar
          </Button>
        </form>
      </div>

      {/* Backlog List */}
      <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl shadow-lg overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
        {backlogTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Inbox className="h-8 w-8 mx-auto text-slate-500/50" />
            <p className="text-sm font-semibold">Nenhuma demanda pendente no backlog</p>
            <p className="text-xs">Utilize o campo acima para cadastrar novos itens de triagem.</p>
          </div>
        ) : (
          backlogTasks.map((task) => {
            const currentStatus = statuses.find((s) => s.id === task.statusId);
            return (
              <div
                key={task.id}
                className="p-4 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div
                  onClick={() => onTaskClick(task)}
                  className="flex items-center gap-3.5 flex-1 cursor-pointer min-w-0"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: currentStatus?.color || "#64748b" }}
                    title={currentStatus?.name}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-400 transition-colors truncate">
                        {task.title}
                      </span>
                      {getPriorityBadge(task.priority)}
                      {task.tags?.map((tg) => (
                        <span
                          key={tg}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        >
                          #{tg}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-mono">
                      <span>Status: {currentStatus?.name || "Pendente"}</span>
                      {task.checklists.length > 0 && (
                        <span>
                          Checklist: {task.checklists[0].items.filter((i) => i.isCompleted).length}/
                          {task.checklists[0].items.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ação rápida: Jogar para o Board */}
                <div className="flex items-center gap-2 shrink-0">
                  <EducationalTooltip
                    title="Mover para o Quadro Kanban"
                    description="Move esta tarefa do backlog diretamente para a coluna 'Em Andamento' do fluxo de entrega."
                  >
                    <Button
                      size="sm"
                      onClick={() => onMoveToBoard(task.id, inProgressStatus.id)}
                      className="text-xs font-semibold bg-sky-500/15 hover:bg-sky-500 text-sky-400 hover:text-slate-950 border border-sky-500/30 transition-all rounded-lg gap-1.5 cursor-pointer"
                    >
                      <span>Jogar p/ Board</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </EducationalTooltip>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
