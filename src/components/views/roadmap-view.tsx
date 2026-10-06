"use client";

import React, { useState } from "react";
import { Task, Status } from "@/server/services/data-store";
import {
  Flag,
  CheckCircle2,
  Clock,
  Plus,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  tag: string;
}

interface RoadmapViewProps {
  tasks: Task[];
  statuses: Status[];
  onTaskClick: (task: Task) => void;
  onQuickAddTask: (statusId: string, title: string) => void;
}

export function RoadmapView({
  tasks,
  statuses,
  onTaskClick,
  onQuickAddTask,
}: RoadmapViewProps) {
  // Marcos pré-definidos e dinâmicos baseados nas entregas
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: "m1",
      title: "M1: Fase Alfa / Validação de Protótipo",
      description: "Setup dos fluxos essenciais, validação de regras de negócio e alinhamento de escopo.",
      dueDate: "15 Out 2026",
      tag: "alfa",
    },
    {
      id: "m2",
      title: "M2: Lançamento Operacional & Testes em Escala",
      description: "Implementação das esteiras de integração, disparo de tráfego e homologação.",
      dueDate: "30 Out 2026",
      tag: "beta",
    },
    {
      id: "m3",
      title: "M3: Conclusão & Rollout Geral",
      description: "Go-to-market, publicação oficial e relatórios consolidados de resultado.",
      dueDate: "15 Nov 2026",
      tag: "launch",
    },
  ]);

  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  const doneStatusIds = statuses
    .filter((s) => s.category === "done" || s.name.toLowerCase().includes("concluído"))
    .map((s) => s.id);

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    const newM: Milestone = {
      id: `m-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      description: "Marco estratégico de entrega da squad.",
      dueDate: "A definir",
      tag: `m-${Date.now()}`,
    };
    setMilestones((prev) => [...prev, newM]);
    setNewMilestoneTitle("");
    setIsAddingMilestone(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none max-w-6xl mx-auto w-full">
      {/* Header do Roadmap */}
      <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Marcos & Roadmap de Entregas</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">
                {milestones.length} marcos
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acompanhamento de entregas macro por horizonte temporal e barras de progresso percentual.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsAddingMilestone(!isAddingMilestone)}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-1.5 rounded-xl shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>+ Novo Marco</span>
        </Button>
      </div>

      {/* Formulário Novo Marco */}
      {isAddingMilestone && (
        <form onSubmit={handleAddMilestone} className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 flex items-center gap-3">
          <input
            type="text"
            placeholder="Nome do novo marco de entrega..."
            value={newMilestoneTitle}
            onChange={(e) => setNewMilestoneTitle(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
          />
          <Button type="submit" size="sm" className="bg-sky-500 text-slate-950 font-bold text-xs">
            Salvar Marco
          </Button>
        </form>
      )}

      {/* Lista de Marcos com Barras de Progresso */}
      <div className="space-y-4">
        {milestones.map((m, idx) => {
          // Atribui tarefas por fatia para cálculo de progresso
          const sliceSize = Math.max(1, Math.ceil(tasks.length / milestones.length));
          const milestoneTasks = tasks.slice(idx * sliceSize, (idx + 1) * sliceSize);
          const completedCount = milestoneTasks.filter((t) => doneStatusIds.includes(t.statusId)).length;
          const progressPercent = milestoneTasks.length > 0 ? Math.round((completedCount / milestoneTasks.length) * 100) : 0;

          return (
            <div
              key={m.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl shadow-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold font-mono text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {m.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-sky-400" />
                    <span>Prazo: {m.dueDate}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-bold">
                    {progressPercent}% Concluído
                  </span>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Demandas deste Marco */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                  Demandas vinculadas ({completedCount}/{milestoneTasks.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {milestoneTasks.map((t) => {
                    const isDone = doneStatusIds.includes(t.statusId);
                    return (
                      <div
                        key={t.id}
                        onClick={() => onTaskClick(t)}
                        className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 hover:border-sky-500/30 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${isDone ? "text-emerald-500" : "text-slate-400"}`} />
                          <span className={`truncate font-medium ${isDone ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-200"}`}>
                            {t.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {t.priority}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
