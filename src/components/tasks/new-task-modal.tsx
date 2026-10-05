"use client";

import React, { useState } from "react";
import {
  X,
  Bot,
  User,
  Cpu,
  Sparkles,
  AlertCircle,
  FolderPlus,
  Tag,
  Plus,
} from "lucide-react";
import { Status } from "@/server/services/data-store";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/context/task-context";
import { EducationalTooltip } from "@/components/ui/tooltip";
import { toast } from "sonner";

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
    storyPoints?: number;
    aiContext?: string;
    tags?: string[];
    projectId?: string;
  }) => void;
}

export function NewTaskModal({
  isOpen,
  onClose,
  statuses,
  currentProjectId,
  onCreateTask,
}: NewTaskModalProps) {
  const { areas, createProject, currentArea } = useTasks();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState(statuses[0]?.id || "");
  const [priority, setPriority] = useState<"urgent" | "high" | "medium" | "low" | "none">("medium");
  const [taskType, setTaskType] = useState<"task" | "bug" | "agent_task">("task");
  const [storyPoints, setStoryPoints] = useState<number | undefined>(3);
  const [aiContext, setAiContext] = useState("");

  // Gestão de Tags e Projetos
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId);

  // Lista de projetos disponíveis para vincular
  const allProjects = areas.flatMap((a) =>
    a.projects.map((p) => ({ ...p, areaSlug: a.slug, areaName: a.name }))
  );

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (!trimmed) return;

    // Verifica se a tag já existe
    if (!tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }

    // Se a tag informada corresponder ou sugerir um novo projeto
    const existingProject = allProjects.find(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase() || p.slug.toLowerCase() === trimmed.toLowerCase()
    );

    if (!existingProject) {
      // Pergunta opcional rápida ou gera projeto contextual se o usuário desejar
      const confirmCreateBoard = window.confirm(
        `A tag "#${trimmed}" é nova! Deseja criar automaticamente um novo Quadro/Projeto para esta tag?`
      );

      if (confirmCreateBoard) {
        const newProj = createProject({
          name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
          areaSlug: currentArea?.slug || "marketing",
          methodology: "kanban",
          color: "#38bdf8",
        });
        setSelectedProjectId(newProj.id);
        toast.success(`Novo projeto "${newProj.name}" gerado a partir da tag!`);
      }
    } else {
      setSelectedProjectId(existingProject.id);
      toast.info(`Vinculado ao projeto existente "${existingProject.name}"`);
    }

    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("O título da demanda é obrigatório");
      return;
    }

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      statusId: statusId || statuses[0].id,
      priority,
      taskType,
      storyPoints,
      aiContext: aiContext.trim() || undefined,
      tags,
      projectId: selectedProjectId,
    });

    toast.success("Demanda criada");
    setTitle("");
    setDescription("");
    setAiContext("");
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl bg-white dark:bg-[#081226] border border-slate-200 dark:border-sky-500/25 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header & Title Input */}
          <div className="p-5 pb-3 space-y-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
                Nova Demanda no Workspace
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              required
              placeholder="Nome da tarefa ou objetivo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-bold bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 px-0"
            />
          </div>

          {/* Description Seamless Input */}
          <div className="px-5 py-3">
            <textarea
              rows={2}
              placeholder="Adicione uma descrição, detalhes ou critérios..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400 resize-none px-0 leading-relaxed"
            />
          </div>

          {/* Seção de Tags e Vinculação a Projetos */}
          <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-950/40 border-t border-slate-100 dark:border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <EducationalTooltip
                title="Tags & Geração de Projetos"
                description="Vincule tags existentes para categorizar a tarefa. Se você digitar uma nova tag, poderá transformá-la automaticamente em um novo Board no MedHit!"
              >
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-help">
                  <Tag className="h-3.5 w-3.5 text-sky-400" />
                  <span>Tags & Vinculação a Boards</span>
                </label>
              </EducationalTooltip>

              {/* Seletor de Projeto de Destino */}
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>Quadro:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                >
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.areaName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags Ativas */}
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-500 transition-colors ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}

              {/* Input Adicionar Tag */}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Digitar tag (#lancamento, #urgente)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none w-56"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleAddTag}
                  className="h-7 px-2 text-xs text-sky-500"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Contexto de IA se for agent_task */}
          {taskType === "agent_task" && (
            <div className="mx-5 my-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
              <span className="text-[10px] font-mono text-purple-600 dark:text-purple-300 flex items-center gap-1.5 font-bold">
                <Cpu className="h-3.5 w-3.5 text-purple-500" />
                Instruções & Contexto Técnico para o Agente IA
              </span>
              <textarea
                rows={2}
                placeholder="Ex: Execute com gemini-2.0-flash, valide idempotência e aplique tom de voz sóbrio."
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                className="w-full text-xs bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none font-mono"
              />
            </div>
          )}

          {/* Action Strip: Horizontal Property Chips com Tooltips Educativos */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 overflow-x-auto select-none">
            {/* Status Chip */}
            <EducationalTooltip
              title="Status do Fluxo"
              description="Define a etapa da demanda dentro do ciclo Kanban do projeto."
            >
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none font-semibold cursor-pointer"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    Status: {s.name}
                  </option>
                ))}
              </select>
            </EducationalTooltip>

            {/* Prioridade Chip */}
            <EducationalTooltip
              title="Prioridade"
              description="Sinaliza a criticidade da entrega para a squad (Urgente, Alta, Média, Baixa)."
            >
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none font-semibold cursor-pointer capitalize"
              >
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
                <option value="none">Nenhuma</option>
              </select>
            </EducationalTooltip>

            {/* Tipo Chip */}
            <EducationalTooltip
              title="Tipo de Responsável"
              description="Alterna se a tarefa será executada por colaboradores humanos ou por agentes autônomos de IA."
            >
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as any)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none font-semibold cursor-pointer"
              >
                <option value="task">Humano</option>
                <option value="agent_task">Agente IA</option>
                <option value="bug">Bug</option>
              </select>
            </EducationalTooltip>

            {/* Pontos */}
            <EducationalTooltip
              title="Story Points"
              description="Estimativa de esforço ou complexidade da tarefa na pontuação Scrum."
            >
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
                <span>Pts:</span>
                <input
                  type="number"
                  value={storyPoints || ""}
                  onChange={(e) => setStoryPoints(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="3"
                  className="w-8 bg-transparent border-none outline-none text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
            </EducationalTooltip>
          </div>

          {/* Footer com Atalhos de Teclado */}
          <div className="px-5 py-3 bg-slate-100/70 dark:bg-slate-950/80 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <div>
              <kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 font-bold">
                ⌘
              </kbd>{" "}
              +{" "}
              <kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 font-bold">
                Enter
              </kbd>{" "}
              para criar · Esc cancela
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs">
                Criar Demanda
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
