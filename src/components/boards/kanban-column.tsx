/**
 * MedHit Integrações & Automações
 * Coluna do Quadro Kanban (Estilo Monday.com).
 * 
 * - Cabeçalho com cor dinâmica real do status
 * - Contador claro de tarefas
 * - Criação inline rápida no topo e rodapé (+ Nova tarefa)
 * - Área receptora de arrastar-e-soltar (drag & drop)
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Status, Task } from "@/server/services/data-store";
import { KanbanCard } from "./kanban-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: Status;
  tasks: Task[];
  statuses?: Status[];
  onTaskClick: (task: Task) => void;
  onQuickAddTask: (statusId: string, title: string) => void;
  onMoveTask?: (taskId: string, targetStatusId: string) => void;
}

export function KanbanColumn({
  status,
  tasks,
  statuses,
  onTaskClick,
  onQuickAddTask,
  onMoveTask,
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

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-[300px] shrink-0 h-full max-h-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-[#081226]/60 backdrop-blur-xl p-3 transition-all select-none shadow-sm",
        isOver && "border-sky-500/50 bg-sky-500/5 ring-1 ring-sky-400/30"
      )}
    >
      {/* Cabeçalho da Coluna: Cor do Status + Nome + Contador + Botão Adicionar */}
      <div className="flex items-center justify-between pb-2.5 px-1 border-b border-slate-200 dark:border-white/10 select-none">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: status.color || "#38bdf8" }}
          />
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide truncate">
            {status.name}
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-400 font-semibold">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="p-1 rounded-md text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 transition-colors cursor-pointer"
          title="Adicionar tarefa neste status"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Lista de Cartões */}
      <div className="flex-1 overflow-y-auto py-2.5 space-y-2.5 min-h-[140px] pr-0.5">
        {/* Formulário de Criação Rápida */}
        {isAdding && (
          <form
            onSubmit={handleCreate}
            className="rounded-xl border border-sky-500/40 bg-white dark:bg-slate-900 p-3 space-y-2 shadow-md animate-in fade-in duration-150"
          >
            <input
              autoFocus
              type="text"
              placeholder="O que precisa ser feito?..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAdding(false)}
                className="h-7 px-2 text-[11px] text-slate-500"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-7 px-3 text-[11px] font-bold bg-sky-500 hover:bg-sky-400 text-slate-950"
              >
                Salvar
              </Button>
            </div>
          </form>
        )}

        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              statuses={statuses}
              onMoveTask={onMoveTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAdding && (
          <div className="h-24 border border-dashed border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center text-xs text-slate-400 select-none">
            Nenhuma tarefa neste status
          </div>
        )}
      </div>

      {/* Botão Inferior Discreto */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 transition-colors border border-transparent select-none cursor-pointer mt-1"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nova tarefa</span>
        </button>
      )}
    </div>
  );
}
