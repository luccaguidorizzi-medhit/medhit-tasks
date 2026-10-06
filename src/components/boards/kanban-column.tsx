"use client";

import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, MoreVertical, PlusCircle } from "lucide-react";
import { Status, Task } from "@/server/services/data-store";
import { KanbanCard } from "./kanban-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: Status;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onQuickAddTask: (statusId: string, title: string) => void;
}

export function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onQuickAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: {
      type: "Column",
      status,
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");

  const taskIds = tasks.map((t) => t.id);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAddTask(status.id, quickTitle.trim());
    setQuickTitle("");
    setIsAdding(false);
  };

  // Status color dot mapped matching the reference image (purple, orange, green)
  const getDotColor = () => {
    if (status.name.toLowerCase().includes("ideia") || status.name.toLowerCase().includes("briefing") || status.name.toLowerCase().includes("backlog")) {
      return "bg-purple-400";
    }
    if (status.name.toLowerCase().includes("criação") || status.name.toLowerCase().includes("desenvolvimento") || status.name.toLowerCase().includes("sprint")) {
      return "bg-amber-400";
    }
    return "bg-emerald-400";
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-[320px] shrink-0 h-full max-h-full rounded-2xl border border-white/[0.08] dark:border-sky-500/15 bg-white/50 dark:bg-[#081226]/60 backdrop-blur-xl p-3.5 transition-all select-none shadow-lg shadow-black/10",
        isOver && "border-sky-400/50 bg-sky-500/5 ring-1 ring-sky-400/30"
      )}
    >
      {/* Cabeçalho da Coluna: Dot Color + Tasks name + Plus Circle + More Options */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200 dark:border-white/[0.06] select-none">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]", getDotColor())} />
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide truncate">
            {status.name}
          </h2>
          <span className={cn(
            "text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold",
            status.wipLimit && tasks.length > status.wipLimit
              ? "bg-rose-500/20 text-rose-500 border border-rose-500/30 animate-pulse"
              : status.wipLimit && tasks.length === status.wipLimit
              ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
              : "text-slate-400"
          )}>
            {tasks.length}{status.wipLimit ? `/${status.wipLimit}` : ""}
          </span>
          {status.wipLimit && tasks.length > status.wipLimit && (
            <span className="text-[9px] font-mono uppercase bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/30 font-bold" title="Limite WIP excedido: risco de gargalo no fluxo">
              WIP Excedido
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-400">
          <button
            onClick={() => setIsAdding(true)}
            className="p-1 rounded-full hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
            title="Adicionar tarefa rápida"
          >
            <PlusCircle className="h-4 w-4" />
          </button>
          <button
            className="p-1 rounded-full hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Mais opções da coluna"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Lista de Cartões (Scrollável suave) */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-[140px] pr-0.5">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAdding && (
          <div className="h-28 border border-dashed border-slate-300 dark:border-white/[0.08] rounded-xl flex items-center justify-center text-xs text-slate-400 select-none">
            Nenhuma tarefa aqui
          </div>
        )}

        {/* Formulário de Criação Rápida */}
        {isAdding && (
          <form
            onSubmit={handleCreate}
            className="rounded-xl border border-sky-500/30 bg-slate-900/90 p-3 space-y-2.5 shadow-lg backdrop-blur-md"
          >
            <input
              autoFocus
              type="text"
              placeholder="Nome da nova tarefa..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none text-white placeholder:text-slate-500"
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAdding(false)}
                className="h-6 px-2 text-[11px] text-slate-400"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-6 px-2.5 text-[11px] font-bold bg-sky-500 hover:bg-sky-400 text-slate-950"
              >
                Adicionar
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Botão Inferior Discreto */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors border border-transparent select-none cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add task</span>
        </button>
      )}
    </div>
  );
}
