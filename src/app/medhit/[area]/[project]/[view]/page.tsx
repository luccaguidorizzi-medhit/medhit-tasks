"use client";

import React, { useEffect, use, useState } from "react";
import { useTasks } from "@/context/task-context";
import { ProjectToolbar } from "@/components/layout/project-toolbar";
import { KanbanBoard } from "@/components/boards/kanban-board";
import { ListView } from "@/components/views/list-view";
import { TableView } from "@/components/views/table-view";
import { CalendarView } from "@/components/views/calendar-view";
import { AgileView } from "@/components/views/agile-view";
import { BacklogView } from "@/components/views/backlog-view";
import { DeleteBoardModal } from "@/components/boards/delete-board-modal";

interface ProjectViewPageProps {
  params: Promise<{
    area: string;
    project: string;
    view: string;
  }>;
}

export default function ProjectViewPage({ params }: ProjectViewPageProps) {
  const { area, project, view } = use(params);
  const {
    tasks,
    statuses,
    currentProject,
    setCurrentProjectBySlug,
    setSelectedTask,
    setIsNewTaskModalOpen,
    moveTask,
    createTask,
    isDeleteBoardModalOpen,
    setIsDeleteBoardModalOpen,
    boardToDelete,
    setBoardToDelete,
  } = useTasks();

  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    setCurrentProjectBySlug(area, project);
  }, [area, project, setCurrentProjectBySlug]);

  const rawProjectTasks = tasks.filter((t) => t.projectId === currentProject.id);

  // Filtra as tarefas exibidas
  const projectTasks = rawProjectTasks.filter((t) => {
    if (activeFilter === "agent") return t.taskType === "agent_task";
    if (activeFilter === "urgent") return t.priority === "urgent";
    return true;
  });

  const handleQuickAdd = (statusId: string, title: string) => {
    createTask({
      title,
      statusId,
      priority: "medium",
      taskType: "task",
    });
  };

  const handleBacklogQuickAdd = (title: string, priority: any) => {
    createTask({
      title,
      statusId: statuses[0]?.id,
      priority,
      taskType: "task",
    });
  };

  const renderView = () => {
    switch (view) {
      case "backlog":
        return (
          <BacklogView
            statuses={statuses}
            tasks={rawProjectTasks}
            onTaskClick={setSelectedTask}
            onMoveToBoard={moveTask}
            onQuickAddTask={handleBacklogQuickAdd}
          />
        );

      case "list":
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <ListView
              statuses={statuses}
              tasks={projectTasks}
              onTaskClick={setSelectedTask}
              onQuickAddTask={handleQuickAdd}
            />
          </div>
        );

      case "table":
        return (
          <div className="flex-1 overflow-auto p-6">
            <TableView
              statuses={statuses}
              tasks={projectTasks}
              onTaskClick={setSelectedTask}
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
      {/* Esferas de iluminação ambiente espacial (como no fundo da imagem de referência) */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-2/3 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Barra de Ferramentas da Visão */}
      <ProjectToolbar
        areaSlug={area}
        projectSlug={project}
        projectName={currentProject.name}
        totalTasksCount={rawProjectTasks.length}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
        onDeleteBoard={() => {
          setBoardToDelete(currentProject);
          setIsDeleteBoardModalOpen(true);
        }}
        selectedFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Conteúdo da Visão */}
      {renderView()}

      {/* Modal de Exclusão do Board */}
      <DeleteBoardModal
        isOpen={isDeleteBoardModalOpen}
        onClose={() => setIsDeleteBoardModalOpen(false)}
        project={boardToDelete || currentProject}
      />
    </div>
  );
}
