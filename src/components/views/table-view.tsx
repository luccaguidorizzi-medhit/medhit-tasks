/**
 * MedHit WorkTrack v2 - Motor de Tabela Hierárquica Estilo Monday.com
 * Mantido por: Equipe MedHit I&A
 * 
 * Funcionalidades:
 * 1. Agrupamento visual por BoardGroup (Fases / Módulos) com cor personalizada e colapsável
 * 2. Itens Pai com barra de progresso agregada multicolorida e expansão inline (>)
 * 3. Subitens em árvore expansível logo abaixo do item pai
 * 4. Pílulas de Status Full-Fill coloridas com seletor rápido com 1 clique
 * 5. TimeTrackerCell isolado com contagem de segundos desacoplada
 * 6. Indicador de comentários (💬) com contador clicável
 * 7. Criação rápida inline de itens e subitens (+ Adicionar)
 */

"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Task,
  Status,
  BoardGroup,
  TaskCustomFields,
} from "@/server/services/data-store";
import { useTasks } from "@/context/task-context";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MessageSquare,
  Play,
  Pause,
  Clock,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Circle,
  MoreVertical,
  Trash2,
  User,
  AlertCircle,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Minus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as Popover from "@radix-ui/react-popover";

interface TableViewProps {
  statuses: Status[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  projectId?: string;
  areaId?: string;
}

// ==========================================
// COMPONENTE: TIME TRACKER DESACOPLADO (LEAF NODE)
// ==========================================

function TimeTrackerCell({
  taskId,
  timeSpentSeconds = 0,
  timerRunningSince,
  onToggleTimer,
}: {
  taskId: string;
  timeSpentSeconds?: number;
  timerRunningSince?: string | null;
  onToggleTimer: (id: string) => void;
}) {
  const isRunning = !!timerRunningSince;
  const [currentSeconds, setCurrentSeconds] = useState(timeSpentSeconds);

  useEffect(() => {
    if (!isRunning || !timerRunningSince) {
      setCurrentSeconds(timeSpentSeconds);
      return;
    }

    const startTimestamp = new Date(timerRunningSince).getTime();
    const update = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000));
      setCurrentSeconds(timeSpentSeconds + elapsed);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timerRunningSince, timeSpentSeconds]);

  const formatTime = (total: number) => {
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
    }
    return `${minutes}m ${secs.toString().padStart(2, "0")}s`;
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggleTimer(taskId);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono font-medium transition-colors cursor-pointer",
        isRunning
          ? "bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 animate-pulse"
          : currentSeconds > 0
          ? "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
          : "text-slate-400 hover:text-sky-500 hover:bg-sky-500/10"
      )}
      title={isRunning ? "Pausar cronômetro" : "Iniciar cronômetro"}
    >
      {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      <span>{currentSeconds > 0 ? formatTime(currentSeconds) : "00m 00s"}</span>
    </button>
  );
}

// ==========================================
// COMPONENTE: BARRA DE PROGRESSO AGREGADA
// ==========================================

function AggregatedProgressBar({ subtasks }: { subtasks: Task[] }) {
  if (subtasks.length === 0) return null;

  const total = subtasks.length;
  let doneCount = 0;
  let inProgressCount = 0;

  subtasks.forEach((st) => {
    const isDone =
      st.statusId === "st-obra-4" ||
      st.statusId === "st-conteudo-4" ||
      st.customFields?.secondaryStatus === "Feito" ||
      st.customFields?.secondaryStatus === "Concluído" ||
      st.statusId?.includes("done");

    const isInProgress =
      st.statusId === "st-obra-2" ||
      st.statusId === "st-obra-3" ||
      st.statusId === "st-conteudo-2" ||
      st.statusId === "st-conteudo-3" ||
      st.customFields?.secondaryStatus === "Em Andamento" ||
      st.customFields?.secondaryStatus === "Em Edição" ||
      st.customFields?.secondaryStatus === "Em Revisão";

    if (isDone) doneCount++;
    else if (isInProgress) inProgressCount++;
  });

  const donePercent = Math.round((doneCount / total) * 100);
  const inProgressPercent = Math.round((inProgressCount / total) * 100);
  const remainingPercent = Math.max(0, 100 - donePercent - inProgressPercent);

  return (
    <div className="flex flex-col gap-1 w-28 shrink-0" title={`${doneCount}/${total} concluídos (${donePercent}%)`}>
      <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden flex">
        {donePercent > 0 && (
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${donePercent}%` }}
          />
        )}
        {inProgressPercent > 0 && (
          <div
            className="h-full bg-sky-500 transition-all duration-300"
            style={{ width: `${inProgressPercent}%` }}
          />
        )}
        {remainingPercent > 0 && (
          <div
            className="h-full bg-slate-300 dark:bg-slate-700 transition-all duration-300"
            style={{ width: `${remainingPercent}%` }}
          />
        )}
      </div>
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
        <span>{donePercent}%</span>
        <span>{doneCount}/{total}</span>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: PÍLULA DE STATUS FULL-FILL (MONDAY STYLE)
// ==========================================

function FullFillStatusPill({
  status,
  allStatuses,
  onSelectStatus,
}: {
  status?: Status;
  allStatuses: Status[];
  onSelectStatus: (statusId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const getStatusColor = (s?: Status) => {
    if (!s) return "bg-slate-500 text-white";
    if (s.category === "done") return "bg-emerald-600 text-white hover:bg-emerald-500";
    if (s.category === "in_progress") return "bg-sky-500 text-slate-950 hover:bg-sky-400 font-bold";
    if (s.category === "review") return "bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold";
    return "bg-slate-500 text-white hover:bg-slate-400";
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "w-28 py-1 px-2 rounded-md text-xs font-semibold tracking-wide text-center truncate transition-all shadow-xs cursor-pointer",
            getStatusColor(status)
          )}
        >
          {status?.name || "Definir"}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-36 rounded-xl bg-white dark:bg-[#0c1830] border border-slate-200 dark:border-sky-500/20 p-1.5 shadow-xl animate-in fade-in zoom-in-95"
          sideOffset={5}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-1">
            {allStatuses.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSelectStatus(s.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-opacity hover:opacity-90 cursor-pointer",
                  getStatusColor(s)
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ==========================================
// COMPONENTE: TAG DE ÁREA TEMÁTICA MÉDICA
// ==========================================

function AreaTagBadge({ tag }: { tag?: string }) {
  if (!tag) return <span className="text-slate-400 text-xs">—</span>;

  const colorMap: Record<string, string> = {
    CIR: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    GO: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
    PED: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    PREV: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    CLI: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  };

  const badgeClass = colorMap[tag.toUpperCase()] || "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";

  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border", badgeClass)}>
      {tag}
    </span>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL: TABLE VIEW
// ==========================================

export function TableView({
  statuses,
  tasks,
  onTaskClick,
  projectId,
  areaId,
}: TableViewProps) {
  const {
    currentProject,
    currentArea,
    updateTask,
    createTask,
    createSubtask,
    deleteTask,
    createGroup,
    toggleTaskTimer,
    members,
    hasPermission,
  } = useTasks();

  const canEdit = hasPermission("edit_task");
  const isContentTemplate = currentProject?.template === "content_production";

  // Grupos do projeto ativo (ou grupo padrão se vazio)
  const projectGroups: BoardGroup[] = useMemo(() => {
    if (currentProject?.groups && currentProject.groups.length > 0) {
      return [...currentProject.groups].sort((a, b) => a.position - b.position);
    }
    return [
      {
        id: "default-group",
        projectId: projectId || "proj-default",
        name: "Tarefas Principais",
        color: "#0ea5e9",
        position: 1000,
        collapsed: false,
      },
    ];
  }, [currentProject?.groups, projectId]);

  // Controle de colapso de grupos
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Controle de expansão inline de subitens por item pai
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({
    "task-cont-sem-1": true,
    "task-casa-03": true,
    "task-casa-05": true,
  });

  const toggleParentExpand = (parentId: string) => {
    setExpandedParents((prev) => ({ ...prev, [parentId]: !prev[parentId] }));
  };

  // Estado para inputs rápidos inline de novo item por grupo
  const [quickAddGroup, setQuickAddGroup] = useState<Record<string, string>>({});
  // Estado para inputs rápidos de subitem por item pai
  const [quickAddSubtask, setQuickAddSubtask] = useState<Record<string, string>>({});

  const handleAddParentItem = (groupId: string) => {
    const title = quickAddGroup[groupId]?.trim();
    if (!title || !currentProject) return;

    createTask({
      title,
      projectId: currentProject.id,
      areaId: currentProject.areaId,
      groupId,
      statusId: statuses[0]?.id || "st-todo",
      priority: "medium",
      taskType: "task",
    });

    setQuickAddGroup((prev) => ({ ...prev, [groupId]: "" }));
  };

  const handleAddSubtask = (parentId: string) => {
    const title = quickAddSubtask[parentId]?.trim();
    if (!title) return;

    createSubtask(parentId, title);
    setQuickAddSubtask((prev) => ({ ...prev, [parentId]: "" }));
    setExpandedParents((prev) => ({ ...prev, [parentId]: true }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 select-none touch-pan-y">
      {projectGroups.map((group) => {
        const isCollapsed = !!collapsedGroups[group.id];

        // Filtra tarefas-mãe pertencentes a este grupo (ou não atribuídas se grupo padrão)
        const parentTasks = tasks.filter((t) => {
          if (t.parentId) return false;
          if (group.id === "default-group") {
            return !t.groupId || t.groupId === group.id;
          }
          return t.groupId === group.id;
        });

        return (
          <section
            key={group.id}
            className="rounded-2xl border border-slate-200/80 dark:border-sky-500/20 bg-white/70 dark:bg-[#070f22]/70 backdrop-blur-xl shadow-lg overflow-hidden"
          >
            {/* Header do Grupo (Fase / Módulo) */}
            <div
              className="px-4 py-3 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
              onClick={() => toggleGroupCollapse(group.id)}
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                <span
                  className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: group.color }}
                />

                <h2
                  className="text-sm font-bold tracking-tight text-slate-900 dark:text-white"
                  style={{ color: group.color }}
                >
                  {group.name}
                </h2>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                  {parentTasks.length} {parentTasks.length === 1 ? "item" : "itens"}
                </span>
              </div>
            </div>

            {/* Tabela de Itens do Grupo */}
            {!isCollapsed && (
              <div className="overflow-x-auto touch-pan-x scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  {/* Cabeçalho de Colunas */}
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/10 text-[11px] font-mono text-slate-400 uppercase bg-slate-50/80 dark:bg-white/[0.02]">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 min-w-[260px]">Título do Item</th>
                      <th className="py-2.5 px-3 w-28">Responsável</th>
                      <th className="py-2.5 px-3 w-32">Status</th>
                      <th className="py-2.5 px-3 w-32">Progresso</th>
                      {isContentTemplate ? (
                        <>
                          <th className="py-2.5 px-3 w-20 text-center">Área</th>
                          <th className="py-2.5 px-3 w-28">Status Edição</th>
                          <th className="py-2.5 px-3 w-28">Pílula</th>
                          <th className="py-2.5 px-3 w-24">Liberação</th>
                          <th className="py-2.5 px-3 w-28">Links</th>
                        </>
                      ) : (
                        <>
                          <th className="py-2.5 px-3 w-24">Prioridade</th>
                          <th className="py-2.5 px-3 w-28">Prazo</th>
                          <th className="py-2.5 px-3 w-28">Tempo</th>
                        </>
                      )}
                      <th className="py-2.5 px-3 w-28">Cronômetro</th>
                    </tr>
                  </thead>

                  <tbody>
                    {parentTasks.map((parent) => {
                      const subtasks = tasks.filter((t) => t.parentId === parent.id);
                      const isExpanded = !!expandedParents[parent.id];
                      const parentStatus = statuses.find((s) => s.id === parent.statusId);
                      const commentsCount = parent.comments?.length || 0;

                      return (
                        <React.Fragment key={parent.id}>
                          {/* LINHA DO ITEM PAI */}
                          <tr
                            onClick={() => onTaskClick(parent)}
                            className="border-b border-slate-200/60 dark:border-white/5 hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                          >
                            {/* Expansor Inline (>) */}
                            <td
                              className="py-2.5 px-3 text-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleParentExpand(parent.id);
                              }}
                            >
                              <button
                                type="button"
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-sky-500" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </td>

                            {/* Título do Item Pai + Contador de Subitens e Comentários */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-xs tracking-tight">
                                  {parent.title}
                                </span>

                                {subtasks.length > 0 && (
                                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-sky-500/15 text-sky-600 dark:text-sky-300 font-semibold">
                                    {subtasks.length} subitens
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTaskClick(parent);
                                  }}
                                  className={cn(
                                    "flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors",
                                    commentsCount > 0
                                      ? "text-sky-600 dark:text-sky-400 bg-sky-500/10 font-bold"
                                      : "text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-600"
                                  )}
                                  title="Ver conversa e comentários"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{commentsCount}</span>
                                </button>
                              </div>
                            </td>

                            {/* Responsáveis */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center -space-x-1.5">
                                {(parent.assigneeIds || []).map((assignee) => (
                                  <img
                                    key={assignee.id}
                                    src={assignee.avatarUrl}
                                    alt={assignee.name}
                                    title={assignee.name}
                                    className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200"
                                  />
                                ))}
                                {(!parent.assigneeIds || parent.assigneeIds.length === 0) && (
                                  <span className="text-slate-400 text-xs italic">Livre</span>
                                )}
                              </div>
                            </td>

                            {/* Pílula de Status */}
                            <td className="py-2.5 px-3">
                              <FullFillStatusPill
                                status={parentStatus}
                                allStatuses={statuses}
                                onSelectStatus={(stId) => updateTask(parent.id, { statusId: stId })}
                              />
                            </td>

                            {/* Barra de Progresso Agregada */}
                            <td className="py-2.5 px-3">
                              <AggregatedProgressBar subtasks={subtasks} />
                            </td>

                            {isContentTemplate ? (
                              <>
                                <td className="py-2.5 px-3 text-center">
                                  <AreaTagBadge tag={parent.customFields?.areaTag} />
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                                  {parent.customFields?.secondaryStatus || "—"}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                                  {parent.customFields?.pillStatus || "—"}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                  {parent.customFields?.releaseDate || "—"}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="text-slate-400 text-[11px]">—</span>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-2.5 px-3">
                                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                                    {parent.priority}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                  {parent.dueDate || "—"}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                                  —
                                </td>
                              </>
                            )}

                            {/* Cronômetro */}
                            <td className="py-2.5 px-3">
                              <TimeTrackerCell
                                taskId={parent.id}
                                timeSpentSeconds={parent.customFields?.timeSpentSeconds}
                                timerRunningSince={parent.customFields?.timerRunningSince}
                                onToggleTimer={toggleTaskTimer}
                              />
                            </td>
                          </tr>

                          {/* SUB-TABELA DE SUBITENS (INLINE EXPANDED) */}
                          {isExpanded && (
                            <>
                              {subtasks.map((sub) => {
                                const subStatus = statuses.find((s) => s.id === sub.statusId);
                                const subCommentsCount = sub.comments?.length || 0;

                                return (
                                  <tr
                                    key={sub.id}
                                    onClick={() => onTaskClick(sub)}
                                    className="border-b border-slate-200/40 dark:border-white/5 bg-slate-50/40 dark:bg-white/[0.015] hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group"
                                  >
                                    <td className="py-2 px-3 text-center text-slate-300 dark:text-slate-600 font-mono text-[10px]">
                                      ↳
                                    </td>

                                    {/* Título do Subitem */}
                                    <td className="py-2 px-3 pl-6">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-700 dark:text-slate-200 font-medium truncate max-w-sm">
                                          {sub.title}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onTaskClick(sub);
                                          }}
                                          className={cn(
                                            "flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors",
                                            subCommentsCount > 0
                                              ? "text-sky-600 dark:text-sky-400 bg-sky-500/10 font-bold"
                                              : "text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-600"
                                          )}
                                          title="Ver conversa do subitem"
                                        >
                                          <MessageSquare className="h-3 w-3" />
                                          <span>{subCommentsCount}</span>
                                        </button>
                                      </div>
                                    </td>

                                    {/* Responsável / Professor */}
                                    <td className="py-2 px-3">
                                      <div className="flex items-center gap-1.5 truncate">
                                        {sub.customFields?.professors && sub.customFields.professors.length > 0 ? (
                                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                                            {sub.customFields.professors[0]}
                                          </span>
                                        ) : sub.assigneeIds && sub.assigneeIds.length > 0 ? (
                                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                                            {sub.assigneeIds[0].name}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 text-xs italic">—</span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Status Principal do Subitem */}
                                    <td className="py-2 px-3">
                                      <FullFillStatusPill
                                        status={subStatus}
                                        allStatuses={statuses}
                                        onSelectStatus={(stId) => updateTask(sub.id, { statusId: stId })}
                                      />
                                    </td>

                                    {/* Subitem não tem subitens */}
                                    <td className="py-2 px-3 text-slate-400 font-mono text-[10px] text-center">
                                      —
                                    </td>

                                    {isContentTemplate ? (
                                      <>
                                        <td className="py-2 px-3 text-center">
                                          <AreaTagBadge tag={sub.customFields?.areaTag} />
                                        </td>
                                        <td className="py-2 px-3">
                                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                                            {sub.customFields?.secondaryStatus || "Não Iniciado"}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3">
                                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                            {sub.customFields?.pillStatus || "—"}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                                          {sub.customFields?.releaseDate || "—"}
                                        </td>
                                        <td className="py-2 px-3">
                                          <div className="flex items-center gap-1.5">
                                            {sub.customFields?.driveUrl && (
                                              <a
                                                href={sub.customFields.driveUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1 rounded text-sky-500 hover:bg-sky-500/10 transition-colors"
                                                title="Abrir pasta no Drive"
                                              >
                                                <ExternalLink className="h-3 w-3" />
                                              </a>
                                            )}
                                            {sub.customFields?.durationText && (
                                              <span className="text-[10px] font-mono text-slate-400">
                                                {sub.customFields.durationText}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="py-2 px-3 text-slate-400 font-mono text-[10px] uppercase">
                                          {sub.priority}
                                        </td>
                                        <td className="py-2 px-3 text-[11px] font-mono text-slate-500">
                                          {sub.dueDate || "—"}
                                        </td>
                                        <td className="py-2 px-3 text-[11px] font-mono text-slate-400">
                                          —
                                        </td>
                                      </>
                                    )}

                                    {/* Cronômetro do Subitem */}
                                    <td className="py-2 px-3">
                                      <TimeTrackerCell
                                        taskId={sub.id}
                                        timeSpentSeconds={sub.customFields?.timeSpentSeconds}
                                        timerRunningSince={sub.customFields?.timerRunningSince}
                                        onToggleTimer={toggleTaskTimer}
                                      />
                                    </td>
                                  </tr>
                                );
                              })}

                              {/* Linha Inline de Adicionar Subitem */}
                              <tr className="bg-slate-50/20 dark:bg-white/[0.01] border-b border-slate-200/40 dark:border-white/5">
                                <td className="py-1.5 px-3 text-center text-slate-300 font-mono text-[10px]">
                                  +
                                </td>
                                <td colSpan={isContentTemplate ? 10 : 8} className="py-1.5 px-3 pl-6">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={quickAddSubtask[parent.id] || ""}
                                      onChange={(e) =>
                                        setQuickAddSubtask((prev) => ({
                                          ...prev,
                                          [parent.id]: e.target.value,
                                        }))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleAddSubtask(parent.id);
                                        }
                                      }}
                                      placeholder={`+ Adicionar subitem em "${parent.title}" (Enter para salvar)...`}
                                      className="w-full max-w-md bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                                    />
                                    {quickAddSubtask[parent.id]?.trim() && (
                                      <button
                                        type="button"
                                        onClick={() => handleAddSubtask(parent.id)}
                                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer"
                                      >
                                        Adicionar
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            </>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* Linha Inline de Adicionar Item no Grupo */}
                    <tr className="bg-slate-50/50 dark:bg-white/[0.02]">
                      <td className="py-2.5 px-3 text-center text-slate-400">
                        <Plus className="h-3.5 w-3.5 mx-auto" />
                      </td>
                      <td colSpan={isContentTemplate ? 10 : 8} className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={quickAddGroup[group.id] || ""}
                            onChange={(e) =>
                              setQuickAddGroup((prev) => ({
                                ...prev,
                                [group.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddParentItem(group.id);
                              }
                            }}
                            placeholder={`+ Adicionar novo item em "${group.name}" (Pressione Enter)...`}
                            className="w-full max-w-md bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                          />
                          {quickAddGroup[group.id]?.trim() && (
                            <button
                              type="button"
                              onClick={() => handleAddParentItem(group.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer"
                            >
                              Criar Item
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
