"use client";

import React, { useState } from "react";
import {
  X,
  Bot,
  User,
  Cpu,
  CheckSquare,
  Plus,
  Trash2,
  Send,
  Calendar,
  AlertCircle,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Minus,
  Clock,
  Sparkles,
  ChevronDown,
  Hash,
} from "lucide-react";
import { Task, Status, Member, Agent } from "@/server/services/data-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTasks } from "@/context/task-context";

interface TaskDrawerProps {
  task: Task | null;
  statuses: Status[];
  members: Member[];
  agents: Agent[];
  onClose: () => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onAddComment: (taskId: string, content: string) => void;
  onToggleChecklist: (taskId: string, checklistId: string, itemId: string) => void;
}

export function TaskDrawer({
  task,
  statuses,
  members,
  agents,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
  onToggleChecklist,
}: TaskDrawerProps) {
  const [newComment, setNewComment] = useState("");
  const [newChecklistText, setNewChecklistText] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);

  const { hasPermission } = useTasks();
  const canDeleteTask = hasPermission("delete_task");
  const canEditTask = hasPermission("edit_task");

  if (!task) return null;

  const currentStatus = statuses.find((s) => s.id === task.statusId) || statuses[0];
  const taskIdShort = task.id.replace("task-", "");

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value !== task.title) {
      onUpdateTask(task.id, { title: e.target.value });
      toast.success("Título atualizado");
    }
  };

  const handleDescBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (e.target.value !== task.description) {
      onUpdateTask(task.id, { description: e.target.value });
      toast.success("Descrição salva");
    }
  };

  const handleAiContextBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (e.target.value !== task.aiContext) {
      onUpdateTask(task.id, { aiContext: e.target.value });
      toast.success("Diretrizes de IA salvas");
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(task.id, newComment.trim());
    setNewComment("");
    toast.success("Comentário registrado");
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const checklist = task.checklists[0] || {
      id: `chk-${Date.now()}`,
      taskId: task.id,
      title: "Critérios de Aceite",
      items: [],
    };
    const updatedChecklists = [...task.checklists];
    if (!task.checklists[0]) {
      updatedChecklists.push(checklist);
    }
    checklist.items.push({
      id: `chk-item-${Date.now()}`,
      checklistId: checklist.id,
      title: newChecklistText.trim(),
      isCompleted: false,
    });
    onUpdateTask(task.id, { checklists: updatedChecklists });
    setNewChecklistText("");
    toast.success("Critério adicionado");
  };

  const renderPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className="h-3.5 w-3.5 text-rose-400" />;
      case "high":
        return <SignalHigh className="h-3.5 w-3.5 text-zinc-300" />;
      case "medium":
        return <SignalMedium className="h-3.5 w-3.5 text-zinc-400" />;
      case "low":
        return <SignalLow className="h-3.5 w-3.5 text-zinc-500" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-zinc-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0c0d10] border-l border-white/[0.08] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Top Header Barra de Ações */}
        <div className="h-12 px-6 border-b border-white/[0.06] flex items-center justify-between bg-[#0a0b0d] shrink-0 select-none">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-zinc-500 font-semibold flex items-center gap-1">
              <Hash className="h-3.5 w-3.5 text-zinc-600" />
              MH-{taskIdShort}
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-xs text-zinc-400 font-medium">
              {task.taskType === "agent_task" ? "Tarefa de Agente IA" : "Tarefa Humana"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {canDeleteTask && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("Deseja realmente excluir esta tarefa?")) {
                    onDeleteTask(task.id);
                    onClose();
                  }
                }}
                className="h-7 w-7 text-zinc-500 hover:text-rose-400"
                title="Excluir tarefa"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 text-zinc-500 hover:text-zinc-200"
              title="Fechar (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Layout 2 Colunas: Conteúdo Principal (68%) & Inspector Sidebar (32%) */}
        <div className="flex-1 flex overflow-hidden">
          {/* COLUNA ESQUERDA: TÍTULO, DESCRIÇÃO, IA GUIDELINES, CHECKLIST, COMENTÁRIOS */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Título sem bordas */}
            <div>
              <input
                type="text"
                defaultValue={task.title}
                onBlur={handleTitleBlur}
                disabled={!canEditTask}
                className={cn(
                  "w-full text-lg font-semibold bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-600 focus:ring-0 px-0 transition-all leading-tight",
                  !canEditTask && "cursor-default opacity-85"
                )}
                placeholder="Título da demanda..."
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider">
                Descrição
              </span>
              <textarea
                defaultValue={task.description}
                onBlur={handleDescBlur}
                disabled={!canEditTask}
                rows={3}
                placeholder="Adicione detalhes, escopo ou especificações..."
                className={cn(
                  "w-full bg-[#111215] border border-white/[0.06] rounded-lg p-3 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-white/20 resize-y leading-relaxed transition-colors",
                  !canEditTask && "cursor-default opacity-85"
                )}
              />
            </div>

            {/* Diretrizes & Contexto para Agente de IA */}
            <div className="rounded-lg border border-white/[0.07] bg-[#101114] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-zinc-300 flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                  Diretrizes & Contexto Técnico para IA
                </span>
                <span className="text-[10px] font-mono text-zinc-500">System Prompt Injection</span>
              </div>
              <textarea
                defaultValue={task.aiContext || ""}
                onBlur={handleAiContextBlur}
                disabled={!canEditTask}
                rows={2}
                placeholder="Instruções de tom de voz, conformidade ética CFM ou validação técnica de webhook..."
                className={cn(
                  "w-full bg-[#0a0b0d] border border-white/[0.05] rounded-md p-2.5 text-xs font-mono text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-indigo-500/40 resize-none transition-colors",
                  !canEditTask && "cursor-default opacity-85"
                )}
              />
            </div>

            {/* Critérios de Aceite & Checklists */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5" />
                  Critérios de Aceite
                </span>
              </div>

              <div className="space-y-1.5">
                {task.checklists.flatMap((c) =>
                  c.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => canEditTask && onToggleChecklist(task.id, c.id, item.id)}
                      className={cn(
                        "flex items-center gap-2.5 p-2 rounded-md border border-white/[0.04] bg-[#111215]/80 transition-colors select-none",
                        canEditTask ? "hover:bg-[#15161a] cursor-pointer" : "cursor-default opacity-80"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        readOnly
                        disabled={!canEditTask}
                        className="rounded border-zinc-700 bg-zinc-900 text-white cursor-pointer h-3.5 w-3.5"
                      />
                      <span
                        className={cn(
                          "text-xs transition-colors",
                          item.isCompleted ? "line-through text-zinc-500" : "text-zinc-200"
                        )}
                      >
                        {item.title}
                      </span>
                    </div>
                  ))
                )}

                {/* Input Adicionar Critério */}
                {canEditTask && (
                  <form onSubmit={handleAddChecklistItem} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Novo critério de aceite (Enter para adicionar)..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      className="flex-1 bg-[#111215] border border-white/[0.06] rounded-md px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-white/20"
                    />
                    <Button type="submit" size="sm" variant="secondary" className="h-7 text-xs">
                      Adicionar
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Histórico & Comentários */}
            <div className="space-y-3 pt-4 border-t border-white/[0.06]">
              <span className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider">
                Atividade & Comentários
              </span>

              <div className="space-y-2.5">
                {task.comments.map((comm) => (
                  <div
                    key={comm.id}
                    className="flex gap-3 p-3 rounded-lg bg-[#111215] border border-white/[0.05]"
                  >
                    <img
                      src={comm.authorAvatar}
                      alt={comm.authorName}
                      className="h-6 w-6 rounded-full bg-zinc-800 shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                          {comm.authorName}
                          {comm.authorType === "agent" && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              IA
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {new Date(comm.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{comm.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Novo Comentário */}
              <form onSubmit={handleSendComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Deixe um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-[#111215] border border-white/[0.06] rounded-md px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-white/20"
                />
                <Button type="submit" size="sm" variant="default" className="h-8 px-3">
                  <Send className="h-3 w-3" />
                </Button>
              </form>
            </div>
          </div>

          {/* COLUNA DIREITA: INSPECTOR SIDEBAR (PROPRIEDADES) */}
          <div className="w-72 border-l border-white/[0.06] bg-[#090a0d] p-5 space-y-5 select-none shrink-0 overflow-y-auto">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
              Propriedades
            </span>

            {/* 1. Status Dropdown Custom */}
            <div className="space-y-1.5 relative">
              <label className="text-xs text-zinc-400">Status</label>
              <button
                type="button"
                disabled={!canEditTask}
                onClick={() => canEditTask && setShowStatusMenu(!showStatusMenu)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#111215] border border-white/[0.08] text-xs text-zinc-200 transition-colors",
                  canEditTask ? "hover:border-white/20 cursor-pointer" : "cursor-default opacity-85"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: currentStatus.color }}
                  />
                  <span>{currentStatus.name}</span>
                </div>
                {canEditTask && <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
              </button>

              {showStatusMenu && canEditTask && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#141518] border border-white/10 rounded-lg shadow-xl p-1 z-20 space-y-0.5">
                  {statuses.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onUpdateTask(task.id, { statusId: s.id });
                        setShowStatusMenu(false);
                        toast.success(`Status: ${s.name}`);
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white cursor-pointer"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Prioridade Dropdown Custom */}
            <div className="space-y-1.5 relative">
              <label className="text-xs text-zinc-400">Prioridade</label>
              <button
                type="button"
                disabled={!canEditTask}
                onClick={() => canEditTask && setShowPriorityMenu(!showPriorityMenu)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#111215] border border-white/[0.08] text-xs text-zinc-200 transition-colors capitalize",
                  canEditTask ? "hover:border-white/20 cursor-pointer" : "cursor-default opacity-85"
                )}
              >
                <div className="flex items-center gap-2">
                  {renderPriorityIcon(task.priority)}
                  <span>{task.priority}</span>
                </div>
                {canEditTask && <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
              </button>

              {showPriorityMenu && canEditTask && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#141518] border border-white/10 rounded-lg shadow-xl p-1 z-20 space-y-0.5">
                  {(["urgent", "high", "medium", "low", "none"] as const).map((p) => (
                    <div
                      key={p}
                      onClick={() => {
                        onUpdateTask(task.id, { priority: p });
                        setShowPriorityMenu(false);
                        toast.success(`Prioridade: ${p}`);
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white cursor-pointer capitalize"
                    >
                      {renderPriorityIcon(p)}
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Responsáveis */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Atribuído</label>
              <div className="flex flex-wrap gap-1.5">
                {task.assigneeIds.map((ass) => (
                  <div
                    key={ass.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#111215] border border-white/[0.06] text-xs text-zinc-300"
                  >
                    <img src={ass.avatarUrl} alt={ass.name} className="h-4 w-4 rounded-full" />
                    <span className="text-[11px] font-medium">{ass.name}</span>
                    {ass.type === "agent" && (
                      <span className="text-[8px] font-mono px-1 py-0 rounded bg-indigo-500/20 text-indigo-300">
                        IA
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Story Points */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Story Points</label>
              <input
                type="number"
                disabled={!canEditTask}
                defaultValue={task.storyPoints ?? ""}
                onBlur={(e) => {
                  if (!canEditTask) return;
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  onUpdateTask(task.id, { storyPoints: val });
                }}
                placeholder="Ex: 5"
                className={cn(
                  "w-full bg-[#111215] border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-zinc-200 font-mono outline-none focus:border-white/20",
                  !canEditTask && "cursor-default opacity-85"
                )}
              />
            </div>

            {/* 5. Prazo */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Prazo de Entrega</label>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#111215] border border-white/[0.08] text-xs text-zinc-400 font-mono">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                <span>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-BR") : "Sem prazo"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
