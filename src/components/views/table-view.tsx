"use client";

import React from "react";
import { Task, Status } from "@/server/services/data-store";
import {
  Bot,
  FileText,
  CheckCircle2,
  AlertCircle,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Minus,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TableViewProps {
  statuses: Status[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TableView({ statuses, tasks, onTaskClick }: TableViewProps) {
  const totalPoints = tasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  const doneTasks = tasks.filter((t) => {
    const status = statuses.find((s) => s.id === t.statusId);
    return status?.category === "done";
  });
  const percentDone = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

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
    <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Cabeçalho da Tabela */}
          <thead className="bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold select-none">
            <tr>
              <th className="py-3 px-3.5 w-10 text-center"></th>
              <th className="py-3 px-3.5 w-20">ID</th>
              <th className="py-3 px-3.5">Título da Demanda</th>
              <th className="py-3 px-3.5 w-36">Status</th>
              <th className="py-3 px-3.5 w-16 text-center">Prio</th>
              <th className="py-3 px-3.5 w-28">Responsáveis</th>
              <th className="py-3 px-3.5 w-20 text-right">Pontos</th>
              <th className="py-3 px-3.5 w-28 text-right">Prazo</th>
            </tr>
          </thead>

          {/* Linhas de Dados */}
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {tasks.map((task) => {
              const status = statuses.find((s) => s.id === task.statusId);
              const taskIdShort = task.id.replace("task-", "");

              return (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="h-10 hover:bg-sky-500/5 transition-colors cursor-pointer group"
                >
                  {/* Tipo */}
                  <td className="py-2 px-3.5 text-center">
                    {task.taskType === "agent_task" ? (
                      <span title="Agente IA" className="text-purple-500 dark:text-purple-400 inline-flex items-center">
                        <Bot className="h-4 w-4" />
                      </span>
                    ) : (
                      <span title="Humano" className="text-slate-400 dark:text-slate-500 inline-flex items-center">
                        <FileText className="h-4 w-4" />
                      </span>
                    )}
                  </td>

                  {/* ID */}
                  <td className="py-2 px-3.5 font-mono text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    #MH-{taskIdShort}
                  </td>

                  {/* Título */}
                  <td className="py-2 px-3.5 font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-500 transition-colors truncate max-w-md">
                    {task.title}
                  </td>

                  {/* Status */}
                  <td className="py-2 px-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                      <span
                        className="h-2 w-2 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: status?.color || "#71717a" }}
                      />
                      <span className="truncate">{status?.name || "Sem status"}</span>
                    </span>
                  </td>

                  {/* Prioridade */}
                  <td className="py-2 px-3.5 text-center">
                    <div className="flex justify-center">
                      {renderPriorityIcon(task.priority)}
                    </div>
                  </td>

                  {/* Responsáveis */}
                  <td className="py-2 px-3.5">
                    <div className="flex items-center -space-x-1">
                      {task.assigneeIds.map((ass) => (
                        <img
                          key={ass.id}
                          src={ass.avatarUrl}
                          alt={ass.name}
                          title={`${ass.name} (${ass.type})`}
                          className="h-5 w-5 rounded-full border border-slate-200 dark:border-slate-900 bg-slate-800 object-cover"
                        />
                      ))}
                    </div>
                  </td>

                  {/* Pontos */}
                  <td className="py-2 px-3.5 text-right font-mono text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
                    {task.storyPoints ?? "-"}
                  </td>

                  {/* Prazo */}
                  <td className="py-2 px-3.5 text-right font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {task.dueDate ? (
                      <span className="flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Aggregate Bar no Rodapé (Monday/Attio Style) */}
      <div className="bg-slate-100/70 dark:bg-slate-950/60 border-t border-slate-200 dark:border-white/[0.08] px-5 py-3 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 select-none">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{tasks.length} itens</span>
          <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1 font-bold">
            <CheckCircle2 className="h-4 w-4" />
            {percentDone}% concluído
          </span>
        </div>
        <div className="text-slate-600 dark:text-slate-400">
          Total: <span className="text-slate-900 dark:text-white font-bold">{totalPoints} pts</span>
        </div>
      </div>
    </div>
  );
}
