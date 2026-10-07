/**
 * MedHit Integrações & Automações
 * Painel Deslizante de Inspeção e Detalhes da Tarefa (Task Drawer)
 * 
 * Otimizado para máxima facilidade de uso por pessoas leigas e não-técnicas:
 * - Status e prioridades com rótulos visuais e claros em português
 * - Seletor interativo de responsáveis da equipe
 * - Seletor rápido de prazos (Hoje, Amanhã, +7 dias, Personalizado) com alerta de atraso
 * - Lista de verificação com barra de progresso visual
 * - Remoção de jargões técnicos para uma experiência limpa e humana
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useState, useId } from "react";
import {
  X,
  Bot,
  User,
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
  UserPlus,
  Check,
  CalendarDays,
  FileText,
  MessageSquare,
  HelpCircle,
  FolderKanban,
  Folder,
  Tag,
  Lock,
  UserCheck,
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

const PRIORITY_CONFIG: Record<
  Task["priority"],
  { label: string; color: string; badgeClass: string; icon: React.ElementType }
> = {
  urgent: {
    label: "Urgente",
    color: "#f43f5e",
    badgeClass: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    icon: AlertCircle,
  },
  high: {
    label: "Alta",
    color: "#f97316",
    badgeClass: "bg-orange-500/15 text-orange-500 border-orange-500/30",
    icon: SignalHigh,
  },
  medium: {
    label: "Média",
    color: "#eab308",
    badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    icon: SignalMedium,
  },
  low: {
    label: "Baixa",
    color: "#38bdf8",
    badgeClass: "bg-sky-500/15 text-sky-500 border-sky-500/30",
    icon: SignalLow,
  },
  none: {
    label: "Normal",
    color: "#94a3b8",
    badgeClass: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    icon: Minus,
  },
};

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
  const [tagInput, setTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  const { hasPermission, areas, currentUser, isTaskVisibleForCurrentUser, isAiConfigured } = useTasks();
  const isGuest = currentUser.role === "guest";
  const isVisible = task ? isTaskVisibleForCurrentUser(task) : false;
  const isAssignedToUser = Boolean(
    task?.assigneeIds.some((a) => a.id === currentUser.id || a.name.toLowerCase() === currentUser.name.toLowerCase()) ||
    task?.reporterId === currentUser.id
  );
  const canEditTask = hasPermission("edit_task");
  const canCollaborate = canEditTask || (isGuest && isAssignedToUser);
  const canDeleteTask = hasPermission("delete_task");

  if (!task) return null;

  // Localiza Área e Projeto desta tarefa para exibição contextual
  const taskArea =
    areas.find((a) => a.id === task.areaId) ||
    areas.find((a) => a.projects.some((p) => p.id === task.projectId));
  const taskProject = taskArea?.projects.find((p) => p.id === task.projectId);
  const taskAreaName = taskArea?.name || "Equipe Geral";
  const taskProjectName = taskProject?.name || "Projeto Geral";

  // Se for convidado e a tarefa não for permitida
  if (!isVisible) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white dark:bg-[#070e1e] border-l border-slate-200 dark:border-sky-500/20 h-full shadow-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Lock className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Acesso Restrito</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Como usuário Convidado, você só tem permissão para visualizar tarefas atribuídas diretamente ao seu usuário.
          </p>
          <Button onClick={onClose} variant="outline" className="text-xs rounded-xl">
            Fechar Painel
          </Button>
        </div>
      </div>
    );
  }

  const currentStatus = statuses.find((s) => s.id === task.statusId) || statuses[0] || {
    id: task.statusId,
    name: "A Fazer",
    color: "#38bdf8",
  };
  const taskIdShort = task.id.replace("task-", "");
  const currentPriorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none;

  // Cálculo de Progresso dos Critérios de Aceite
  const allChecklistItems = task.checklists?.flatMap((c) => c.items) || [];
  const completedItemsCount = allChecklistItems.filter((i) => i.isCompleted).length;
  const totalItemsCount = allChecklistItems.length;
  const progressPercent = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;

  // Análise amigável de prazo (vencimento)
  const getDueDateStatus = () => {
    if (!task.dueDate) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const due = new Date(task.dueDate);
    const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    const diffDays = Math.ceil((dueDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Atrasada há ${Math.abs(diffDays)} dia(s)`, className: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
    }
    if (diffDays === 0) {
      return { label: "Vence hoje!", className: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
    }
    if (diffDays === 1) {
      return { label: "Vence amanhã", className: "text-sky-500 bg-sky-500/10 border-sky-500/20" };
    }
    return { label: `Prazo em ${diffDays} dias`, className: "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10" };
  };

  const dueDateStatus = getDueDateStatus();

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value !== task.title) {
      onUpdateTask(task.id, { title: e.target.value });
      toast.success("Título atualizado com sucesso!");
    }
  };

  const handleDescBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (e.target.value !== task.description) {
      onUpdateTask(task.id, { description: e.target.value });
      toast.success("Descrição salva!");
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(task.id, newComment.trim());
    setNewComment("");
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const currentChecklists = task.checklists || [];
    const baseChecklist = currentChecklists[0] || {
      id: `chk-${Date.now()}`,
      taskId: task.id,
      title: "Critérios de Aceite",
      items: [],
    };
    const newItem = {
      id: `chk-item-${Date.now()}`,
      checklistId: baseChecklist.id,
      title: newChecklistText.trim(),
      isCompleted: false,
    };
    const updatedChecklist = {
      ...baseChecklist,
      items: [...baseChecklist.items, newItem],
    };
    const updatedChecklists = currentChecklists.length === 0
      ? [updatedChecklist]
      : currentChecklists.map((c, idx) => (idx === 0 ? updatedChecklist : c));

    onUpdateTask(task.id, { checklists: updatedChecklists });
    setNewChecklistText("");
    toast.success("Item adicionado à lista!");
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    if (!canCollaborate) return;
    const currentChecklists = task.checklists || [];
    const updatedChecklists = currentChecklists.map((c) => ({
      ...c,
      items: c.items.filter((i) => i.id !== itemId),
    }));
    onUpdateTask(task.id, { checklists: updatedChecklists });
    toast.info("Item removido da lista.");
  };

  // Alterna membro atribuído à tarefa
  const toggleAssignee = (member: Member) => {
    if (!canEditTask) return;
    const isCurrentlyAssigned = task.assigneeIds.some((a) => a.id === member.id);
    let updatedAssignees = [...task.assigneeIds];

    if (isCurrentlyAssigned) {
      updatedAssignees = updatedAssignees.filter((a) => a.id !== member.id);
      toast.info(`${member.name} removido da tarefa.`);
    } else {
      updatedAssignees.push({
        type: "user",
        id: member.id,
        name: member.name,
        avatarUrl: member.avatarUrl,
      });
      toast.success(`${member.name} atribuído à tarefa!`);
    }

    onUpdateTask(task.id, { assigneeIds: updatedAssignees });
  };

  // Ajuste rápido de data local sem distorção de fuso horário
  const setQuickDueDate = (daysFromToday: number | null) => {
    if (!canEditTask) return;
    if (daysFromToday === null) {
      onUpdateTask(task.id, { dueDate: undefined });
      toast.info("Prazo removido.");
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    onUpdateTask(task.id, { dueDate: dateStr });
    toast.success(`Prazo definido para ${d.toLocaleDateString("pt-BR")}!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        key={task.id}
        className="w-full max-w-3xl bg-white dark:bg-[#070e1e] border-l border-slate-200 dark:border-sky-500/20 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Top Header Barra de Ações */}
        <div className="h-14 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60 shrink-0 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/20 px-2 py-0.5 rounded-md border border-sky-500/30 flex items-center gap-1 shrink-0">
              <Hash className="h-3 w-3" />
              MH-{taskIdShort}
            </span>
            <span className="text-slate-300 dark:text-white/20 shrink-0">|</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 truncate">
              <FolderKanban className="h-3.5 w-3.5 text-sky-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400 truncate">{taskAreaName}</span>
              <span className="text-slate-300 dark:text-white/20">›</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{taskProjectName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canDeleteTask && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm(`Deseja realmente excluir a tarefa "${task.title}"?`)) {
                    onDeleteTask(task.id);
                    onClose();
                  }
                }}
                className="h-8 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg text-xs gap-1"
                title="Excluir esta tarefa"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Excluir</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg"
              title="Fechar painel (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Layout de Conteúdo: Coluna Principal + Coluna de Propriedades */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* COLUNA ESQUERDA: TÍTULO, DESCRIÇÃO, CHECKLIST, ORIENTAÇÕES, COMENTÁRIOS */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Banner Informativo para Usuários Convidados */}
            {isGuest && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                <UserCheck className="h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  <strong>Acesso de Convidado:</strong> Você pode marcar critérios concluídos na sua lista e adicionar comentários nesta demanda.
                </span>
              </div>
            )}
            {/* Título da Demanda */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 font-bold tracking-wider">
                Título da Demanda
              </label>
              <input
                type="text"
                defaultValue={task.title}
                onBlur={handleTitleBlur}
                disabled={!canEditTask}
                className={cn(
                  "w-full text-base sm:text-lg font-bold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-sky-500 outline-none text-slate-900 dark:text-white px-1 py-1 transition-all",
                  !canEditTask && "cursor-default opacity-85"
                )}
                placeholder="Ex: Atualizar cronograma de lançamento..."
              />
            </div>

            {/* Descrição Detalhada */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 font-bold tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-sky-400" />
                <span>Descrição & Detalhes</span>
              </label>
              <textarea
                defaultValue={task.description}
                onBlur={handleDescBlur}
                disabled={!canEditTask}
                rows={4}
                placeholder="Escreva de forma clara o que precisa ser feito nesta tarefa..."
                className={cn(
                  "w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 resize-y leading-relaxed transition-all",
                  !canEditTask && "cursor-default opacity-85"
                )}
              />
            </div>

            {/* Lista de Verificação / Critérios de Conclusão */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Lista de Verificação (Checklist)
                  </span>
                </div>

                {totalItemsCount > 0 && (
                  <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                    {completedItemsCount} de {totalItemsCount} concluídos ({progressPercent}%)
                  </span>
                )}
              </div>

              {/* Barra de Progresso Visual */}
              {totalItemsCount > 0 && (
                <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Itens do Checklist */}
              <div className="space-y-1.5">
                {allChecklistItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => canCollaborate && onToggleChecklist(task.id, task.checklists[0]?.id || "", item.id)}
                    className={cn(
                      "flex items-center justify-between gap-2.5 p-2 rounded-lg border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0c1830]/50 transition-all select-none group",
                      canCollaborate ? "hover:border-sky-500/40 cursor-pointer" : "cursor-default opacity-85"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        readOnly
                        disabled={!canCollaborate}
                        className="rounded border-slate-300 dark:border-white/20 text-emerald-500 focus:ring-0 cursor-pointer h-4 w-4 shrink-0"
                      />
                      <span
                        className={cn(
                          "text-xs transition-colors leading-tight truncate",
                          item.isCompleted
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "text-slate-800 dark:text-slate-200 font-medium"
                        )}
                      >
                        {item.title}
                      </span>
                    </div>

                    {canCollaborate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChecklistItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity cursor-pointer shrink-0"
                        title="Remover item da lista"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Formulário para Adicionar Novo Item */}
                {canCollaborate && (
                  <form onSubmit={handleAddChecklistItem} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Adicionar item à lista (pressione Enter)..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-sky-500"
                    />
                    <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs font-medium cursor-pointer">
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Conversas & Histórico da Tarefa */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 font-bold tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
                <span>Comentários & Histórico ({task.comments?.length || 0})</span>
              </label>

              <div className="space-y-2.5">
                {(task.comments || []).map((comm) => (
                  <div
                    key={comm.id}
                    className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5"
                  >
                    <img
                      src={comm.authorAvatar}
                      alt={comm.authorName}
                      className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 object-cover border border-slate-200 dark:border-white/10"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {comm.authorName}
                          {comm.authorType === "agent" && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 font-bold">
                              IA
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {new Date(comm.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {comm.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Campo para Escrever Novo Comentário */}
              {canCollaborate ? (
                <form onSubmit={handleSendComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Deixar uma mensagem ou atualização..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-sky-500"
                  />
                  <Button type="submit" size="sm" className="h-9 px-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold cursor-pointer">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-[11px] text-slate-400 italic">
                  Apenas membros atribuídos podem comentar nesta demanda.
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: PROPRIEDADES (STATUS, PRIORIDADE, MEMBROS, PRAZO, ESTIMATIVA) */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/40 p-5 space-y-5 select-none shrink-0 overflow-y-auto">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block">
              Propriedades da Demanda
            </span>

            {/* 1. Status Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status Atual
              </label>
              <button
                type="button"
                disabled={!canEditTask}
                onClick={() => canEditTask && setShowStatusMenu(!showStatusMenu)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 transition-all shadow-xs",
                  canEditTask ? "hover:border-sky-500/50 cursor-pointer" : "cursor-default opacity-85"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: currentStatus.color }}
                  />
                  <span>{currentStatus.name}</span>
                </div>
                {canEditTask && <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>

              {showStatusMenu && canEditTask && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#0c1830] border border-slate-200 dark:border-sky-500/30 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {statuses.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onUpdateTask(task.id, { statusId: s.id });
                        setShowStatusMenu(false);
                        toast.success(`Status alterado para: ${s.name}`);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-500/10 hover:text-sky-500 cursor-pointer"
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Prioridade Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Prioridade
              </label>
              <button
                type="button"
                disabled={!canEditTask}
                onClick={() => canEditTask && setShowPriorityMenu(!showPriorityMenu)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 transition-all shadow-xs",
                  canEditTask ? "hover:border-sky-500/50 cursor-pointer" : "cursor-default opacity-85"
                )}
              >
                <div className="flex items-center gap-2">
                  <currentPriorityConfig.icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: currentPriorityConfig.color }}
                  />
                  <span>{currentPriorityConfig.label}</span>
                </div>
                {canEditTask && <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>

              {showPriorityMenu && canEditTask && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#0c1830] border border-slate-200 dark:border-sky-500/30 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {(["urgent", "high", "medium", "low", "none"] as const).map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    return (
                      <div
                        key={p}
                        onClick={() => {
                          onUpdateTask(task.id, { priority: p });
                          setShowPriorityMenu(false);
                          toast.success(`Prioridade alterada para: ${cfg.label}`);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-500/10 hover:text-sky-500 cursor-pointer"
                      >
                        <cfg.icon className="h-4 w-4" style={{ color: cfg.color }} />
                        <span>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Atribuição de Responsáveis (Interativo & Fácil!) */}
            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Responsáveis
                </label>
                {canEditTask && (
                  <button
                    type="button"
                    onClick={() => setShowAssigneeMenu(!showAssigneeMenu)}
                    className="text-[11px] font-medium text-sky-500 hover:text-sky-600 flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="h-3 w-3" />
                    <span>{task.assigneeIds.length === 0 ? "Atribuir" : "Alterar"}</span>
                  </button>
                )}
              </div>

              {/* Lista dos Atribuídos Atualmente */}
              <div className="flex flex-wrap gap-1.5">
                {task.assigneeIds.length > 0 ? (
                  task.assigneeIds.map((ass) => (
                    <div
                      key={ass.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-xs"
                    >
                      <img src={ass.avatarUrl} alt={ass.name} className="h-4 w-4 rounded-full object-cover" />
                      <span className="truncate max-w-[120px]">{ass.name}</span>
                      {canEditTask && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = task.assigneeIds.filter((a) => a.id !== ass.id);
                            onUpdateTask(task.id, { assigneeIds: updated });
                          }}
                          className="text-slate-400 hover:text-rose-500 ml-0.5 cursor-pointer"
                          title="Remover responsável"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Nenhum responsável atribuído</span>
                )}
              </div>

              {/* Menu de Seleção de Membros */}
              {showAssigneeMenu && canEditTask && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#0c1830] border border-slate-200 dark:border-sky-500/30 rounded-xl shadow-2xl p-2 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-100 max-h-56 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-bold">
                    Selecione membros da equipe:
                  </div>
                  {members.map((m) => {
                    const isAssigned = task.assigneeIds.some((a) => a.id === m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleAssignee(m)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                          isAssigned
                            ? "bg-sky-500/15 text-sky-500 font-bold"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <img src={m.avatarUrl} alt={m.name} className="h-5 w-5 rounded-full object-cover" />
                          <span>{m.name}</span>
                        </div>
                        {isAssigned && <Check className="h-3.5 w-3.5 text-sky-500" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pastas & Tags (Categorização) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 text-sky-400" />
                  <span>Pasta / Tags</span>
                </label>
                {canEditTask && !isAddingTag && (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="text-[10px] font-mono font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    <span>Adicionar</span>
                  </button>
                )}
              </div>

              {/* Tags Atuais */}
              <div className="flex flex-wrap gap-1.5 min-h-7 items-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs">
                {(task.tags && task.tags.length > 0) ? (
                  task.tags.map((tg) => (
                    <div
                      key={tg}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-medium bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                    >
                      <Folder className="h-3 w-3 opacity-80" />
                      <span>#{tg}</span>
                      {canEditTask && (
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = (task.tags || []).filter((t) => t !== tg);
                            onUpdateTask(task.id, { tags: filtered });
                            toast.info(`Tag #${tg} removida`);
                          }}
                          className="hover:text-rose-500 text-slate-400 ml-0.5 cursor-pointer"
                          title="Remover tag"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Nenhuma pasta/tag vinculada</span>
                )}
              </div>

              {/* Formulário de adicionar tag */}
              {isAddingTag && canEditTask && (
                <div className="flex items-center gap-1 pt-1 animate-in fade-in duration-100">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Nome da pasta/tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const clean = tagInput.trim().replace(/^#/, "");
                        if (clean) {
                          const current = task.tags || [];
                          if (!current.includes(clean)) {
                            onUpdateTask(task.id, { tags: [...current, clean] });
                            toast.success(`Pasta #${clean} adicionada!`);
                          }
                          setTagInput("");
                          setIsAddingTag(false);
                        }
                      }
                      if (e.key === "Escape") {
                        setIsAddingTag(false);
                        setTagInput("");
                      }
                    }}
                    className="flex-1 bg-white dark:bg-slate-950/60 border border-sky-500 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const clean = tagInput.trim().replace(/^#/, "");
                      if (clean) {
                        const current = task.tags || [];
                        if (!current.includes(clean)) {
                          onUpdateTask(task.id, { tags: [...current, clean] });
                          toast.success(`Pasta #${clean} adicionada!`);
                        }
                        setTagInput("");
                        setIsAddingTag(false);
                      }
                    }}
                    className="h-7 px-2.5 bg-sky-500 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingTag(false);
                      setTagInput("");
                    }}
                    className="h-7 px-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* 4. Prazo de Entrega (Fácil e Interativo com botões rápidos) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Prazo de Entrega
                </label>
                {dueDateStatus && (
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", dueDateStatus.className)}>
                    {dueDateStatus.label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  disabled={!canEditTask}
                  value={task.dueDate ? task.dueDate.split("T")[0] : ""}
                  onChange={(e) => {
                    if (!canEditTask) return;
                    onUpdateTask(task.id, { dueDate: e.target.value || undefined });
                    toast.success("Prazo atualizado!");
                  }}
                  className={cn(
                    "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500 shadow-xs",
                    !canEditTask && "cursor-default opacity-85"
                  )}
                />
              </div>

              {/* Botões de Acesso Rápido de Data */}
              {canEditTask && (
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(0)}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-sky-500 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(1)}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-sky-500 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Amanhã
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(7)}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-sky-500 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    +7 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(null)}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-rose-500 text-rose-500 transition-colors cursor-pointer"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>

            {/* 5. Estimativa de Esforço */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Estimativa de Tempo</span>
                <span className="text-[10px] text-slate-400 font-normal">(em horas)</span>
              </label>
              <input
                type="number"
                disabled={!canEditTask}
                defaultValue={task.storyPoints ?? ""}
                onBlur={(e) => {
                  if (!canEditTask) return;
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  onUpdateTask(task.id, { storyPoints: val });
                  toast.success("Estimativa salva!");
                }}
                placeholder="Ex: 4"
                className={cn(
                  "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-mono outline-none focus:border-sky-500 shadow-xs",
                  !canEditTask && "cursor-default opacity-85"
                )}
              />

              {/* Atalhos Rápidos de Horas */}
              {canEditTask && (
                <div className="grid grid-cols-4 gap-1 pt-0.5">
                  {[1, 2, 4, 8].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => {
                        onUpdateTask(task.id, { storyPoints: hours });
                        toast.success(`Estimativa definida: ${hours}h`);
                      }}
                      className={cn(
                        "py-1 rounded-md text-[10px] font-mono font-semibold border transition-all cursor-pointer",
                        task.storyPoints === hours
                          ? "bg-sky-500 text-slate-950 border-sky-500 shadow-xs"
                          : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-sky-500"
                      )}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
