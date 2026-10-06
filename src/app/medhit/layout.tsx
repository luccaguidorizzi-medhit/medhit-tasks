"use client";

import React from "react";
import { TaskProvider, useTasks } from "@/context/task-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { TaskDrawer } from "@/components/tasks/task-drawer";
import { NewTaskModal } from "@/components/tasks/new-task-modal";
import { NewBoardModal } from "@/components/boards/new-board-modal";
import { NewTeamModal } from "@/components/teams/new-team-modal";
import { DeleteBoardModal } from "@/components/boards/delete-board-modal";

function MedhitShell({ children }: { children: React.ReactNode }) {
  const {
    currentArea,
    currentProject,
    selectedTask,
    isNewTaskModalOpen,
    isNewBoardModalOpen,
    isNewTeamModalOpen,
    isDeleteBoardModalOpen,
    boardToDelete,
    statuses,
    members,
    agents,
    approvals,
    setSelectedTask,
    setIsNewTaskModalOpen,
    setIsNewBoardModalOpen,
    setIsNewTeamModalOpen,
    setIsDeleteBoardModalOpen,
    updateTask,
    deleteTask,
    addComment,
    toggleChecklist,
    createTask,
  } = useTasks();

  const pendingApprovalsCount = approvals.filter((a) => a.status === "pending").length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-transparent text-foreground transition-colors duration-200">
      {/* Sidebar Fixa à Esquerda */}
      <Sidebar
        currentAreaSlug={currentArea?.slug || "marketing"}
        currentProjectSlug={currentProject?.slug || ""}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Topbar Global */}
        <Topbar
          areaSlug={currentArea?.slug || ""}
          areaName={currentArea?.name || ""}
          projectSlug={currentProject?.slug || ""}
          projectName={currentProject?.name || ""}
          onOpenNewTask={() => setIsNewTaskModalOpen(true)}
        />

        {/* Viewport da Página */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Slide-over Task Inspector Drawer */}
      <TaskDrawer
        task={selectedTask}
        statuses={statuses}
        members={members}
        agents={agents}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        onAddComment={addComment}
        onToggleChecklist={toggleChecklist}
      />

      {/* Modal Criar Tarefa */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        statuses={statuses}
        currentProjectId={currentProject?.id || ""}
        onCreateTask={createTask}
      />

      {/* Modal Criar Novo Board */}
      <NewBoardModal
        isOpen={isNewBoardModalOpen}
        onClose={() => setIsNewBoardModalOpen(false)}
      />

      {/* Modal Criar Novo Time / Squad */}
      <NewTeamModal
        isOpen={isNewTeamModalOpen}
        onClose={() => setIsNewTeamModalOpen(false)}
      />

      {/* Modal Excluir Board */}
      <DeleteBoardModal
        isOpen={isDeleteBoardModalOpen}
        onClose={() => setIsDeleteBoardModalOpen(false)}
        project={boardToDelete || currentProject || null}
      />
    </div>
  );
}

export default function MedhitLayout({ children }: { children: React.ReactNode }) {
  return (
    <TaskProvider>
      <MedhitShell>{children}</MedhitShell>
    </TaskProvider>
  );
}
