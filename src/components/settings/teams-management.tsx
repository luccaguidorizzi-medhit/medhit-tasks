/**
 * MedHit Integrações & Automações
 * Gestão de Áreas de Trabalho & Times (Workspaces / Squads).
 *
 * Permite criar, editar e excluir áreas de trabalho do workspace,
 * com controle de permissão RBAC e feedback visual imediato.
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTasks } from "@/context/task-context";
import { Area } from "@/server/services/data-store";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Palette,
  X,
  Check,
  Building2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLOR_OPTIONS = [
  { label: "Sky Blue", value: "#38bdf8" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Purple", value: "#a855f7" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Indigo", value: "#6366f1" },
  { label: "Teal", value: "#14b8a6" },
];

export function TeamsManagement() {
  const {
    areas,
    tasks,
    currentUser,
    hasPermission,
    createTeam,
    updateTeam,
    deleteTeam,
  } = useTasks();

  const canCreate = hasPermission("create_team") || currentUser.role === "owner" || currentUser.role === "admin";
  const canDelete = hasPermission("delete_team") || currentUser.role === "owner" || currentUser.role === "admin";
  const canEdit = canCreate;

  // Estados de Criação / Edição
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("#38bdf8");

  // Estado de Confirmação de Exclusão
  const [deletingArea, setDeletingArea] = useState<Area | null>(null);

  const handleOpenCreate = () => {
    setFormName("");
    setFormDescription("");
    setFormColor("#38bdf8");
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (area: Area) => {
    setEditingArea(area);
    setFormName(area.name);
    setFormDescription(area.description || "");
    setFormColor(area.color || "#38bdf8");
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Informe o nome da área de trabalho");
      return;
    }

    createTeam({
      name: formName.trim(),
      description: formDescription.trim(),
      color: formColor,
      icon: "users",
    });

    setIsCreateModalOpen(false);
    setFormName("");
    setFormDescription("");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea) return;
    if (!formName.trim()) {
      toast.error("Informe o nome da área de trabalho");
      return;
    }

    updateTeam(editingArea.id, {
      name: formName.trim(),
      description: formDescription.trim(),
      color: formColor,
    });

    setEditingArea(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingArea) return;
    if (areas.length <= 1) {
      toast.error("O workspace precisa ter pelo menos uma área de trabalho ativa.");
      setDeletingArea(null);
      return;
    }

    const removedSlug = deletingArea.slug;
    deleteTeam(deletingArea.id);
    setDeletingArea(null);

    if (typeof window !== "undefined" && window.location.pathname.includes(removedSlug)) {
      window.location.href = "/medhit";
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-500 border border-sky-500/30">
              CONFIGURAÇÃO DE TIMES & ÁREAS
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sky-400" />
            <span>Áreas de Trabalho & Equipes</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie, crie e exclua áreas de trabalho departamentais e squads da Medhit WorkTrack.
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md shadow-sky-500/20 rounded-xl cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Nova Área de Trabalho</span>
          </Button>
        )}
      </div>

      {/* Grid de Áreas de Trabalho */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {areas.map((area) => {
          const areaTasks = tasks.filter((t) => t.areaId === area.id);
          const totalProjects = area.projects?.length || 0;
          const completedTasks = areaTasks.filter((t) => {
            const hasCompletedChecklist =
              t.checklists.length > 0 &&
              t.checklists.every((c) => c.items.every((i) => i.isCompleted));
            return hasCompletedChecklist;
          }).length;

          return (
            <div
              key={area.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl shadow-sm hover:border-sky-500/30 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Topo do Card */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0"
                      style={{ backgroundColor: area.color || "#38bdf8" }}
                    >
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {area.name}
                        </h3>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          /{area.slug}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {area.description || "Área de trabalho departamental no Medhit WorkTrack."}
                      </p>
                    </div>
                  </div>

                  {/* Ações: Editar e Excluir */}
                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(area)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 transition-colors cursor-pointer"
                        title="Editar Área de Trabalho"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeletingArea(area)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title={
                          areas.length <= 1
                            ? "Não é possível excluir a única área existente"
                            : "Excluir Área de Trabalho"
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Badges de Métricas */}
                <div className="flex items-center gap-2 text-xs font-mono pt-1">
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300">
                    <FolderKanban className="h-3.5 w-3.5 text-sky-400" />
                    <span>
                      {totalProjects} {totalProjects === 1 ? "projeto" : "projetos"}
                    </span>
                  </span>

                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{areaTasks.length} tarefas</span>
                  </span>
                </div>
              </div>

              {/* Rodapé: Links dos Projetos e Acesso Direto */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {area.projects?.slice(0, 3).map((proj) => (
                    <Link
                      key={proj.id}
                      href={`/medhit/${area.slug}/${proj.slug}/board`}
                      className="text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-sky-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md transition-colors"
                    >
                      {proj.name}
                    </Link>
                  ))}
                  {totalProjects > 3 && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      +{totalProjects - 3} mais
                    </span>
                  )}
                </div>

                <Link
                  href={`/medhit/${area.slug}`}
                  className="text-xs font-bold text-sky-500 dark:text-sky-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Abrir Área</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Criar Nova Área */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#081226] border border-slate-200 dark:border-sky-500/25 rounded-2xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Nova Área de Trabalho / Time
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Crie um departamento para hospedar seus quadros
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCreate} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nome da Área *
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ex: Comercial, Novos Negócios, Operações, Jurídico..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Descrição / Objetivo
                </label>
                <textarea
                  rows={2}
                  placeholder="Descreva as atribuições desta área de trabalho..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette className="h-3 w-3 text-sky-400" />
                  <span>Cor de Destaque</span>
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormColor(c.value)}
                      className={`h-7 w-7 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                        formColor === c.value
                          ? "ring-2 ring-white scale-110 shadow-md"
                          : "opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-white/10">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 cursor-pointer"
                >
                  Criar Área
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Área */}
      {editingArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#081226] border border-slate-200 dark:border-sky-500/25 rounded-2xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Editar Área de Trabalho
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Altere nome, descrição e cor identificadora
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingArea(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nome da Área *
                </label>
                <input
                  autoFocus
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette className="h-3 w-3 text-sky-400" />
                  <span>Cor de Destaque</span>
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormColor(c.value)}
                      className={`h-7 w-7 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                        formColor === c.value
                          ? "ring-2 ring-white scale-110 shadow-md"
                          : "opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-white/10">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingArea(null)}
                  className="text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 cursor-pointer"
                >
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmação de Exclusão de Área */}
      {deletingArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#081226] border border-rose-500/30 rounded-2xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 px-6 border-b border-rose-500/20 flex items-center gap-2.5 bg-rose-500/10">
              <div className="h-8 w-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-500">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  Excluir Área de Trabalho
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta ação é irreversível
                </p>
              </div>
            </div>

            <div className="p-6 space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <p>
                Tem certeza de que deseja excluir a área de trabalho{" "}
                <strong className="text-slate-900 dark:text-white underline">
                  {deletingArea.name}
                </strong>
                ?
              </p>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Atenção:</span>
                </div>
                <div>
                  Todos os projetos ({deletingArea.projects?.length || 0}) e demandas desta equipe serão removidos permanentemente.
                </div>
              </div>
            </div>

            <div className="p-4 px-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeletingArea(null)}
                className="text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                Sim, Excluir Área
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
