/**
 * MedHit Integrações & Automações
 * Visão Geral & Métricas do Projeto (Estilo Monday.com Dashboard).
 * 
 * Painel executivo e visual de acompanhamento:
 * - Taxa de Conclusão e progresso real
 * - Demandas em andamento e urgências
 * - Carga de horas estimadas da equipe
 * - Rollup visual de status
 * - Alocação por membros da equipe
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { use } from "react";
import { useTasks } from "@/context/task-context";
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  Users,
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
    areas,
    currentProject,
    setCurrentProjectBySlug,
    setIsNewTaskModalOpen,
    setBoardToDelete,
    setIsDeleteBoardModalOpen,
    isTaskVisibleForCurrentUser,
  } = useTasks();

  React.useEffect(() => {
    setCurrentProjectBySlug(area, project);
  }, [area, project, setCurrentProjectBySlug]);

  const existingProjectMatch = React.useMemo(() => {
    return areas
      .flatMap((a) => a.projects.map((p) => ({ project: p, area: a })))
      .find((item) => item.project.slug === project);
  }, [areas, project]);

  const activeProject =
    currentProject && currentProject.slug === project
      ? currentProject
      : existingProjectMatch?.project || null;

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] h-full p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Carregando métricas do projeto...</h2>
        <p className="text-xs text-slate-500">Se o projeto foi removido, você será redirecionado para o workspace.</p>
      </div>
    );
  }

  const projectTasks = tasks.filter(
    (t) => t.projectId === activeProject.id && isTaskVisibleForCurrentUser(t)
  );

  // Métricas do projeto
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
  const totalHours = projectTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Toolbar do Projeto (Alinhada no Topo) */}
      <ProjectToolbar
        areaSlug={area}
        projectSlug={project}
        projectName={activeProject.name}
        totalTasksCount={totalTasks}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
        onDeleteBoard={() => {
          setBoardToDelete(activeProject);
          setIsDeleteBoardModalOpen(true);
        }}
      />

      {/* Conteúdo Rolável do Dashboard */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Cards Superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Taxa de Conclusão */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Taxa de Conclusão</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{completionRate}%</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-semibold">{doneTasks.length}</span> de {totalTasks} demandas concluídas
            </div>
          </div>

          {/* 2. Em Andamento */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Em Andamento</span>
              <TrendingUp className="h-4 w-4 text-sky-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{inProgressTasks.length}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Demandas em execução no ciclo atual
            </div>
          </div>

          {/* 3. Demandas Urgentes */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Urgentes / Atenção</span>
              <Flame className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{urgentTasks.length}</div>
            <div className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-semibold">
              Requerem prioridade da equipe
            </div>
          </div>

          {/* 4. Tempo Estimado */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Tempo Estimado</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalHours}h</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Carga total planejada em horas
            </div>
          </div>
        </div>

        {/* Grid Principal: Rollup por Status e Alocação da Equipe */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por Status (Monday Rollup) */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sky-500" />
              <span>Distribuição por Status</span>
            </h3>

            <div className="space-y-3 pt-1">
              {statuses.map((status) => {
                const count = projectTasks.filter((t) => t.statusId === status.id).length;
                const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

                return (
                  <div key={status.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
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

          {/* Visão de Responsáveis & Entregas */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />
              <span>Atribuição & Demandas Recentes</span>
            </h3>

            <div className="space-y-2.5 pt-1">
              {projectTasks.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-8">
                  Nenhuma tarefa registrada neste projeto.
                </div>
              ) : (
                projectTasks.slice(0, 6).map((task) => {
                  const taskStatus = statuses.find((s) => s.id === task.statusId);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: taskStatus?.color || "#38bdf8" }}
                        />
                        <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {task.assigneeIds.map((ass) => (
                          <div key={ass.id} className="flex items-center gap-1.5" title={ass.name}>
                            <img src={ass.avatarUrl} alt={ass.name} className="h-5 w-5 rounded-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
