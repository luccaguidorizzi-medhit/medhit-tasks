/**
 * MedHit Integrações & Automações
 * Modal Pragmático de Criação de Tarefas (Monday/Linear Style).
 * 
 * Focado na experiência rápida de uso:
 * - Título claro
 * - Descrição direta
 * - Seleção de Responsável, Status, Prioridade e Prazo
 * - Vinculação ao Quadro
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  AlertCircle,
  Tag,
  Plus,
  User,
  FolderKanban,
  CheckCircle2,
} from "lucide-react";
import { Status, Member } from "@/server/services/data-store";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/context/task-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: Status[];
  currentProjectId: string;
  onCreateTask: (data: {
    title: string;
    description: string;
    statusId: string;
    priority: "urgent" | "high" | "medium" | "low" | "none";
    taskType: "task" | "bug" | "agent_task";
    dueDate?: string;
    tags?: string[];
    projectId?: string;
    assigneeIds?: { type: "user" | "agent"; id: string; name: string; avatarUrl: string }[];
  }) => void;
}

export function NewTaskModal({
  isOpen,
  onClose,
  statuses,
  currentProjectId,
  onCreateTask,
}: NewTaskModalProps) {
  const { areas, members, currentUser } = useTasks();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState(statuses[0]?.id || "");
  const [priority, setPriority] = useState<"urgent" | "high" | "medium" | "low" | "none">("none");
  const [dueDate, setDueDate] = useState<string>("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>(currentUser?.id || "");
  const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Lista de projetos disponíveis para vincular
  const allProjects = areas.flatMap((a) =>
    a.projects.map((p) => ({ ...p, areaSlug: a.slug, areaName: a.name }))
  );

  useEffect(() => {
    if (isOpen) {
      setStatusId(statuses[0]?.id || "");
      setSelectedProjectId(currentProjectId || allProjects[0]?.id || "");
    }
  }, [isOpen, statuses, currentProjectId, allProjects]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const setQuickDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const dateStr = d.toISOString().split("T")[0];
    setDueDate(dateStr);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("O título da tarefa é obrigatório");
      return;
    }

    const assignedMember = members.find((m) => m.id === selectedAssigneeId);
    const assignees = assignedMember
      ? [
          {
            type: "user" as const,
            id: assignedMember.id,
            name: assignedMember.name,
            avatarUrl: assignedMember.avatarUrl,
          },
        ]
      : [];

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      statusId: statusId || statuses[0]?.id || "st-todo",
      priority,
      taskType: "task",
      dueDate: dueDate || undefined,
      tags,
      projectId: selectedProjectId,
      assigneeIds: assignees.length > 0 ? assignees : undefined,
    });

    toast.success("Tarefa criada com sucesso!");
    setTitle("");
    setDescription("");
    setDueDate("");
    setTags([]);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit(e);
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#081226] border border-slate-200 dark:border-sky-500/25 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Nova Tarefa
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Título */}
            <div className="space-y-1">
              <input
                type="text"
                autoFocus
                required
                placeholder="Nome da tarefa ou objetivo..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-base font-bold bg-transparent border-b border-slate-200 dark:border-white/10 focus:border-sky-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 pb-2 transition-colors"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1">
              <textarea
                rows={2}
                placeholder="Detalhes ou critérios de aceitação (opcional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none focus:border-sky-500 resize-none transition-colors"
              />
            </div>

            {/* Grid de Propriedades */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Quadro/Projeto */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Quadro / Projeto
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Status Inicial
                </label>
                <select
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responsável */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Responsável
                </label>
                <select
                  value={selectedAssigneeId}
                  onChange={(e) => setSelectedAssigneeId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="">Não Atribuído</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Prioridade */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="none">Normal</option>
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            {/* Prazo de Entrega */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Prazo de Entrega</span>
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate("")}
                    className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                  >
                    Remover data
                  </button>
                )}
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    className="px-2 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-sky-500 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    className="px-2 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-sky-500 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Amanhã
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(7)}
                    className="px-2 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-sky-500 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    +7d
                  </button>
                </div>
              </div>
            </div>

            {/* Tags Rápidas */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Tags
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="+ Adicionar tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none w-32"
                  />
                  {tagInput && (
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="p-1 rounded text-sky-500 hover:bg-sky-500/10 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-bold">
                ⌘
              </kbd>{" "}
              +{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 font-bold">
                Enter
              </kbd>{" "}
              para criar
            </span>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
              >
                Criar Tarefa
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
