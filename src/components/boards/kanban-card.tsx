"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  Paperclip,
  MoreVertical,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { Task } from "@/server/services/data-store";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export function KanbanCard({ task, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  // Mock cover image selection for visual match with reference UI
  // Reference cards feature modern tech / digital illustrations on the first cards
  const hasCoverImage =
    task.title.toLowerCase().includes("copy") ||
    task.title.toLowerCase().includes("webhook") ||
    task.title.toLowerCase().includes("criativos");

  const coverImageUrl = task.title.toLowerCase().includes("copy")
    ? "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
    : "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80";

  // Category tags with pill badges exactly matching the reference
  const getCategoryTag = () => {
    if (task.taskType === "agent_task") {
      return { label: "Development", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
    }
    return { label: "Design", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
  };

  const getPriorityPill = () => {
    switch (task.priority) {
      case "urgent":
        return { label: "High", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
      case "high":
        return { label: "High", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
      case "medium":
        return { label: "Medium", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
      case "low":
      default:
        return { label: "Low", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" };
    }
  };

  const category = getCategoryTag();
  const priorityPill = getPriorityPill();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={cn(
        "group relative rounded-2xl border border-white/[0.08] dark:border-sky-500/15 bg-white/80 dark:bg-[#0c1830]/75 backdrop-blur-md p-3.5 shadow-md shadow-black/20 hover:border-sky-500/40 hover:shadow-sky-500/10 hover:shadow-xl transition-all cursor-grab active:cursor-grabbing select-none overflow-hidden",
        isDragging && "opacity-30 scale-102 ring-2 ring-sky-400"
      )}
    >
      {/* Cover Image se aplicável (como nos cards do topo da imagem de referência) */}
      {hasCoverImage && (
        <div className="relative -mx-3.5 -mt-3.5 mb-3 h-28 overflow-hidden rounded-t-2xl">
          <img
            src={coverImageUrl}
            alt={task.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1830] via-transparent to-transparent opacity-80" />
        </div>
      )}

      {/* Tags de Categoria & Prioridade & Tags Customizadas + Ações Rápidas */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
              category.color
            )}
          >
            {category.label}
          </span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
              priorityPill.color
            )}
          >
            {priorityPill.label}
          </span>
          {task.tags && task.tags.map((tg) => (
            <span
              key={tg}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-500 dark:text-sky-300 border border-sky-500/20"
            >
              #{tg}
            </span>
          ))}
        </div>

        <button
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          onClick={(e) => {
            e.stopPropagation();
            onClick(task);
          }}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Título da Tarefa / Card name */}
      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug mb-3 group-hover:text-sky-400 transition-colors">
        {task.title}
      </h3>

      {/* Rodapé: Data (12 JUN), Anexos (0 files), Avatares */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.06] text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-3">
          {/* Data */}
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).toUpperCase()
                : "12 JUN"}
            </span>
          </div>

          {/* Contador de Anexos */}
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <Paperclip className="h-3 w-3 text-slate-400" />
            <span>0 files</span>
          </div>
        </div>

        {/* Avatares dos Membros */}
        <div className="flex items-center -space-x-1.5">
          {task.assigneeIds.map((ass) => (
            <img
              key={ass.id}
              src={ass.avatarUrl}
              alt={ass.name}
              title={ass.name}
              className="h-5 w-5 rounded-full border border-slate-900 bg-slate-800 object-cover shadow-xs"
            />
          ))}
          {task.assigneeIds.length > 1 && (
            <span className="h-5 w-5 rounded-full bg-slate-800 border border-slate-900 text-[9px] font-mono text-slate-300 flex items-center justify-center font-bold">
              +{task.assigneeIds.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
