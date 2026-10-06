/**
 * MedHit Integrações & Automações
 * Cartão Kanban Simplificado e Pragmático (Estilo Monday.com / Linear).
 * 
 * Sem overengineering ou mockups artificiais:
 * - Prioridade visual clara em português
 * - Título legível da demanda
 * - Prazo real apenas se definido (com alerta de atraso)
 * - Progresso do checklist (se houver critérios)
 * - Avatares reais dos responsáveis
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  CheckSquare,
  AlertCircle,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Minus,
  Clock,
} from "lucide-react";
import { Task } from "@/server/services/data-store";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

const PRIORITY_CONFIG: Record<
  Task["priority"],
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  urgent: {
    label: "Urgente",
    badgeClass: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    icon: AlertCircle,
  },
  high: {
    label: "Alta",
    badgeClass: "bg-orange-500/15 text-orange-500 border-orange-500/30",
    icon: SignalHigh,
  },
  medium: {
    label: "Média",
    badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    icon: SignalMedium,
  },
  low: {
    label: "Baixa",
    badgeClass: "bg-sky-500/15 text-sky-500 border-sky-500/30",
    icon: SignalLow,
  },
  none: {
    label: "Normal",
    badgeClass: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    icon: Minus,
  },
};

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

  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none;

  // Cálculo de Progresso de Checklist
  const allChecklistItems = task.checklists?.flatMap((c) => c.items) || [];
  const completedCount = allChecklistItems.filter((i) => i.isCompleted).length;
  const totalCount = allChecklistItems.length;

  // Formatação de Prazo
  const getDueDateInfo = () => {
    if (!task.dueDate) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const due = new Date(task.dueDate);
    const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.ceil((dueDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `${Math.abs(diffDays)}d atrasada`,
        className: "text-rose-500 bg-rose-500/10 border-rose-500/25 font-bold",
        isOverdue: true,
      };
    }
    if (diffDays === 0) {
      return {
        label: "Hoje",
        className: "text-amber-500 bg-amber-500/10 border-amber-500/25 font-bold",
        isOverdue: false,
      };
    }
    if (diffDays === 1) {
      return {
        label: "Amanhã",
        className: "text-sky-500 bg-sky-500/10 border-sky-500/25 font-medium",
        isOverdue: false,
      };
    }
    return {
      label: due.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      className: "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10",
      isOverdue: false,
    };
  };

  const dueDateInfo = getDueDateInfo();
  const visibleAssignees = task.assigneeIds.slice(0, 3);
  const remainingAssigneesCount = Math.max(0, task.assigneeIds.length - 3);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={cn(
        "group relative rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0c1830] p-3 shadow-xs hover:border-sky-500/50 hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-40 scale-102 ring-2 ring-sky-400"
      )}
    >
      {/* Linha Superior: Prioridade & Tags */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border",
              priority.badgeClass
            )}
          >
            <priority.icon className="h-3 w-3" />
            <span>{priority.label}</span>
          </span>

          {task.tags &&
            task.tags.slice(0, 2).map((tg) => (
              <span
                key={tg}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/5"
              >
                #{tg}
              </span>
            ))}
        </div>
      </div>

      {/* Título da Demanda */}
      <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-3 group-hover:text-sky-500 transition-colors">
        {task.title}
      </h3>

      {/* Rodapé: Prazo, Checklist & Responsáveis */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          {/* Prazo Real (se houver) */}
          {dueDateInfo && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border font-mono",
                dueDateInfo.className
              )}
            >
              <Clock className="h-2.5 w-2.5" />
              <span>{dueDateInfo.label}</span>
            </span>
          )}

          {/* Progresso do Checklist */}
          {totalCount > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-mono",
                completedCount === totalCount
                  ? "text-emerald-500 font-bold"
                  : "text-slate-400"
              )}
              title={`${completedCount} de ${totalCount} itens concluídos`}
            >
              <CheckSquare className="h-3 w-3" />
              <span>
                {completedCount}/{totalCount}
              </span>
            </span>
          )}
        </div>

        {/* Avatares dos Responsáveis */}
        {visibleAssignees.length > 0 && (
          <div className="flex items-center -space-x-1.5">
            {visibleAssignees.map((ass) => (
              <img
                key={ass.id}
                src={ass.avatarUrl}
                alt={ass.name}
                title={ass.name}
                className="h-5 w-5 rounded-full border-2 border-white dark:border-[#0c1830] bg-slate-200 dark:bg-slate-800 object-cover shadow-xs"
              />
            ))}
            {remainingAssigneesCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-[#0c1830] text-[9px] font-mono text-slate-500 flex items-center justify-center font-bold">
                +{remainingAssigneesCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
