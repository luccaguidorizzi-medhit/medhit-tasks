/**
 * MedHit Integrações & Automações
 * Página de visualização de quadro (Board, List, Table, Backlog).
 * 
 * Inclui proteção resiliente contra exclusão de projetos e slugs inexistentes,
 * fallback visual elegante e auto-redirecionamento para o primeiro projeto ativo.
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useEffect, use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTasks } from "@/context/task-context";
import { ProjectToolbar } from "@/components/layout/project-toolbar";
import { KanbanBoard } from "@/components/boards/kanban-board";
import { TableView } from "@/components/views/table-view";
import { CalendarView } from "@/components/views/calendar-view";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  FolderX,
  Home,
  Plus,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface ProjectViewPageProps {
  params: Promise<{
    area: string;
    project: string;
    view: string;
  }>;
}

export default function ProjectViewPage({ params }: ProjectViewPageProps) {
  const router = useRouter();
  const { area, project, view } = use(params);

  const {
    tasks,
    statuses,
    areas,
    currentProject,
    setCurrentProjectBySlug,
    setSelectedTask,
    setIsNewTaskModalOpen,
    setIsNewBoardModalOpen,
    moveTask,
    updateTask,
    createTask,
    setIsDeleteBoardModalOpen,
    boardToDelete,
    setBoardToDelete,
    isTaskVisibleForCurrentUser,
    hasPermission,
  } = useTasks();

  const canCreateTask = hasPermission("create_task");

  const [activeFilter, setActiveFilter] = useState("all");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Procura se o projeto existe em qualquer squad/área
  const existingProjectMatch = useMemo(() => {
    return areas
      .flatMap((a) => a.projects.map((p) => ({ project: p, area: a })))
      .find((item) => item.project.slug === project);
  }, [areas, project]);

  // Projeto resolvido com segurança absoluta
  const activeProject =
    currentProject && currentProject.slug === project
      ? currentProject
      : existingProjectMatch?.project || null;

  // Primeiro projeto disponível em todo o workspace para fallback automático
  const firstAvailableBoard = useMemo(() => {
    return (
      areas
        .flatMap((a) => a.projects.map((p) => ({ project: p, area: a })))
        .find((item) => item.project.slug !== project) || null
    );
  }, [areas, project]);

  useEffect(() => {
    setCurrentProjectBySlug(area, project);
  }, [area, project, setCurrentProjectBySlug]);

  // Efeito de auto-redirect seguro para o início caso o projeto não exista
  useEffect(() => {
    if (!activeProject) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        router.replace("/medhit");
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setIsRedirecting(false);
    }
  }, [activeProject, router]);

  // Se o projeto foi excluído ou o slug não existe, exibe fallback elegante MedHit
  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] h-full p-8 relative overflow-hidden select-none">
        {/* Glow de fundo espacial */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-20 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="max-w-lg w-full bg-white/80 dark:bg-[#081226]/90 border border-slate-200 dark:border-sky-500/20 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl text-center space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          {/* Badge MedHit */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>MedHit Integrações & Automações • Recuperação Resiliente de Rota</span>
          </div>

          {/* Ícone de Estado */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/20">
            <FolderX className="h-8 w-8" />
          </div>

          {/* Textos Informativos */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Quadro não encontrado ou removido
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              O quadro <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sky-500 font-mono text-[11px]">"{project}"</code> foi excluído ou o endereço informado não está mais associado a esta squad.
            </p>
          </div>

          {/* Feedback de auto-redirecionamento */}
          <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center gap-2.5 text-xs text-sky-600 dark:text-sky-300">
            <Loader2 className="h-4 w-4 animate-spin text-sky-500 shrink-0" />
            <span>
              {firstAvailableBoard
                ? `Redirecionando automaticamente para "${firstAvailableBoard.project.name}"...`
                : "Redirecionando automaticamente para a Home do MedHit..."}
            </span>
          </div>

          {/* Ações manuais imediatas */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/medhit" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full gap-2 text-xs rounded-xl border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <Home className="h-4 w-4 text-slate-400" />
                <span>Voltar para Home</span>
              </Button>
            </Link>

            {firstAvailableBoard && (
              <Button
                onClick={() =>
                  router.replace(
                    `/medhit/${firstAvailableBoard.area.slug}/${firstAvailableBoard.project.slug}/board`
                  )
                }
                className="w-full sm:w-auto gap-2 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl shadow-lg shadow-sky-500/20"
              >
                <span>Acessar Primeiro Quadro</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}

            <Button
              onClick={() => setIsNewBoardModalOpen(true)}
              variant="secondary"
              className="w-full sm:w-auto gap-2 text-xs rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Board</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Filtragem ultra segura das tarefas pertencentes a este projeto respeitando RBAC
  const rawProjectTasks = tasks.filter(
    (t) => t.projectId === activeProject.id && isTaskVisibleForCurrentUser(t)
  );

  const projectTasks = rawProjectTasks.filter((t) => {
    if (activeFilter === "agent") return t.taskType === "agent_task";
    if (activeFilter === "urgent") return t.priority === "urgent";
    return true;
  });

  const handleQuickAdd = (statusId: string, title: string) => {
    if (!canCreateTask) return;
    createTask({
      title,
      statusId,
      projectId: activeProject.id,
      areaId: activeProject.areaId,
      priority: "medium",
      taskType: "task",
    });
  };

  const handleBacklogQuickAdd = (title: string, priority: any) => {
    if (!canCreateTask) return;
    createTask({
      title,
      statusId: statuses[0]?.id,
      projectId: activeProject.id,
      areaId: activeProject.areaId,
      priority,
      taskType: "task",
    });
  };

  const renderView = () => {
    switch (view) {
      case "table":
      case "list":
        return (
          <div className="flex-1 overflow-auto p-6">
            <TableView
              statuses={statuses}
              tasks={projectTasks}
              onTaskClick={setSelectedTask}
              projectId={activeProject.id}
              areaId={activeProject.areaId}
            />
          </div>
        );

      case "calendar":
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <CalendarView
              statuses={statuses}
              tasks={projectTasks}
              onTaskClick={setSelectedTask}
              onQuickAddTask={(statusId, title, dueDate) => {
                createTask({
                  title,
                  statusId: statusId || statuses[0]?.id,
                  projectId: activeProject.id,
                  areaId: activeProject.areaId,
                  priority: "medium",
                  dueDate,
                  taskType: "task",
                });
              }}
            />
          </div>
        );

      case "board":
      default:
        return (
          <div className="flex-1 overflow-hidden p-6">
            <KanbanBoard
              statuses={statuses}
              tasks={projectTasks}
              onTaskClick={setSelectedTask}
              onMoveTask={moveTask}
              onQuickAddTask={handleQuickAdd}
              onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
            />
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
      {/* Esferas de iluminação ambiente espacial */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-2/3 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Barra de Ferramentas da Visão */}
      <ProjectToolbar
        areaSlug={area}
        projectSlug={project}
        projectName={activeProject.name}
        totalTasksCount={rawProjectTasks.length}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
        onDeleteBoard={() => {
          setBoardToDelete(activeProject);
          setIsDeleteBoardModalOpen(true);
        }}
        selectedFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Conteúdo da Visão */}
      {renderView()}
    </div>
  );
}
