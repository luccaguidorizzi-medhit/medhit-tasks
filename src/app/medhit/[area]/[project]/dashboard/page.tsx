"use client";

import React, { use } from "react";
import { useTasks } from "@/context/task-context";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Users,
  Layers,
  Flame,
} from "lucide-react";
import { ProjectToolbar } from "@/components/layout/project-toolbar";
import { EducationalTooltip } from "@/components/ui/tooltip";

interface ProjectDashboardPageProps {
  params: Promise<{
    area: string;
    project: string;
  }>;
}

export default function ProjectDashboardPage({ params }: ProjectDashboardPageProps) {
  const { area, project } = use(params);
  const {
    tasks,
    statuses,
    currentProject,
    setCurrentProjectBySlug,
    setIsNewTaskModalOpen,
  } = useTasks();

  React.useEffect(() => {
    setCurrentProjectBySlug(area, project);
  }, [area, project, setCurrentProjectBySlug]);

  const projectTasks = tasks.filter((t) => t.projectId === currentProject.id);

  // Métricas de progresso
  const totalTasks = projectTasks.length;
  const doneTasks = projectTasks.filter((t) => {
    const s = statuses.find((st) => st.id === t.statusId);
    return s?.category === "done";
  });
  const inProgressTasks = projectTasks.filter((t) => {
    const s = statuses.find((st) => st.id === t.statusId);
    return s?.category === "in_progress";
  });
  const urgentTasks = projectTasks.filter((t) => t.priority === "urgent");
  const completionRate = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;
  const totalPoints = projectTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto relative p-6 space-y-6">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Toolbar do Projeto */}
      <ProjectToolbar
        areaSlug={area}
        projectSlug={project}
        projectName={currentProject.name}
        totalTasksCount={totalTasks}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
      />

      {/* KPI Cards Superiores com Educational Tooltips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Taxa de Conclusão */}
        <EducationalTooltip
          title="Taxa de Conclusão (Burnup)"
          description="Percentual de demandas que atingiram o status final 'Concluído' em relação ao escopo total do projeto."
        >
          <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-4 shadow-lg shadow-black/5 dark:shadow-black/20 cursor-help">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Taxa de Conclusão</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{completionRate}%</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-semibold">{doneTasks.length}</span> de {totalTasks} tarefas concluídas
            </div>
          </div>
        </EducationalTooltip>

        {/* 2. Em Andamento */}
        <EducationalTooltip
          title="Trabalho em Progresso (WIP)"
          description="Número de tarefas que a equipe está executando ativamente agora. Ideal manter baixo para evitar gargalos."
        >
          <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-4 shadow-lg shadow-black/5 dark:shadow-black/20 cursor-help">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Em Andamento</span>
              <TrendingUp className="h-4 w-4 text-sky-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{inProgressTasks.length}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              Tarefas sendo executadas no ciclo atual
            </div>
          </div>
        </EducationalTooltip>

        {/* 3. Urgentes / Bloqueios */}
        <EducationalTooltip
          title="Demandas Críticas / Bloqueantes"
          description="Tarefas com prioridade urgente que requerem atenção prioritária do líder técnico ou médico."
        >
          <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-4 shadow-lg shadow-black/5 dark:shadow-black/20 cursor-help">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Críticas / Urgentes</span>
              <Flame className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{urgentTasks.length}</div>
            <div className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-semibold">
              Requerem atenção prioritária da equipe
            </div>
          </div>
        </EducationalTooltip>

        {/* 4. Story Points & Capacidade */}
        <EducationalTooltip
          title="Carga de Esforço (Story Points)"
          description="Soma do peso relativo das tarefas estimada pela equipe segundo o framework ágil Fibonacci."
        >
          <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-4 shadow-lg shadow-black/5 dark:shadow-black/20 cursor-help">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Story Points</span>
              <Layers className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalPoints} pts</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Carga total estimada no backlog
            </div>
          </div>
        </EducationalTooltip>
      </div>

      {/* Grid Principal: Distribuição por Colunas (Monday Style Rollup) e Membros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Status */}
        <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20 space-y-4">
          <EducationalTooltip
            title="Rollup de Status (Estilo Monday.com)"
            description="Exibe a proporção exata de tarefas em cada estágio do pipeline, permitindo identificar onde o fluxo está acumulando."
          >
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2 cursor-help">
              <BarChart3 className="h-4 w-4 text-sky-400" />
              Distribuição por Status (Monday Rollup)
            </h3>
          </EducationalTooltip>

          <div className="space-y-3">
            {statuses.map((status) => {
              const count = projectTasks.filter((t) => t.statusId === status.id).length;
              const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

              return (
                <div key={status.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color }} />
                      <span>{status.name}</span>
                    </div>
                    <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: status.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visão de Responsáveis & Alocação */}
        <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20 space-y-4">
          <EducationalTooltip
            title="Distribuição da Squad"
            description="Visualização de quais profissionais ou agentes autônomos estão com maior volume de demandas sob sua responsabilidade."
          >
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2 cursor-help">
              <Users className="h-4 w-4 text-emerald-400" />
              Alocação da Squad & Agentes
            </h3>
          </EducationalTooltip>

          <div className="space-y-3">
            {projectTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 text-xs"
              >
                <div className="truncate max-w-xs font-medium text-slate-800 dark:text-slate-200">
                  {task.title}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {task.assigneeIds.map((ass) => (
                    <div key={ass.id} className="flex items-center gap-1.5">
                      <img src={ass.avatarUrl} alt={ass.name} className="h-5 w-5 rounded-full object-cover" />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{ass.name.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
