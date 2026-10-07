"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Status, Task } from "@/server/services/data-store";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { Plus, Folder } from "lucide-react";
import { toast } from "sonner";

interface KanbanBoardProps {
  statuses: Status[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, targetStatusId: string) => void;
  onQuickAddTask: (statusId: string, title: string) => void;
  onOpenNewTaskModal?: () => void;
}

export function KanbanBoard({
  statuses,
  tasks,
  onTaskClick,
  onMoveTask,
  onQuickAddTask,
  onOpenNewTaskModal,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [filterTag, setFilterTag] = useState<string>("all");

  // Lista de tags únicas
  const availableTags = React.useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      (t.tags || []).forEach((tag) => {
        if (tag.trim()) set.add(tag.trim());
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const filteredTasks = React.useMemo(() => {
    if (filterTag === "all") return tasks;
    return tasks.filter((t) =>
      (t.tags || []).some((tg) => tg.toLowerCase() === filterTag.toLowerCase())
    );
  }, [tasks, filterTag]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = String(active.id);
    const overId = String(over.id);

    // 1. Soltou sobre uma coluna
    const targetStatus = statuses.find((s) => s.id === overId);
    if (targetStatus) {
      const task = tasks.find((t) => t.id === activeTaskId);
      if (task && task.statusId !== targetStatus.id) {
        onMoveTask(activeTaskId, targetStatus.id);
        toast.success(`Tarefa movida para "${targetStatus.name}"`);
      }
      return;
    }

    // 2. Soltou sobre outro cartão
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      const task = tasks.find((t) => t.id === activeTaskId);
      if (task && task.statusId !== overTask.statusId) {
        onMoveTask(activeTaskId, overTask.statusId);
        const statusObj = statuses.find((s) => s.id === overTask.statusId);
        toast.success(`Tarefa movida para "${statusObj?.name || 'novo status'}"`);
      }
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Barra de Filtro de Pastas / Tags no Quadro */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-2 px-1 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Folder className="h-3.5 w-3.5 text-sky-400" />
            <span className="font-mono text-[11px]">Pastas:</span>
          </div>
          <button
            type="button"
            onClick={() => setFilterTag("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
              filterTag === "all"
                ? "bg-sky-500/15 text-sky-400 border-sky-500/30 font-bold"
                : "bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            Todas
          </button>
          {availableTags.map((tg) => (
            <button
              key={tg}
              type="button"
              onClick={() => setFilterTag(tg)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                filterTag === tg
                  ? "bg-sky-500/15 text-sky-400 border-sky-500/30 font-bold"
                  : "bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent hover:text-slate-200"
              }`}
            >
              #{tg}
            </button>
          ))}
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-stretch select-none pr-6">
          {statuses.map((status) => {
            const columnTasks = filteredTasks.filter((t) => t.statusId === status.id);
            return (
              <KanbanColumn
                key={status.id}
                status={status}
                tasks={columnTasks}
                statuses={statuses}
                onTaskClick={onTaskClick}
                onQuickAddTask={onQuickAddTask}
                onMoveTask={onMoveTask}
              />
            );
          })}

        {/* Botão lateral "Add Task" pontilhado como na imagem de referência */}
        <div className="shrink-0 w-64 h-32 pt-1">
          <button
            onClick={onOpenNewTaskModal}
            className="w-full h-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-sky-500/20 hover:border-sky-400 bg-white/20 dark:bg-[#081226]/30 hover:bg-sky-500/5 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-sky-400 transition-all cursor-pointer group"
          >
            <div className="h-8 w-8 rounded-full border border-slate-300 dark:border-sky-500/30 group-hover:border-sky-400 flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold">Nova Tarefa</span>
          </button>
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 scale-105 shadow-2xl opacity-90">
            <KanbanCard task={activeTask} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
    </div>
  );
}
