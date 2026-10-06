"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Search,
  CheckCircle2,
  BarChart3,
  Layers,
  Kanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkspaceHomePage() {
  const {
    areas,
    tasks,
    statuses,
    currentUser,
    hasPermission,
    setCurrentProject,
    setIsNewBoardModalOpen,
    setIsNewTaskModalOpen,
    setBoardToDelete,
    setIsDeleteBoardModalOpen,
    isTaskVisibleForCurrentUser,
  } = useTasks();

  useEffect(() => {
    setCurrentProject(null);
  }, [setCurrentProject]);

  const [selectedAreaId, setSelectedAreaId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const canCreateBoard = hasPermission("create_board");
  const canCreateTask = hasPermission("create_task");
  const canDeleteBoard = hasPermission("delete_board");

  const visibleTasks = tasks.filter(isTaskVisibleForCurrentUser);
  const totalTasks = visibleTasks.length;

  const inProgressCount = visibleTasks.filter((t) => {
    const s = statuses.find((st) => st.id === t.statusId);
    return s?.category === "in_progress";
  }).length;

  const urgentCount = visibleTasks.filter((t) => t.priority === "urgent").length;

  const completedCount = visibleTasks.filter((t) => {
    const s = statuses.find((st) => st.id === t.statusId);
    return s?.category === "done";
  }).length;

  // Filtra projetos por área e busca
  const filteredProjects = useMemo(() => {
    return areas
      .filter((area) => selectedAreaId === "all" || area.id === selectedAreaId)
      .flatMap((area) =>
        area.projects.map((proj) => ({
          ...proj,
          areaName: area.name,
          areaSlug: area.slug,
        }))
      )
      .filter((proj) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          proj.name.toLowerCase().includes(q) ||
          (proj.description && proj.description.toLowerCase().includes(q)) ||
          proj.areaName.toLowerCase().includes(q)
        );
      });
  }, [areas, selectedAreaId, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto p-6 md:p-8 space-y-8 relative select-none">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Hero Welcome Banner */}
      <div className="rounded-3xl border border-slate-200 dark:border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent dark:from-sky-500/15 dark:via-indigo-500/10 p-6 md:p-8 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
              WORKSPACE MEDHIT
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Olá, <strong className="text-slate-900 dark:text-white">{currentUser.name.split(" ")[0]}</strong>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Bem-vindo ao MedHit Tasks 👋
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Selecione uma área de trabalho abaixo, explore seus quadros e acompanhe métricas de entrega em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {canCreateBoard && (
            <Button
              onClick={() => setIsNewBoardModalOpen(true)}
              size="lg"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-2 shadow-lg shadow-sky-500/30 rounded-xl cursor-pointer"
            >
              <FolderPlus className="h-4 w-4" />
              <span>+ Criar Novo Board</span>
            </Button>
          )}

          {canCreateTask && (
            <Button
              onClick={() => setIsNewTaskModalOpen(true)}
              size="lg"
              variant="secondary"
              className="text-xs font-semibold gap-2 rounded-xl cursor-pointer"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Nova Tarefa</span>
            </Button>
          )}
        </div>
      </div>

      {/* Workspace Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-4 md:p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block mb-1">
            Total de Tarefas
          </span>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">{totalTasks}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            Todas as demandas ativas
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-4 md:p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block mb-1">
            Em Andamento
          </span>
          <div className="text-2xl md:text-3xl font-extrabold text-sky-500">{inProgressCount}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            Em execução ativa
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-4 md:p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block mb-1">
            Urgentes
          </span>
          <div className="text-2xl md:text-3xl font-extrabold text-rose-500">{urgentCount}</div>
          <span className="text-[10px] text-rose-500 dark:text-rose-400 mt-1 font-semibold block">
            Requerem atenção
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl p-4 md:p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider block mb-1">
            Concluídas
          </span>
          <div className="text-2xl md:text-3xl font-extrabold text-emerald-500">{completedCount}</div>
          <span className="text-[10px] text-emerald-500 dark:text-emerald-400 mt-1 font-semibold block">
            Entregas finalizadas
          </span>
        </div>
      </div>

      {/* Seleção de Área de Trabalho & Filtros */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-500" />
              <span>Áreas de Trabalho & Quadros</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Filtre por squad ou utilize a busca para acessar seu quadro
            </p>
          </div>

          {/* Campo de Busca Rápida de Projetos */}
          <div className="relative w-full md:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar quadros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#0c1830] border border-slate-200 dark:border-sky-500/20 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500 transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* Pílulas de Seleção de Área de Trabalho */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedAreaId("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedAreaId === "all"
                ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
                : "bg-white/80 dark:bg-[#0c1830]/80 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Todas as Áreas ({areas.reduce((acc, a) => acc + a.projects.length, 0)})
          </button>

          {areas.map((area) => (
            <button
              key={area.id}
              onClick={() => setSelectedAreaId(area.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedAreaId === area.id
                  ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
                  : "bg-white/80 dark:bg-[#0c1830]/80 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: area.color || "#38bdf8" }}
              />
              <span>{area.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({area.projects.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Quadros & Projetos */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center space-y-3 bg-white/40 dark:bg-[#081226]/40">
            <Kanban className="h-8 w-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Nenhum quadro encontrado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Não encontramos projetos para os filtros selecionados. Crie um novo quadro para começar.
            </p>
            {canCreateBoard && (
              <Button
                onClick={() => setIsNewBoardModalOpen(true)}
                size="sm"
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl"
              >
                + Criar Novo Board
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((proj) => {
              const projTasks = tasks.filter(
                (t) => t.projectId === proj.id && isTaskVisibleForCurrentUser(t)
              );

              const doneProjTasks = projTasks.filter((t) => {
                const s = statuses.find((st) => st.id === t.statusId);
                return s?.category === "done";
              });
              const projPct =
                projTasks.length > 0
                  ? Math.round((doneProjTasks.length / projTasks.length) * 100)
                  : 0;

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
                          {proj.areaName}
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

                    {/* Barra de Progresso Visual */}
                    <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${projPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">
                      {projTasks.length} {projTasks.length === 1 ? "tarefa" : "tarefas"}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {canDeleteBoard && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBoardToDelete(proj);
                            setIsDeleteBoardModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Excluir quadro"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <Link
                        href={`/medhit/${proj.areaSlug}/${proj.slug}/dashboard`}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                      >
                        Métricas
                      </Link>
                      <Link
                        href={`/medhit/${proj.areaSlug}/${proj.slug}/board`}
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
        )}
      </div>

      {/* Rodapé com Assinatura */}
      <footer className="pt-8 pb-4 text-center border-t border-slate-200/60 dark:border-white/5 text-[11px] font-mono text-slate-400 dark:text-slate-500">
        MedHit Tasks by Integrações & Automações
      </footer>
    </div>
  );
}

