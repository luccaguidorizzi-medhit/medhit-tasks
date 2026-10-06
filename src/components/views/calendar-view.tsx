"use client";

import React, { useState, useMemo } from "react";
import { Task, Status } from "@/server/services/data-store";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  AlertCircle,
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

/**
 * Visão em Calendário Avançada - MedHit Tasks
 * Desenvolvido pela equipe MedHit Integrações & Automações
 */
export function CalendarView({
  statuses,
  tasks,
  onTaskClick,
  onQuickAddTask,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

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
      const isToday =
        isCurrentMonthActual && today.getDate() === d;
      cells.push({
        day: d,
        isCurrentMonth: true,
        dateKey,
        isToday,
      });
    }

    // Preenche os dias restantes da última semana (para totalizar múltiplos de 7, máx 42)
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

  // Indexação de tarefas por data (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();

    tasks.forEach((t) => {
      let key = "";
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      } else {
        // Fallback: distribui pelo dia de criação ou hoje
        const d = new Date(t.createdAt || Date.now());
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(t);
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

      {/* Grid de Dias */}
      <div className="border border-slate-200 dark:border-sky-500/20 rounded-xl overflow-hidden bg-slate-100/50 dark:bg-slate-950/40">
        {/* Cabeçalho dos Dias da Semana */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/5 text-center bg-slate-100 dark:bg-slate-900/60">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Células dos Dias */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-white/5">
          {calendarGrid.map((cell) => {
            const dayTasks = tasksByDate.get(cell.dateKey) || [];

            return (
              <div
                key={cell.dateKey}
                className={cn(
                  "min-h-[110px] p-2 flex flex-col justify-between transition-colors relative group",
                  cell.isCurrentMonth
                    ? "bg-white/40 dark:bg-[#070e1e]/40 hover:bg-sky-500/5"
                    : "bg-slate-100/30 dark:bg-slate-950/40 opacity-40 hover:opacity-70",
                  cell.isToday && "bg-sky-500/10 dark:bg-sky-500/15 ring-1 ring-inset ring-sky-500/40"
                )}
              >
                {/* Header da Célula: Número do Dia + Botão + */}
                <div className="flex items-center justify-between">
                  {onQuickAddTask && (
                    <button
                      onClick={() =>
                        onQuickAddTask(
                          statuses[0]?.id || "",
                          "Nova tarefa rápida",
                          cell.dateKey
                        )
                      }
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all cursor-pointer"
                      title="Adicionar tarefa neste dia"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}

                  <span
                    className={cn(
                      "text-xs font-mono px-1.5 py-0.5 rounded-full ml-auto font-medium",
                      cell.isToday
                        ? "bg-sky-500 text-slate-950 font-bold shadow-sm shadow-sky-500/30"
                        : "text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {cell.day}
                  </span>
                </div>

                {/* Lista de Tarefas do Dia com Badges de Prioridade & Status */}
                <div className="space-y-1 my-1 overflow-y-auto max-h-[75px] scrollbar-thin">
                  {dayTasks.map((t) => {
                    const statusObj = statusMap.get(t.statusId);
                    const statusColor = statusObj?.color || "#38bdf8";

                    return (
                      <div
                        key={t.id}
                        onClick={() => onTaskClick(t)}
                        className="p-1 px-1.5 rounded-md bg-white dark:bg-[#0c1830] border border-slate-200 dark:border-white/10 hover:border-sky-500/40 shadow-2xs text-[10px] flex items-center gap-1.5 transition-all cursor-pointer group/item truncate"
                      >
                        {/* Indicador de Prioridade */}
                        {renderPriorityBadge(t.priority)}

                        {/* Status Dot */}
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: statusColor }}
                          title={statusObj?.name || "Status"}
                        />

                        {/* Título da Tarefa */}
                        <span className="truncate font-medium text-slate-800 dark:text-slate-200 group-hover/item:text-sky-400">
                          {t.title}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Rodapé da Célula */}
                <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between">
                  {dayTasks.length > 0 && (
                    <span>
                      {dayTasks.length} {dayTasks.length === 1 ? "tarefa" : "tarefas"}
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_4px_#f43f5e]" />
            <span>Urgente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Alta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span>Média</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span>Baixa</span>
          </div>
        </div>

        <span className="font-mono text-[10px] text-slate-400">
          MedHit Integrações & Automações • Calendário Dinâmico
        </span>
      </div>
    </div>
  );
}
