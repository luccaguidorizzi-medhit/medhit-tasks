"use client";

import React from "react";
import Link from "next/link";
import { useTasks } from "@/context/task-context";
import {
  Sparkles,
  LayoutDashboard,
  CheckSquare,
  Clock,
  TrendingUp,
  FolderPlus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkspaceHomePage() {
  const {
    areas,
    tasks,
    statuses,
    setIsNewBoardModalOpen,
    setIsNewTaskModalOpen,
    setBoardToDelete,
    setIsDeleteBoardModalOpen,
    isTaskVisibleForCurrentUser,
  } = useTasks();

  const visibleTasks = tasks.filter(isTaskVisibleForCurrentUser);
  const totalTasks = visibleTasks.length;
  const inProgressCount = visibleTasks.filter((t) => {
    const s = statuses.find((st) => st.id === t.statusId);
    return s?.category === "in_progress";
  }).length;
  const urgentCount = visibleTasks.filter((t) => t.priority === "urgent").length;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto p-8 space-y-8 relative select-none">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Hero Welcome Banner */}
      <div className="rounded-3xl border border-slate-200 dark:border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent dark:from-sky-500/15 dark:via-indigo-500/10 p-8 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
              WORKSPACE MEDHIT
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestão de Projetos & Tarefas
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Visão unificada das squads de Marketing, Automação e Novos Produtos. Crie quadros, acompanhe dashboards com métricas em tempo real e orquestre fluxos de trabalho.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsNewBoardModalOpen(true)}
            size="lg"
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-2 shadow-lg shadow-sky-500/30 rounded-xl"
          >
            <FolderPlus className="h-4 w-4" />
            <span>+ Criar Novo Board</span>
          </Button>

          <Button
            onClick={() => setIsNewTaskModalOpen(true)}
            size="lg"
            variant="secondary"
            className="text-xs font-semibold gap-2 rounded-xl"
          >
            <CheckSquare className="h-4 w-4" />
            <span>Nova Tarefa</span>
          </Button>
        </div>
      </div>

      {/* Workspace Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block mb-1">
            Total de Demandas
          </span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalTasks}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Distribuídas em todos os projetos
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block mb-1">
            Em Andamento
          </span>
          <div className="text-3xl font-extrabold text-sky-500">{inProgressCount}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Tarefas em execução ativa
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block mb-1">
            Prioridade Urgente
          </span>
          <div className="text-3xl font-extrabold text-rose-500">{urgentCount}</div>
          <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-semibold block">
            Requerem alinhamento imediato
          </span>
        </div>
      </div>

      {/* Áreas de Trabalho & Quadros Cadastrados */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Quadros & Projetos Ativos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecione um quadro para gerenciar as tarefas no Kanban ou visualizar métricas
            </p>
          </div>

          <Button
            onClick={() => setIsNewBoardModalOpen(true)}
            variant="ghost"
            size="sm"
            className="text-xs text-sky-500 hover:text-sky-400 gap-1.5"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>Criar outro board</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {areas.flatMap((area) =>
            area.projects.map((proj) => {
              const projTasks = tasks.filter((t) => t.projectId === proj.id && isTaskVisibleForCurrentUser(t));

              const doneProjTasks = projTasks.filter((t) => {
                const s = statuses.find((st) => st.id === t.statusId);
                return s?.category === "done";
              });
              const projPct = projTasks.length > 0 ? Math.round((doneProjTasks.length / projTasks.length) * 100) : 0;

              return (
                <div
                  key={proj.id}
                  className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-5 shadow-lg shadow-black/5 dark:shadow-black/20 flex flex-col justify-between hover:border-sky-500/40 hover:shadow-sky-500/10 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shadow-xs"
                          style={{ backgroundColor: proj.color || "#38bdf8" }}
                        />
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                          {area.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                        {projPct}% concluído
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

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBoardToDelete(proj);
                          setIsDeleteBoardModalOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Excluir quadro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        href={`/medhit/${area.slug}/${proj.slug}/dashboard`}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                      >
                        Métricas
                      </Link>
                      <Link
                        href={`/medhit/${area.slug}/${proj.slug}/board`}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors"
                      >
                        <span>Abrir</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
