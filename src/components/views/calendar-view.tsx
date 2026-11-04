"use client";

import React, { useState, useMemo } from "react";
import { Task, Status } from "@/server/services/data-store";
import { useTasks } from "@/context/task-context";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Play,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  statuses: Status[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onQuickAddTask?: (statusId: string, title: string, dueDate?: string) => void;
}

interface CalendarEvent {
  task: Task;
  kind: "due" | "release";
}

/**
 * Visão em Calendário Avançada - MedHit Tasks v2
 * Desenvolvido pela equipe MedHit Integrações & Automações
 */
export function CalendarView({
  statuses,
  tasks,
  onTaskClick,
  onQuickAddTask,
}: CalendarViewProps) {
  const { currentProject } = useTasks();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Navegação de meses
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Nome do mês formatado em português
  const monthName = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  // Hoje real
  const today = new Date();
  const isCurrentMonthActual =
    today.getFullYear() === year && today.getMonth() === month;

  // Cálculo da grade do calendário
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDaysCount = new Date(year, month, 0).getDate();

    const cells: {
      day: number;
      isCurrentMonth: boolean;
      dateKey: string; // YYYY-MM-DD
      isToday: boolean;
    }[] = [];

    // Dias do mês anterior para preencher a primeira semana
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDaysCount - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        day: d,
        isCurrentMonth: false,
        dateKey,
        isToday: false,
      });
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isToday = isCurrentMonthActual && today.getDate() === d;
      cells.push({
        day: d,
        isCurrentMonth: true,
        dateKey,
        isToday,
      });
    }

    // Preenche os dias restantes da última semana
    const totalCells = Math.ceil(cells.length / 7) * 7;
    let nextMonthDay = 1;
    while (cells.length < (totalCells < 35 ? 35 : totalCells)) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(nextMonthDay).padStart(2, "0")}`;
      cells.push({
        day: nextMonthDay++,
        isCurrentMonth: false,
        dateKey,
        isToday: false,
      });
    }

    return cells;
  }, [year, month, isCurrentMonthActual, today]);

  // Indexação de eventos por data (YYYY-MM-DD) incluindo dueDate e customFields.releaseDate
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    const addEvent = (dateKey: string, task: Task, kind: "due" | "release") => {
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push({ task, kind });
    };

    tasks.forEach((t) => {
      let hasDate = false;
      if (t.dueDate) {
        hasDate = true;
        const key = t.dueDate.includes("T") ? t.dueDate.split("T")[0] : t.dueDate.slice(0, 10);
        addEvent(key, t, "due");
      }
      if (t.customFields?.releaseDate) {
        hasDate = true;
        const key = t.customFields.releaseDate.includes("T")
          ? t.customFields.releaseDate.split("T")[0]
          : t.customFields.releaseDate.slice(0, 10);
        addEvent(key, t, "release");
      }
      // Se não tiver data de vencimento nem liberação, distribui na data de criação
      if (!hasDate) {
        const d = new Date(t.createdAt || Date.now());
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        addEvent(key, t, "due");
      }
    });

    return map;
  }, [tasks]);

  const renderPriorityBadge = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 shadow-[0_0_4px_#f43f5e]" title="Urgente" />;
      case "high":
        return <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" title="Alta" />;
      case "medium":
        return <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" title="Média" />;
      default:
        return <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" title="Baixa/Normal" />;
    }
  };

  const statusMap = useMemo(() => {
    return new Map(statuses.map((s) => [s.id, s]));
  }, [statuses]);

  const groupMap = useMemo(() => {
    return new Map((currentProject?.groups || []).map((g) => [g.id, g]));
  }, [currentProject]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl shadow-lg p-5 space-y-4 select-none">
      {/* Controles de Mês & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              {monthName}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {tasks.length} demandas cadastradas neste quadro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="h-8 px-2 text-xs rounded-xl cursor-pointer"
            title="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8 px-3 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Hoje
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="h-8 px-2 text-xs rounded-xl cursor-pointer"
            title="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grade do Calendário */}
      <div className="overflow-x-auto">
        {/* Cabeçalho dos Dias da Semana */}
        <div className="grid grid-cols-7 gap-1.5 text-center mb-1">
          {daysOfWeek.map((day, idx) => (
            <div
              key={day}
              className={cn(
                "py-1 text-[11px] font-mono uppercase font-bold",
                idx === 0 || idx === 6
                  ? "text-slate-400 dark:text-slate-500"
                  : "text-slate-600 dark:text-slate-300"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Células dos Dias */}
        <div className="grid grid-cols-7 gap-1.5 min-w-[700px]">
          {calendarGrid.map((cell) => {
            const dayEvents = eventsByDate.get(cell.dateKey) || [];

            return (
              <div
                key={cell.dateKey}
                onClick={() => {
                  setAddingDate(cell.dateKey);
                  setQuickTitle("");
                }}
                className={cn(
                  "min-h-[110px] p-1.5 rounded-xl border flex flex-col justify-between transition-all group relative cursor-pointer",
                  cell.isCurrentMonth
                    ? "bg-white/40 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/5 hover:border-sky-500/30"
                    : "bg-slate-50/40 dark:bg-slate-950/20 border-transparent opacity-40 hover:opacity-70",
                  cell.isToday && "ring-2 ring-sky-500/50 bg-sky-500/5 dark:bg-sky-500/10"
                )}
              >
                {/* Topo da Célula: Número do Dia + Botão Rápido Add */}
                <div className="flex items-center justify-between">
                  {onQuickAddTask && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddingDate(cell.dateKey);
                        setQuickTitle("");
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 transition-all cursor-pointer"
                      title="Adicionar tarefa neste dia"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}

                  <span
                    className={cn(
                      "text-xs font-mono px-1.5 py-0.5 rounded-full ml-auto font-medium",
                      cell.isToday
                        ? "bg-sky-500 text-slate-950 font-bold shadow-xs shadow-sky-500/30"
                        : "text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {cell.day}
                  </span>
                </div>

                {/* Formulário Inline de Nova Tarefa no Dia */}
                {addingDate === cell.dateKey && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (quickTitle.trim() && onQuickAddTask) {
                        onQuickAddTask(statuses[0]?.id || "", quickTitle.trim(), cell.dateKey);
                        setQuickTitle("");
                        setAddingDate(null);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="my-1.5"
                  >
                    <input
                      autoFocus
                      type="text"
                      placeholder="Nome da tarefa..."
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setAddingDate(null);
                      }}
                      onBlur={() => {
                        if (!quickTitle.trim()) setAddingDate(null);
                      }}
                      className="w-full text-[11px] p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-500 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none shadow-md"
                    />
                  </form>
                )}

                {/* Lista de Eventos do Dia */}
                <div className="space-y-1 my-1 overflow-y-auto max-h-[75px] scrollbar-thin">
                  {dayEvents.map((ev, evIdx) => {
                    const t = ev.task;
                    const statusObj = statusMap.get(t.statusId);
                    const statusColor = statusObj?.color || "#38bdf8";
                    const isRelease = ev.kind === "release";
                    const taskGroup = t.groupId ? groupMap.get(t.groupId) : null;

                    return (
                      <div
                        key={`${t.id}-${ev.kind}-${evIdx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(t);
                        }}
                        className={cn(
                          "p-1 px-1.5 rounded-md border shadow-2xs text-[10px] flex items-center gap-1.5 transition-all cursor-pointer group/item truncate",
                          isRelease
                            ? "bg-purple-500/10 dark:bg-purple-950/40 border-purple-500/30 text-purple-700 dark:text-purple-300"
                            : "bg-white dark:bg-[#0c1830] border-slate-200 dark:border-white/10 hover:border-sky-500/40 text-slate-800 dark:text-slate-200"
                        )}
                        title={isRelease ? `Liberação de Conteúdo: ${t.title}` : `Prazo: ${t.title}`}
                      >
                        {isRelease ? (
                          <Play className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                        ) : (
                          renderPriorityBadge(t.priority)
                        )}

                        {/* Status ou Group Dot */}
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: taskGroup?.color || statusColor }}
                          title={taskGroup?.name || statusObj?.name || "Status"}
                        />

                        {/* Título */}
                        <span className="truncate font-medium group-hover/item:text-sky-400">
                          {isRelease ? `[Aula] ${t.title}` : t.title}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Rodapé da Célula */}
                <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between">
                  {dayEvents.length > 0 && (
                    <span>
                      {dayEvents.length} {dayEvents.length === 1 ? "evento" : "eventos"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda do Calendário */}
      <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_4px_#f43f5e]" />
            <span>Urgente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Alta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            <span>Liberação de Aula</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span>Prazo de Entrega</span>
          </div>
        </div>

        <span className="font-mono text-[10px] text-slate-400">
          Equipe MedHit I&A • Calendário Monday v2
        </span>
      </div>
    </div>
  );
}
