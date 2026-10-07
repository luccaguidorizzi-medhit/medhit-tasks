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
import { Plus } from "lucide-react";
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full items-stretch select-none pr-6">
        {statuses.map((status) => {
          const columnTasks = tasks.filter((t) => t.statusId === status.id);
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
  );
}
