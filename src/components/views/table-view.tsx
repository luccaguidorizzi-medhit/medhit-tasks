/**
 * MedHit Integrações & Automações
 * Visão em Lista do MedHit Tasks (Tabela Plana Contínua - Padrão Linear / ClickUp / Monday)
 *
 * Características:
 * - Grade CSS estrita (--list-cols): 36px | minmax(320px, 1fr) | 150px | 180px | 140px | 130px | 64px
 * - Uma única tabela contínua, sem cards por grupo, sem separação forçada por status
 * - Cabeçalho global sticky com ordenação interativa (título, status, responsável, prioridade, data)
 * - Agrupamento opcional sob demanda (Nenhum [padrão], Status, Responsável, Prioridade, Data limite)
 * - Ao agrupar por Status: oculta a coluna redundante de Status e oculta grupos vazios
 * - Exatamente UMA linha de criação rápida inline no rodapé da tabela (Enter contínuo, Esc fecha, atalho 'N')
 * - Seletores inline com Radix Popovers (Status, Responsável, Prioridade sem truncamentos bugados, Data)
 * - Barra de ações em massa para itens selecionados via checkbox
 * - Estado vazio unificado e discreto (~160px)
 * - Rodapé: MedHit Tasks by Integrações & Automações
 */

"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Task, Status } from "@/server/services/data-store";
import { useTasks } from "@/context/task-context";
import {
  CheckCircle2,
  Circle,
  Plus,
  AlertCircle,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Minus,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  UserPlus,
  Trash2,
  Edit2,
  Search,
  Calendar,
  Eye,
  X,
  Layers,
  ArrowUpDown,
  Filter,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

type GroupByOption = "none" | "status" | "assignee" | "priority" | "dueDate";
type SortField = "manual" | "title" | "status" | "assignee" | "priority" | "dueDate";
type SortDirection = "asc" | "desc";

const PRIORITY_CONFIG: Record<
  Task["priority"],
  { label: string; color: string; bg: string; border: string; icon: React.ElementType; weight: number }
> = {
  urgent: { label: "Urgente", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: AlertCircle, weight: 4 },
  high: { label: "Alta", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: SignalHigh, weight: 3 },
  medium: { label: "Normal", color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20", icon: SignalMedium, weight: 2 },
  low: { label: "Baixa", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: SignalLow, weight: 1 },
  none: { label: "—", color: "text-slate-400", bg: "bg-slate-500/5", border: "border-transparent", icon: Minus, weight: 0 },
};

const ALL_PRIORITIES: Task["priority"][] = ["urgent", "high", "medium", "low", "none"];

export function TableView({ statuses, tasks, onTaskClick, projectId, areaId }: TableViewProps) {
  const {
    moveTask,
    updateTask,
    createTask,
    deleteTask,
    members,
    currentProject,
    hasPermission,
    setIsNewTaskModalOpen,
  } = useTasks();

  const canEdit = hasPermission("edit_task");
  const canCreate = hasPermission("create_task");
  const canDelete = hasPermission("delete_task");

  // Status de referência
  const doneStatus = statuses.find((s) => s.category === "done") || statuses[statuses.length - 1];
  const initialStatus = statuses[0] || doneStatus;

  // 1. Estado persistido de Agrupamento e Ordenação
  const [groupBy, setGroupBy] = useState<GroupByOption>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("medhit_list_groupby_v2");
        if (saved) return saved as GroupByOption;
      } catch {}
    }
    return "none";
  });

  const [sortField, setSortField] = useState<SortField>("manual");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);

  // 2. Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatusId, setFilterStatusId] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>("all");

  // 3. Seleção em massa
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // 4. Edição Inline de Título
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  // 5. Criação Rápida Inline Única
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateTitle, setQuickCreateTitle] = useState("");
  const [quickCreateContextStatusId, setQuickCreateContextStatusId] = useState<string | null>(null);
  const quickInputRef = useRef<HTMLInputElement | null>(null);

  // 6. Grupos colapsados quando agrupamento está ativo
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGroupByChange = (option: GroupByOption) => {
    setGroupBy(option);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("medhit_list_groupby_v2", option);
      } catch {}
    }
  };

  // Alternar ordenação ao clicar no cabeçalho
  const handleHeaderSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortField("manual");
        setSortDir("asc");
      }
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Foco no input de criação inline
  useEffect(() => {
    if (isQuickCreateOpen && quickInputRef.current) {
      quickInputRef.current.focus();
    }
  }, [isQuickCreateOpen]);

  // Atalho global 'N' para abrir a criação rápida
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "n" || e.key === "N") {
        if (!canCreate) return;
        e.preventDefault();
        setIsQuickCreateOpen(true);
        setQuickCreateContextStatusId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canCreate]);

  // Filtragem e Ordenação
  const processedTasks = useMemo(() => {
    let result = tasks.filter((task) => {
      if (hideCompleted) {
        const s = statuses.find((st) => st.id === task.statusId);
        if (s?.category === "done") return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!task.title.toLowerCase().includes(q)) return false;
      }
      if (filterStatusId !== "all" && task.statusId !== filterStatusId) {
        return false;
      }
      if (filterPriority !== "all" && task.priority !== filterPriority) {
        return false;
      }
      if (filterAssigneeId !== "all") {
        const has = task.assigneeIds.some((a) => a.id === filterAssigneeId);
        if (!has) return false;
      }
      return true;
    });

    if (sortField !== "manual") {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortField === "title") {
          cmp = a.title.localeCompare(b.title);
        } else if (sortField === "status") {
          const sA = statuses.find((s) => s.id === a.statusId)?.name || "";
          const sB = statuses.find((s) => s.id === b.statusId)?.name || "";
          cmp = sA.localeCompare(sB);
        } else if (sortField === "assignee") {
          const nameA = a.assigneeIds[0]?.name || "";
          const nameB = b.assigneeIds[0]?.name || "";
          cmp = nameA.localeCompare(nameB);
        } else if (sortField === "priority") {
          const wA = PRIORITY_CONFIG[a.priority]?.weight || 0;
          const wB = PRIORITY_CONFIG[b.priority]?.weight || 0;
          cmp = wA - wB;
        } else if (sortField === "dueDate") {
          const dA = a.dueDate || "9999-99-99";
          const dB = b.dueDate || "9999-99-99";
          cmp = dA.localeCompare(dB);
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [tasks, hideCompleted, searchQuery, filterStatusId, filterPriority, filterAssigneeId, sortField, sortDir, statuses]);

interface SectionItem {
  key: string;
  label: string;
  color?: string;
  avatarUrl?: string;
  tasks: Task[];
}

  // Estrutura de agrupamento
  const groupedSections: SectionItem[] = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "Todas as tarefas", color: "#38bdf8", tasks: processedTasks }];
    }

    if (groupBy === "status") {
      return statuses
        .map((st) => ({
          key: st.id,
          label: st.name,
          color: st.color,
          tasks: processedTasks.filter((t) => t.statusId === st.id),
        }))
        .filter((sec) => sec.tasks.length > 0); // Regra estrita: ocultar grupos vazios ao agrupar
    }

    if (groupBy === "priority") {
      return ALL_PRIORITIES.map((p) => {
        const conf = PRIORITY_CONFIG[p];
        return {
          key: p,
          label: conf.label === "—" ? "Sem prioridade" : conf.label,
          color: conf.color.startsWith("#") ? conf.color : undefined,
          tasks: processedTasks.filter((t) => t.priority === p),
        };
      }).filter((sec) => sec.tasks.length > 0);
    }

    if (groupBy === "assignee") {
      const assignedMap = new Map<string, { label: string; avatarUrl?: string; tasks: Task[] }>();
      const unassigned: Task[] = [];

      processedTasks.forEach((t) => {
        if (t.assigneeIds.length === 0) {
          unassigned.push(t);
        } else {
          t.assigneeIds.forEach((user) => {
            if (!assignedMap.has(user.id)) {
              assignedMap.set(user.id, { label: user.name, avatarUrl: user.avatarUrl, tasks: [] });
            }
            assignedMap.get(user.id)!.tasks.push(t);
          });
        }
      });

      const sections: SectionItem[] = Array.from(assignedMap.entries()).map(([id, info]) => ({
        key: id,
        label: info.label,
        avatarUrl: info.avatarUrl,
        tasks: info.tasks,
      }));

      if (unassigned.length > 0) {
        sections.push({
          key: "unassigned",
          label: "Não atribuídas",
          avatarUrl: undefined,
          tasks: unassigned,
        });
      }

      return sections;
    }

    if (groupBy === "dueDate") {
      const overdue: Task[] = [];
      const todayList: Task[] = [];
      const upcoming: Task[] = [];
      const noDate: Task[] = [];
      const todayStr = new Date().toISOString().slice(0, 10);

      processedTasks.forEach((t) => {
        if (!t.dueDate) noDate.push(t);
        else if (t.dueDate < todayStr) overdue.push(t);
        else if (t.dueDate === todayStr) todayList.push(t);
        else upcoming.push(t);
      });

      return [
        { key: "overdue", label: "Atrasadas", color: "#f43f5e", tasks: overdue },
        { key: "today", label: "Hoje", color: "#f59e0b", tasks: todayList },
        { key: "upcoming", label: "Próximos dias", color: "#38bdf8", tasks: upcoming },
        { key: "nodate", label: "Sem data limite", color: "#94a3b8", tasks: noDate },
      ].filter((s) => s.tasks.length > 0);
    }

    return [{ key: "all", label: "Tarefas", tasks: processedTasks }];
  }, [groupBy, processedTasks, statuses]);

  // Layout Grid dinâmico: se agrupado por Status, oculta a coluna Status
  const isGroupingByStatus = groupBy === "status";
  const listGridCols = isGroupingByStatus
    ? "36px minmax(320px, 1fr) 180px 140px 130px 64px"
    : "36px minmax(320px, 1fr) 150px 180px 140px 130px 64px";

  // Checkbox de seleção em massa
  const handleToggleSelectAll = () => {
    if (selectedTaskIds.size === processedTasks.length && processedTasks.length > 0) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(processedTasks.map((t) => t.id)));
    }
  };

  const handleToggleSelectRow = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // Alternar checkbox de conclusão
  const handleToggleTaskDone = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!canEdit) {
      toast.error("Permissão insuficiente para alterar tarefas.");
      return;
    }
    const currentStatus = statuses.find((s) => s.id === task.statusId);
    const isDone = currentStatus?.category === "done";
    if (isDone) {
      moveTask(task.id, initialStatus.id);
      toast.info(`Tarefa reaberta para "${initialStatus.name}"`);
    } else {
      moveTask(task.id, doneStatus.id);
      toast.success("Tarefa concluída!");
    }
  };

  // Submissão da criação inline única
  const handleQuickCreateSubmit = () => {
    const clean = quickCreateTitle.trim();
    if (!clean) {
      setIsQuickCreateOpen(false);
      return;
    }

    const targetStatusId = quickCreateContextStatusId || initialStatus.id;

    createTask({
      title: clean,
      statusId: targetStatusId,
      projectId: projectId || currentProject?.id || "",
      areaId: areaId || currentProject?.areaId || "",
      priority: "medium",
      taskType: "task",
      assigneeIds: [],
    });

    toast.success("Tarefa adicionada!");
    setQuickCreateTitle("");
    if (quickInputRef.current) {
      quickInputRef.current.focus();
    }
  };

  // Formatação curta de prazos
  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);
      const d = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isOverdue = d < today;
      const isToday = d.getTime() === today.getTime();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = d.getTime() === tomorrow.getTime();

      const label = isToday
        ? "Hoje"
        : isTomorrow
        ? "Amanhã"
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

      return { label, isOverdue, isToday, isTomorrow };
    } catch {
      return null;
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    filterStatusId !== "all" ||
    filterPriority !== "all" ||
    filterAssigneeId !== "all" ||
    hideCompleted;

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterStatusId("all");
    setFilterPriority("all");
    setFilterAssigneeId("all");
    setHideCompleted(false);
  };

  return (
    <div
      className="w-full flex flex-col min-h-0 select-none pb-8"
      style={{ "--list-cols": listGridCols } as React.CSSProperties}
    >
      {/* 1. BARRA SUPERIOR DA VIEW (48px) */}
      <div className="h-12 border-b border-slate-200/80 dark:border-white/10 px-4 flex items-center justify-between gap-3 bg-white/40 dark:bg-[#070e1e]/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5 flex-1 max-w-3xl overflow-x-auto no-scrollbar py-1">
          {/* Busca Rápida */}
          <div className="relative w-56 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar tarefa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Agrupar */}
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-0.5">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-mono text-slate-400">Agrupar:</span>
            <select
              value={groupBy}
              onChange={(e) => handleGroupByChange(e.target.value as GroupByOption)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer pr-1"
            >
              <option value="none">Nenhum</option>
              <option value="status">Status</option>
              <option value="priority">Prioridade</option>
              <option value="assignee">Responsável</option>
              <option value="dueDate">Data limite</option>
            </select>
          </div>

          {/* Filtro por Status (apenas se não estiver agrupado por status) */}
          {!isGroupingByStatus && (
            <select
              value={filterStatusId}
              onChange={(e) => setFilterStatusId(e.target.value)}
              className="px-2 py-1 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-sky-500 cursor-pointer shrink-0"
            >
              <option value="all">Status: Todos</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Filtro por Responsável */}
          <select
            value={filterAssigneeId}
            onChange={(e) => setFilterAssigneeId(e.target.value)}
            className="px-2 py-1 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-sky-500 cursor-pointer shrink-0"
          >
            <option value="all">Responsável: Todos</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Filtro por Prioridade */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2 py-1 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-sky-500 cursor-pointer shrink-0"
          >
            <option value="all">Prioridade: Todas</option>
            {ALL_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p === "none" ? "Sem prioridade" : PRIORITY_CONFIG[p].label}
              </option>
            ))}
          </select>

          {/* Ocultar concluídas */}
          <button
            type="button"
            onClick={() => setHideCompleted((prev) => !prev)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer shrink-0",
              hideCompleted
                ? "bg-sky-500/15 border-sky-500/30 text-sky-400"
                : "bg-slate-100/80 dark:bg-slate-900/80 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
            )}
          >
            {hideCompleted ? "Ocultando concluídas" : "Ocultar concluídas"}
          </button>

          {/* Botão Limpar Filtros se houver ativos */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-[11px] font-mono text-rose-400 hover:text-rose-300 cursor-pointer shrink-0"
              title="Limpar todos os filtros"
            >
              <X className="h-3 w-3" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        {/* Lado Direito: Contador + Botão Primário Único */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-mono text-slate-400">
            {processedTasks.length} {processedTasks.length === 1 ? "tarefa" : "tarefas"}
          </span>

          {canCreate && (
            <Button
              onClick={() => setIsNewTaskModalOpen(true)}
              size="sm"
              className="h-8 px-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-1.5 rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Nova tarefa</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. BARRA DE AÇÕES EM MASSA (QUANDO HÁ TAREFAS SELECIONADAS) */}
      {selectedTaskIds.size > 0 && (
        <div className="mx-4 mt-2 px-4 py-2 bg-sky-500/15 border border-sky-500/30 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 text-xs font-medium text-sky-300">
            <CheckSquare className="h-4 w-4 text-sky-400" />
            <span>
              {selectedTaskIds.size} {selectedTaskIds.size === 1 ? "tarefa selecionada" : "tarefas selecionadas"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Concluir todas */}
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  selectedTaskIds.forEach((id) => moveTask(id, doneStatus.id));
                  toast.success(`${selectedTaskIds.size} tarefas concluídas!`);
                  setSelectedTaskIds(new Set());
                }}
                className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
              >
                Concluir selecionadas
              </Button>
            )}

            {/* Excluir todas */}
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  selectedTaskIds.forEach((id) => deleteTask(id));
                  toast.info(`${selectedTaskIds.size} tarefas excluídas.`);
                  setSelectedTaskIds(new Set());
                }}
                className="h-7 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
              >
                Excluir
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedTaskIds(new Set())}
              className="h-7 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Desmarcar todas
            </Button>
          </div>
        </div>
      )}

      {/* 3. TABELA PLANA (SCROLL VERTICAL & HORIZONTAL SEGURO) */}
      <div className="flex-1 overflow-x-auto overflow-y-auto mt-2">
        <div className="min-w-[960px] flex flex-col border border-slate-200/80 dark:border-white/5 bg-white/50 dark:bg-[#081226]/50 rounded-xl mx-4 overflow-hidden shadow-2xs">
          {/* CABEÇALHO GLOBAL ÚNICO (STICKY 36px) */}
          <div
            role="row"
            className="sticky top-0 z-20 h-9 bg-slate-100/95 dark:bg-[#060c1a]/95 border-b border-slate-200 dark:border-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 font-semibold grid items-center backdrop-blur-md select-none"
            style={{ gridTemplateColumns: "var(--list-cols)" }}
          >
            {/* Coluna 1: Checkbox Global / Contador */}
            <div className="text-center flex items-center justify-center">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="h-5 w-5 rounded flex items-center justify-center text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                title="Selecionar todas as tarefas"
              >
                {selectedTaskIds.size > 0 && selectedTaskIds.size === processedTasks.length ? (
                  <CheckCircle2 className="h-4 w-4 text-sky-400" />
                ) : (
                  <span className="text-[10px] font-mono">#</span>
                )}
              </button>
            </div>

            {/* Coluna 2: Tarefa (Ordenável) */}
            <div
              onClick={() => handleHeaderSort("title")}
              className="pl-3 truncate flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors"
            >
              <span>Tarefa</span>
              {sortField === "title" ? (
                sortDir === "asc" ? (
                  <ChevronUp className="h-3 w-3 text-sky-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-sky-400" />
                )
              ) : (
                <ArrowUpDown className="h-2.5 w-2.5 opacity-40 hover:opacity-100" />
              )}
            </div>

            {/* Coluna 3: Status (Oculta se agrupado por Status) */}
            {!isGroupingByStatus && (
              <div
                onClick={() => handleHeaderSort("status")}
                className="pl-2 flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <span>Status</span>
                {sortField === "status" ? (
                  sortDir === "asc" ? (
                    <ChevronUp className="h-3 w-3 text-sky-400" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-sky-400" />
                  )
                ) : (
                  <ArrowUpDown className="h-2.5 w-2.5 opacity-40 hover:opacity-100" />
                )}
              </div>
            )}

            {/* Coluna 4: Responsável (Ordenável) */}
            <div
              onClick={() => handleHeaderSort("assignee")}
              className="pl-2 flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors"
            >
              <span>Responsável</span>
              {sortField === "assignee" ? (
                sortDir === "asc" ? (
                  <ChevronUp className="h-3 w-3 text-sky-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-sky-400" />
                )
              ) : (
                <ArrowUpDown className="h-2.5 w-2.5 opacity-40 hover:opacity-100" />
              )}
            </div>

            {/* Coluna 5: Prioridade (Ordenável) */}
            <div
              onClick={() => handleHeaderSort("priority")}
              className="pl-2 flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors"
            >
              <span>Prioridade</span>
              {sortField === "priority" ? (
                sortDir === "asc" ? (
                  <ChevronUp className="h-3 w-3 text-sky-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-sky-400" />
                )
              ) : (
                <ArrowUpDown className="h-2.5 w-2.5 opacity-40 hover:opacity-100" />
              )}
            </div>

            {/* Coluna 6: Data Limite (Ordenável) */}
            <div
              onClick={() => handleHeaderSort("dueDate")}
              className="pl-2 flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors"
            >
              <span>Data limite</span>
              {sortField === "dueDate" ? (
                sortDir === "asc" ? (
                  <ChevronUp className="h-3 w-3 text-sky-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-sky-400" />
                )
              ) : (
                <ArrowUpDown className="h-2.5 w-2.5 opacity-40 hover:opacity-100" />
              )}
            </div>

            {/* Coluna 7: Ações */}
            <div className="text-right pr-3">Ações</div>
          </div>

          {/* 4. CONTEÚDO DA TABELA: LINHAS EM SEQUÊNCIA OU SEÇÕES FINAS QUANDO AGRUPADO */}
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {/* ESTADO VAZIO: PROJETO TOTALMENTE SEM TAREFAS */}
            {tasks.length === 0 && (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6 text-sky-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Nenhuma tarefa ainda</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
                  Crie sua primeira tarefa usando o botão abaixo ou adicione rapidamente na linha da tabela.
                </p>
                {canCreate && (
                  <Button
                    onClick={() => setIsNewTaskModalOpen(true)}
                    size="sm"
                    className="h-8 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-1.5 rounded-xl cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Nova tarefa</span>
                  </Button>
                )}
              </div>
            )}

            {/* ESTADO VAZIO: FILTROS SEM RESULTADO */}
            {tasks.length > 0 && processedTasks.length === 0 && (
              <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
                <Filter className="h-7 w-7 text-slate-400 mb-2 opacity-50" />
                <h3 className="text-xs font-semibold text-slate-300">Nenhuma tarefa corresponde aos filtros</h3>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-2 text-xs font-mono text-sky-400 hover:underline cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}

            {/* RENDERIZAÇÃO DAS SEÇÕES / LINHAS */}
            {groupedSections.map((sec) => {
              const isSectionCollapsed = collapsedSections[sec.key] || false;

              return (
                <div key={sec.key} className="flex flex-col">
                  {/* CABEÇALHO DE SEÇÃO FINO (32px) - APENAS SE AGRUPAMENTO ESTIVER ATIVO */}
                  {groupBy !== "none" && (
                    <div
                      onClick={() => toggleSection(sec.key)}
                      className="h-8 px-3 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100/70 dark:hover:bg-slate-900/40 border-b border-slate-100 dark:border-white/5 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 text-slate-400 transition-transform duration-150 shrink-0",
                            !isSectionCollapsed && "rotate-90 text-slate-200"
                          )}
                        />
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                          {sec.color && (
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: sec.color }}
                            />
                          )}
                          <span>{sec.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-white/5">
                          {sec.tasks.length}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* LINHAS DE TAREFA (40px FIXOS) */}
                  {!isSectionCollapsed &&
                    sec.tasks.map((task, idx) => {
                      const isSelected = selectedTaskIds.has(task.id);
                      const currentStatus = statuses.find((s) => s.id === task.statusId);
                      const isDone = currentStatus?.category === "done";
                      const isEditingThisTitle = editingTaskId === task.id;
                      const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none;
                      const PriorityIcon = priorityInfo.icon;
                      const dateInfo = formatShortDate(task.dueDate);
                      const primaryAssignee = task.assigneeIds[0];

                      return (
                        <div
                          key={task.id}
                          role="row"
                          className={cn(
                            "group/row h-10 grid items-center text-xs transition-colors hover:bg-slate-50/90 dark:hover:bg-white/[0.04]",
                            isSelected && "bg-sky-500/10 dark:bg-sky-500/15",
                            isDone && "bg-slate-50/20 dark:bg-slate-950/20"
                          )}
                          style={{ gridTemplateColumns: "var(--list-cols)" }}
                        >
                          {/* 1. # / Checkbox */}
                          <div className="text-center align-middle">
                            <button
                              type="button"
                              onClick={(e) => handleToggleTaskDone(e, task)}
                              className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors mx-auto cursor-pointer"
                              title={isDone ? "Reabrir tarefa" : "Concluir tarefa"}
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <>
                                  <span
                                    onClick={(e) => handleToggleSelectRow(task.id, e)}
                                    className="text-[10px] font-mono text-slate-400 group-hover/row:hidden"
                                  >
                                    {idx + 1}
                                  </span>
                                  <Circle
                                    onClick={(e) => handleToggleSelectRow(task.id, e)}
                                    className="h-4 w-4 text-slate-400 hidden group-hover/row:inline-block hover:text-sky-400"
                                  />
                                </>
                              )}
                            </button>
                          </div>

                          {/* 2. Tarefa (Título com edição inline + absorve todo o espaço) */}
                          <div className="pl-3 pr-2 min-w-0 flex items-center gap-2">
                            {isEditingThisTitle ? (
                              <input
                                autoFocus
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onBlur={() => {
                                  if (editingTitle.trim() && editingTitle !== task.title) {
                                    updateTask(task.id, { title: editingTitle.trim() });
                                    toast.success("Título salvo!");
                                  }
                                  setEditingTaskId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    if (editingTitle.trim()) {
                                      updateTask(task.id, { title: editingTitle.trim() });
                                      toast.success("Título salvo!");
                                    }
                                    setEditingTaskId(null);
                                  }
                                  if (e.key === "Escape") {
                                    setEditingTaskId(null);
                                  }
                                }}
                                className="w-full bg-slate-100 dark:bg-slate-900 border border-sky-500 rounded px-2 py-0.5 text-xs text-slate-900 dark:text-white outline-none"
                              />
                            ) : (
                              <div className="flex items-center gap-2 truncate w-full">
                                <span
                                  onClick={() => onTaskClick(task)}
                                  onDoubleClick={() => {
                                    if (canEdit) {
                                      setEditingTaskId(task.id);
                                      setEditingTitle(task.title);
                                    }
                                  }}
                                  className={cn(
                                    "truncate font-medium text-slate-800 dark:text-slate-200 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer",
                                    isDone && "line-through opacity-60 text-slate-400 dark:text-slate-500"
                                  )}
                                  title={task.title}
                                >
                                  {task.title}
                                </span>

                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTaskId(task.id);
                                      setEditingTitle(task.title);
                                    }}
                                    className="opacity-0 group-hover/row:opacity-100 text-slate-400 hover:text-sky-400 p-0.5 rounded transition-opacity cursor-pointer shrink-0"
                                    title="Editar título"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                )}

                                {/* Badges de Checklist */}
                                {task.checklists && task.checklists.length > 0 && (
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.2 rounded shrink-0">
                                    ✓ {task.checklists[0]?.items?.filter((i) => i.isCompleted).length || 0}/
                                    {task.checklists[0]?.items?.length || 0}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 3. Status (Oculto se agrupado por Status) */}
                          {!isGroupingByStatus && (
                            <div className="pl-2 pr-2">
                              <Popover.Root>
                                <Popover.Trigger asChild>
                                  <button
                                    type="button"
                                    disabled={!canEdit}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-mono font-bold uppercase transition-colors cursor-pointer w-full justify-between disabled:cursor-default"
                                    style={{
                                      backgroundColor: currentStatus ? `${currentStatus.color}15` : undefined,
                                      color: currentStatus?.color,
                                      border: currentStatus ? `1px solid ${currentStatus.color}30` : undefined,
                                    }}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      {currentStatus && (
                                        <span
                                          className="h-1.5 w-1.5 rounded-full shrink-0"
                                          style={{ backgroundColor: currentStatus.color }}
                                        />
                                      )}
                                      <span className="truncate">{currentStatus?.name || "Status"}</span>
                                    </div>
                                    <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                                  </button>
                                </Popover.Trigger>

                                <Popover.Portal>
                                  <Popover.Content
                                    sideOffset={4}
                                    align="start"
                                    className="z-50 w-44 rounded-xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none space-y-0.5"
                                  >
                                    <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-white/5 mb-1">
                                      Alterar Status
                                    </div>
                                    {statuses.map((st) => (
                                      <Popover.Close asChild key={st.id}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            moveTask(task.id, st.id);
                                            toast.success(`Status: "${st.name}"`);
                                          }}
                                          className={cn(
                                            "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer",
                                            task.statusId === st.id
                                              ? "bg-sky-500/15 text-sky-400 font-semibold"
                                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                          )}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: st.color }} />
                                            <span>{st.name}</span>
                                          </div>
                                          {task.statusId === st.id && <Check className="h-3.5 w-3.5 text-sky-400" />}
                                        </button>
                                      </Popover.Close>
                                    ))}
                                  </Popover.Content>
                                </Popover.Portal>
                              </Popover.Root>
                            </div>
                          )}

                          {/* 4. Responsável (Avatar 24px + Nome) */}
                          <div className="pl-2 pr-2">
                            <Popover.Root>
                              <Popover.Trigger asChild>
                                <button
                                  type="button"
                                  disabled={!canEdit}
                                  className="flex items-center gap-2 px-1.5 py-1 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer w-full text-left truncate disabled:cursor-default"
                                >
                                  {primaryAssignee ? (
                                    <>
                                      <img
                                        src={primaryAssignee.avatarUrl}
                                        alt={primaryAssignee.name}
                                        className="h-6 w-6 rounded-full object-cover border border-sky-500/20 shrink-0"
                                      />
                                      <span className="truncate text-slate-700 dark:text-slate-300">
                                        {primaryAssignee.name}
                                      </span>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-slate-400 hover:text-slate-300">
                                      <div className="h-6 w-6 rounded-full border border-dashed border-slate-400 flex items-center justify-center shrink-0">
                                        <UserPlus className="h-3 w-3" />
                                      </div>
                                      <span className="text-[11px]">Atribuir</span>
                                    </div>
                                  )}
                                </button>
                              </Popover.Trigger>

                              <Popover.Portal>
                                <Popover.Content
                                  sideOffset={4}
                                  align="start"
                                  className="z-50 w-56 rounded-xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none space-y-0.5"
                                >
                                  <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-white/5 mb-1">
                                    Responsável
                                  </div>
                                  <Popover.Close asChild>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateTask(task.id, { assigneeIds: [] });
                                        toast.info("Responsável removido");
                                      }}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                                    >
                                      <Minus className="h-3 w-3" />
                                      <span>Desatribuir</span>
                                    </button>
                                  </Popover.Close>
                                  {members.map((m) => {
                                    const isAssigned = task.assigneeIds.some((a) => a.id === m.id);
                                    return (
                                      <Popover.Close asChild key={m.id}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            updateTask(task.id, {
                                              assigneeIds: [{ id: m.id, name: m.name, avatarUrl: m.avatarUrl, type: "user" }],
                                            });
                                            toast.success(`Atribuído a ${m.name}`);
                                          }}
                                          className={cn(
                                            "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer",
                                            isAssigned
                                              ? "bg-sky-500/15 text-sky-400 font-semibold"
                                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                          )}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <img src={m.avatarUrl} alt={m.name} className="h-5 w-5 rounded-full object-cover shrink-0" />
                                            <span className="truncate">{m.name}</span>
                                          </div>
                                          {isAssigned && <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                                        </button>
                                      </Popover.Close>
                                    );
                                  })}
                                </Popover.Content>
                              </Popover.Portal>
                            </Popover.Root>
                          </div>

                          {/* 5. Prioridade (Bandeira + Rótulo sem truncamento) */}
                          <div className="pl-2 pr-2">
                            <Popover.Root>
                              <Popover.Trigger asChild>
                                <button
                                  type="button"
                                  disabled={!canEdit}
                                  className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer w-full justify-between disabled:cursor-default",
                                    priorityInfo.bg,
                                    priorityInfo.color,
                                    priorityInfo.border
                                  )}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <PriorityIcon className="h-3 w-3 shrink-0" />
                                    <span className="text-[11px] font-semibold truncate">
                                      {priorityInfo.label}
                                    </span>
                                  </div>
                                  <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                                </button>
                              </Popover.Trigger>

                              <Popover.Portal>
                                <Popover.Content
                                  sideOffset={4}
                                  align="start"
                                  className="z-50 w-40 rounded-xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none space-y-0.5"
                                >
                                  <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-white/5 mb-1">
                                    Prioridade
                                  </div>
                                  {ALL_PRIORITIES.map((p) => {
                                    const pConf = PRIORITY_CONFIG[p];
                                    const PIcon = pConf.icon;
                                    const isCurr = task.priority === p;
                                    return (
                                      <Popover.Close asChild key={p}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            updateTask(task.id, { priority: p });
                                            toast.success(`Prioridade: ${pConf.label === "—" ? "Sem prioridade" : pConf.label}`);
                                          }}
                                          className={cn(
                                            "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer",
                                            isCurr
                                              ? "bg-sky-500/15 text-sky-400 font-semibold"
                                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                          )}
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <PIcon className={cn("h-3.5 w-3.5", pConf.color)} />
                                            <span>{pConf.label === "—" ? "Sem prioridade" : pConf.label}</span>
                                          </div>
                                          {isCurr && <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                                        </button>
                                      </Popover.Close>
                                    );
                                  })}
                                </Popover.Content>
                              </Popover.Portal>
                            </Popover.Root>
                          </div>

                          {/* 6. Data Limite */}
                          <div className="pl-2 pr-2">
                            <Popover.Root>
                              <Popover.Trigger asChild>
                                <button
                                  type="button"
                                  disabled={!canEdit}
                                  className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer w-full text-left truncate disabled:cursor-default",
                                    dateInfo?.isOverdue && !isDone
                                      ? "text-rose-500 bg-rose-500/10 border border-rose-500/20"
                                      : dateInfo?.isToday || dateInfo?.isTomorrow
                                      ? "text-amber-500 bg-amber-500/10 border border-amber-500/20"
                                      : dateInfo
                                      ? "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                                  )}
                                >
                                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate text-[11px] font-mono">
                                    {dateInfo?.label || "—"}
                                  </span>
                                </button>
                              </Popover.Trigger>

                              <Popover.Portal>
                                <Popover.Content
                                  sideOffset={4}
                                  align="start"
                                  className="z-50 w-52 rounded-xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none space-y-2"
                                >
                                  <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-white/5 pb-1">
                                    Data de Entrega
                                  </div>
                                  <input
                                    type="date"
                                    defaultValue={task.dueDate || ""}
                                    onChange={(e) => {
                                      updateTask(task.id, { dueDate: e.target.value });
                                      toast.success("Prazo definido!");
                                    }}
                                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
                                  />
                                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-white/5 text-[10px]">
                                    <Popover.Close asChild>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const todayStr = new Date().toISOString().slice(0, 10);
                                          updateTask(task.id, { dueDate: todayStr });
                                          toast.success("Prazo: Hoje");
                                        }}
                                        className="px-2 py-1 rounded hover:bg-sky-500/10 text-sky-400 cursor-pointer"
                                      >
                                        Hoje
                                      </button>
                                    </Popover.Close>
                                    <Popover.Close asChild>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const tom = new Date();
                                          tom.setDate(tom.getDate() + 1);
                                          updateTask(task.id, { dueDate: tom.toISOString().slice(0, 10) });
                                          toast.success("Prazo: Amanhã");
                                        }}
                                        className="px-2 py-1 rounded hover:bg-sky-500/10 text-sky-400 cursor-pointer"
                                      >
                                        Amanhã
                                      </button>
                                    </Popover.Close>
                                    {task.dueDate && (
                                      <Popover.Close asChild>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            updateTask(task.id, { dueDate: undefined });
                                            toast.info("Prazo removido");
                                          }}
                                          className="px-2 py-1 rounded hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                                        >
                                          Limpar
                                        </button>
                                      </Popover.Close>
                                    )}
                                  </div>
                                </Popover.Content>
                              </Popover.Portal>
                            </Popover.Root>
                          </div>

                          {/* 7. Ações (Visíveis no Hover) */}
                          <div className="text-right pr-3">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => onTaskClick(task)}
                                className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                                title="Ver detalhes"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTask(task.id);
                                    toast.info("Tarefa excluída");
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Excluir tarefa"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}

            {/* 5. UMA ÚNICA LINHA DE CRIAÇÃO RÁPIDA INLINE AO FINAL DA TABELA (40px) */}
            {canCreate && (
              <div className="h-10 px-3 flex items-center bg-slate-50/20 dark:bg-slate-950/20">
                {isQuickCreateOpen ? (
                  <div className="w-full flex items-center gap-2 pl-7 animate-in fade-in duration-100">
                    <input
                      ref={quickInputRef}
                      type="text"
                      placeholder="Nome da tarefa e Enter"
                      value={quickCreateTitle}
                      onChange={(e) => setQuickCreateTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleQuickCreateSubmit();
                        }
                        if (e.key === "Escape") {
                          setIsQuickCreateOpen(false);
                          setQuickCreateTitle("");
                        }
                      }}
                      onBlur={() => {
                        if (!quickCreateTitle.trim()) {
                          setIsQuickCreateOpen(false);
                        }
                      }}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-sky-500/50 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white outline-none placeholder:text-slate-500"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickCreateOpen(true);
                      setQuickCreateTitle("");
                    }}
                    className="pl-7 flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Adicionar tarefa</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RODAPÉ OBRIGATÓRIO */}
      <footer className="pt-4 text-center text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
        MedHit Tasks by Integrações & Automações
      </footer>
    </div>
  );
}
