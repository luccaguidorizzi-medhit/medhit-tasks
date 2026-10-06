"use client";

import React, { useState, useMemo } from "react";
import { Task, Status } from "@/server/services/data-store";
import {
  AlertTriangle,
  Calendar,
  Users2,
  Trash,
  Plus,
  ArrowRight,
  Sparkles,
  Bot,
  Clock,
  CheckCircle2,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EducationalTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MatrixViewProps {
  statuses: Status[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onQuickAddTask: (statusId: string, title: string, priority?: Task["priority"]) => void;
  onUpdateTaskPriority?: (taskId: string, priority: Task["priority"]) => void;
}

type QuadrantId = "q1" | "q2" | "q3" | "q4";

/**
 * Matriz de Priorização Eisenhower (Urgente vs Importante) - Estilo ClickUp / Monday
 * Desenvolvido pela equipe MedHit Integrações & Automações para MedHit Tasks
 */
export function MatrixView({
  statuses,
  tasks,
  onTaskClick,
  onQuickAddTask,
  onUpdateTaskPriority,
}: MatrixViewProps) {
  const [quickInputQuadrant, setQuickInputQuadrant] = useState<QuadrantId | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  // Categorização nos 4 Quadrantes
  const { q1Tasks, q2Tasks, q3Tasks, q4Tasks } = useMemo(() => {
    const q1: Task[] = [];
    const q2: Task[] = [];
    const q3: Task[] = [];
    const q4: Task[] = [];

    tasks.forEach((t) => {
      if (t.priority === "urgent") {
        q1.push(t);
      } else if (t.priority === "high") {
        q2.push(t);
      } else if (t.priority === "medium" || t.taskType === "agent_task") {
        q3.push(t);
      } else {
        q4.push(t);
      }
    });

    return { q1Tasks: q1, q2Tasks: q2, q3Tasks: q3, q4Tasks: q4 };
  }, [tasks]);

  const total = tasks.length || 1;
  const q1Percent = Math.round((q1Tasks.length / total) * 100);
  const q2Percent = Math.round((q2Tasks.length / total) * 100);
  const q3Percent = Math.round((q3Tasks.length / total) * 100);
  const q4Percent = Math.round((q4Tasks.length / total) * 100);

  const quadrantsConfig = [
    {
      id: "q1" as QuadrantId,
      title: "1. FAZER AGORA",
      subtitle: "Urgente & Importante",
      description: "Crises imediatas, prazos fatais, incidentes em produção e bloqueadores.",
      targetPriority: "urgent" as Task["priority"],
      tasks: q1Tasks,
      percent: q1Percent,
      colorClass: "rose",
      badgeClass: "bg-rose-500/15 text-rose-500 border-rose-500/30",
      cardBorder: "border-rose-500/30 hover:border-rose-500/60",
      bgClass: "bg-rose-500/[0.03] dark:bg-rose-500/[0.05]",
      icon: AlertTriangle,
    },
    {
      id: "q2" as QuadrantId,
      title: "2. AGENDAR & PLANEJAR",
      subtitle: "Importante, Não Urgente",
      description: "Visão estratégica, arquitetura, automações de crescimento e metas futuras.",
      targetPriority: "high" as Task["priority"],
      tasks: q2Tasks,
      percent: q2Percent,
      colorClass: "sky",
      badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      cardBorder: "border-sky-500/30 hover:border-sky-500/60",
      bgClass: "bg-sky-500/[0.03] dark:bg-sky-500/[0.05]",
      icon: Calendar,
    },
    {
      id: "q3" as QuadrantId,
      title: "3. DELEGAR & AUTOMATIZAR",
      subtitle: "Urgente, Não Importante",
      description: "Demandas operacionais, triagem, rotinas para Agentes IA ou colaboradores.",
      targetPriority: "medium" as Task["priority"],
      tasks: q3Tasks,
      percent: q3Percent,
      colorClass: "amber",
      badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
      cardBorder: "border-amber-500/30 hover:border-amber-500/60",
      bgClass: "bg-amber-500/[0.03] dark:bg-amber-500/[0.05]",
      icon: Users2,
    },
    {
      id: "q4" as QuadrantId,
      title: "4. ELIMINAR / DESCARTAR",
      subtitle: "Nem Urgente, Nem Importante",
      description: "Distrações, atividades de baixo retorno e tarefas obsoletas para arquivar.",
      targetPriority: "low" as Task["priority"],
      tasks: q4Tasks,
      percent: q4Percent,
      colorClass: "slate",
      badgeClass: "bg-slate-500/15 text-slate-400 border-slate-500/30",
      cardBorder: "border-slate-500/30 hover:border-slate-500/60",
      bgClass: "bg-slate-500/[0.02] dark:bg-slate-500/[0.03]",
      icon: Trash,
    },
  ];

  const handleCreateInQuadrant = (quadrantId: QuadrantId, priority: Task["priority"]) => {
    if (!quickTitle.trim()) return;
    const defaultStatus = statuses[0]?.id || "";
    onQuickAddTask(defaultStatus, quickTitle.trim(), priority);
    setQuickTitle("");
    setQuickInputQuadrant(null);
    toast.success("Tarefa adicionada ao quadrante da Matriz!");
  };

  const handleChangeQuadrant = (
    taskId: string,
    newPriority: Task["priority"],
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    e.stopPropagation();
    if (onUpdateTaskPriority) {
      onUpdateTaskPriority(taskId, newPriority);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-4 select-none">
      {/* Top Banner de Diagnóstico Estratégico (Metodologia MedHit Tasks) */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl shadow-lg space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Matriz de Priorização Eisenhower</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-semibold">
                  ClickUp / Monday Flow
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organização tática em 4 quadrantes para maximizar impacto e delegar o que for operacional.
              </p>
            </div>
          </div>

          {/* Dica da squad */}
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>Meta recomendada: <strong>&gt;50% em Agendar (Q2)</strong></span>
          </div>
        </div>

        {/* Barra de Distribuição Relativa */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-slate-400">
            <span>DISTRIBUIÇÃO ATUAL</span>
            <div className="flex items-center gap-3">
              <span className="text-rose-500">Q1: {q1Percent}%</span>
              <span className="text-sky-400">Q2: {q2Percent}%</span>
              <span className="text-amber-500">Q3: {q3Percent}%</span>
              <span className="text-slate-400">Q4: {q4Percent}%</span>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden flex">
            <div style={{ width: `${q1Percent}%` }} className="h-full bg-rose-500 transition-all" title="Q1: Fazer Agora" />
            <div style={{ width: `${q2Percent}%` }} className="h-full bg-sky-500 transition-all" title="Q2: Agendar" />
            <div style={{ width: `${q3Percent}%` }} className="h-full bg-amber-500 transition-all" title="Q3: Delegar" />
            <div style={{ width: `${q4Percent}%` }} className="h-full bg-slate-500 transition-all" title="Q4: Eliminar" />
          </div>
        </div>
      </div>

      {/* Grade 2x2 dos 4 Quadrantes */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrantsConfig.map((q) => {
          const Icon = q.icon;
          const isQuickAdding = quickInputQuadrant === q.id;

          return (
            <div
              key={q.id}
              className={cn(
                "rounded-2xl border flex flex-col min-h-0 backdrop-blur-xl shadow-lg transition-all overflow-hidden",
                q.cardBorder,
                q.bgClass
              )}
            >
              {/* Header do Quadrante */}
              <div className="p-3.5 px-4 border-b border-slate-200 dark:border-white/5 bg-white/40 dark:bg-slate-950/40 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-lg border", q.badgeClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {q.title}
                      </h3>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-white/60 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-white/10">
                        {q.tasks.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {q.subtitle}
                    </p>
                  </div>
                </div>

                <EducationalTooltip
                  title={`Adicionar tarefa em ${q.title}`}
                  description={q.description}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuickInputQuadrant(isQuickAdding ? null : q.id);
                      setQuickTitle("");
                    }}
                    className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </EducationalTooltip>
              </div>

              {/* Input Rápido no Quadrante */}
              {isQuickAdding && (
                <div className="p-2.5 border-b border-slate-200 dark:border-white/5 bg-slate-100/60 dark:bg-slate-950/60 flex items-center gap-2 shrink-0 animate-in fade-in">
                  <input
                    autoFocus
                    type="text"
                    placeholder={`+ Nova tarefa para ${q.subtitle}...`}
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateInQuadrant(q.id, q.targetPriority);
                      if (e.key === "Escape") setQuickInputQuadrant(null);
                    }}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs outline-none text-slate-900 dark:text-white"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCreateInQuadrant(q.id, q.targetPriority)}
                    className="h-7 px-2.5 text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                  >
                    Adicionar
                  </Button>
                </div>
              )}

              {/* Lista de Tarefas do Quadrante (com scroll independente) */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
                {q.tasks.map((task) => {
                  const taskIdShort = task.id.replace("task-", "");

                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0c1830]/90 hover:border-sky-500/40 hover:shadow-md transition-all cursor-pointer group space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">
                            #MH-{taskIdShort}
                          </span>
                          {task.taskType === "agent_task" && (
                            <span className="flex items-center gap-1 font-mono text-[9px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded shrink-0">
                              <Bot className="h-2.5 w-2.5" />
                              IA
                            </span>
                          )}
                        </div>

                        {/* Dropdown de Mover de Quadrante */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0"
                        >
                          <select
                            value={task.priority}
                            onChange={(e) =>
                              handleChangeQuadrant(
                                task.id,
                                e.target.value as Task["priority"],
                                e
                              )
                            }
                            className="text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 outline-none cursor-pointer text-slate-600 dark:text-slate-300"
                            title="Alterar quadrante da matriz"
                          >
                            <option value="urgent">Q1: Urgente</option>
                            <option value="high">Q2: Agendar</option>
                            <option value="medium">Q3: Delegar</option>
                            <option value="low">Q4: Eliminar</option>
                          </select>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-sky-400 transition-colors">
                        {task.title}
                      </h4>

                      {/* Metadados: Prazo & Avatares */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-white/5">
                        {task.dueDate ? (
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-slate-400">
                            Sem prazo
                          </span>
                        )}

                        <div className="flex items-center -space-x-1.5">
                          {task.assigneeIds.map((ass) => (
                            <img
                              key={ass.id}
                              src={ass.avatarUrl}
                              alt={ass.name}
                              title={ass.name}
                              className="h-5 w-5 rounded-full border border-white dark:border-slate-900 object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {q.tasks.length === 0 && (
                  <div className="h-full min-h-[90px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-white/5 rounded-xl">
                    <p className="text-xs text-slate-400 font-medium">
                      Nenhuma tarefa neste quadrante.
                    </p>
                    <button
                      onClick={() => {
                        setQuickInputQuadrant(q.id);
                        setQuickTitle("");
                      }}
                      className="mt-1 text-[11px] font-semibold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
