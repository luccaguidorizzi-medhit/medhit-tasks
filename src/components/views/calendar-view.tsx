"use client";

import React from "react";
import { Task, Status } from "@/server/services/data-store";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarViewProps {
  statuses: Status[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function CalendarView({ statuses, tasks, onTaskClick }: CalendarViewProps) {
  const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  // Mock days grid para Outubro de 2026
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs p-4 space-y-4">
      {/* Controles do Mês */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Outubro de 2026</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
            Hoje
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid Dias da Semana */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden text-center text-xs">
        {daysOfWeek.map((day) => (
          <div key={day} className="bg-muted/60 py-2 font-semibold text-muted-foreground uppercase text-[10px]">
            {day}
          </div>
        ))}

        {/* Células de Dias */}
        {calendarDays.map((day) => {
          // Exemplo: dia 4 e 5 tem tarefas
          const dayTasks = tasks.slice(0, 2);

          return (
            <div
              key={day}
              className="bg-card min-h-[100px] p-1.5 flex flex-col justify-between hover:bg-accent/20 transition-colors"
            >
              <div className="text-right">
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${day === 5 ? "bg-blue-600 text-white font-bold" : "text-muted-foreground"}`}>
                  {day}
                </span>
              </div>

              <div className="space-y-1 mt-1">
                {day === 4 || day === 5 ? (
                  dayTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onTaskClick(t)}
                      className="text-[10px] p-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 truncate font-medium cursor-pointer"
                    >
                      {t.title}
                    </div>
                  ))
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
