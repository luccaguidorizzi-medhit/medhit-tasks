"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/context/task-context";
import { Project } from "@/server/services/data-store";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export function DeleteBoardModal({ isOpen, onClose, project }: DeleteBoardModalProps) {
  const router = useRouter();
  const { deleteProject, tasks } = useTasks();

  if (!isOpen || !project) return null;

  const projectTasksCount = tasks.filter((t) => t.projectId === project.id).length;

  const handleDelete = () => {
    deleteProject(project.id);
    onClose();
    router.push("/");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#081226] border border-rose-500/30 rounded-2xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 border-b border-rose-500/20 flex items-center justify-between bg-rose-500/5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Excluir Projeto</h2>
              <p className="text-xs text-rose-500/90 font-medium">Ação irreversível</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              Você está prestes a excluir o projeto <strong>"{project.name}"</strong>.
              {projectTasksCount > 0 ? (
                <span> Todas as <strong>{projectTasksCount}</strong> tarefas deste projeto serão removidas permanentemente.</span>
              ) : (
                <span> Não há tarefas associadas a este projeto.</span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Tem certeza absoluta que deseja prosseguir com a exclusão?
          </p>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Sim, Excluir Projeto</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
