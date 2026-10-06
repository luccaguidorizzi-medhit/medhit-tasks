"use client";

import React, { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useTasks } from "@/context/task-context";
import {
  Layers,
  LayoutDashboard,
  ArrowRight,
  FolderPlus,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EducationalTooltip } from "@/components/ui/tooltip";

interface AreaPageProps {
  params: Promise<{
    area: string;
  }>;
}

export default function AreaPage({ params }: AreaPageProps) {
  const { area: areaSlug } = use(params);
  const { areas, tasks, statuses, setIsNewBoardModalOpen } = useTasks();

  const currentArea = areas.find((a) => a.slug === areaSlug);
  if (!currentArea) {
    return notFound();
  }

  const areaProjects = currentArea.projects;
  const areaTasks = tasks.filter((t) => t.areaId === currentArea.id);
  const doneTasks = areaTasks.filter((t) => {
    const s = statuses.find((st) => st.id === t.statusId);
    return s?.category === "done";
  });
  const completionRate = areaTasks.length > 0 ? Math.round((doneTasks.length / areaTasks.length) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto p-8 space-y-8 relative select-none">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Hero Header da Área / Squad */}
      <div className="rounded-3xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full shadow-xs"
              style={{ backgroundColor: currentArea.color || "#38bdf8" }}
            />
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30 uppercase">
              SQUAD / ÁREA DE TRABALHO
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {currentArea.name}
          </h1>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {currentArea.description || "Gerenciamento estratégico de projetos, entregas e fluxos dedicados a esta área."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsNewBoardModalOpen(true)}
            size="lg"
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-2 shadow-lg shadow-sky-500/30 rounded-xl"
          >
            <FolderPlus className="h-4 w-4" />
            <span>+ Novo Board nesta Squad</span>
          </Button>
        </div>
      </div>

      {/* KPIs da Squad */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block mb-1">
            Projetos Ativos
          </span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{areaProjects.length}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Boards sob gestão desta área
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block mb-1">
            Total de Tarefas
          </span>
          <div className="text-3xl font-extrabold text-sky-500">{areaTasks.length}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Demandas cadastradas
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block mb-1">
            Taxa Geral de Entrega
          </span>
          <div className="text-3xl font-extrabold text-emerald-500">{completionRate}%</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Percentual concluído da squad
          </span>
        </div>
      </div>

      {/* Grid de Projetos da Área */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Quadros / Boards de {currentArea.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {areaProjects.map((proj) => {
            const projTasks = tasks.filter((t) => t.projectId === proj.id);

            return (
              <div
                key={proj.id}
                className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20 flex flex-col justify-between hover:border-sky-500/40 hover:shadow-sky-500/10 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="h-3 w-3 rounded-full shadow-xs"
                      style={{ backgroundColor: proj.color || "#38bdf8" }}
                    />
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold">
                      {proj.methodology?.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-400 transition-colors">
                    {proj.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {proj.description || "Sem descrição informada."}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    {projTasks.length} tarefas
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/medhit/${currentArea.slug}/${proj.slug}/dashboard`}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                    >
                      Métricas
                    </Link>
                    <Link
                      href={`/medhit/${currentArea.slug}/${proj.slug}/board`}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors"
                    >
                      <span>Abrir</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
