"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Kanban,
  ListTodo,
  Table as TableIcon,
  BarChart3,
  CalendarDays,
  Tag,
  Share2,
  ArrowUpDown,
  Edit3,
  Inbox,
  Trash2,
  LayoutGrid,
  Flame,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EducationalTooltip } from "@/components/ui/tooltip";

interface ProjectToolbarProps {
  areaSlug: string;
  projectSlug: string;
  projectName: string;
  totalTasksCount: number;
  onOpenNewTask: () => void;
  onDeleteBoard?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  selectedFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export function ProjectToolbar({
  areaSlug,
  projectSlug,
  projectName,
  totalTasksCount,
  onOpenNewTask,
  onDeleteBoard,
  searchQuery = "",
  onSearchChange,
  selectedFilter = "all",
  onFilterChange,
}: ProjectToolbarProps) {
  const pathname = usePathname();

  const views = [
    {
      id: "board",
      label: "Board",
      icon: Kanban,
      href: `/medhit/${areaSlug}/${projectSlug}/board`,
      tooltip: { title: "Visão em Quadro (Kanban)", description: "Visualização espacial de fluxo contínuo com cartões arrastáveis e limites de WIP." },
    },
    {
      id: "list",
      label: "List",
      icon: ListTodo,
      href: `/medhit/${areaSlug}/${projectSlug}/list`,
      tooltip: { title: "Visão em Lista", description: "Agrupamento dinâmico por Status, Prioridade ou Responsável com totalizadores." },
    },
    {
      id: "table",
      label: "Table",
      icon: TableIcon,
      href: `/medhit/${areaSlug}/${projectSlug}/table`,
      tooltip: { title: "Visão em Tabela (Monday Style)", description: "Planilha interativa com dados tabulares, somas agregadas e métricas." },
    },
    {
      id: "calendar",
      label: "Calendário",
      icon: CalendarDays,
      href: `/medhit/${areaSlug}/${projectSlug}/calendar`,
      tooltip: { title: "Visão em Calendário", description: "Prazos e tarefas organizados em grade mensal com badges de status e prioridade." },
    },
    {
      id: "matrix",
      label: "Matriz",
      icon: LayoutGrid,
      href: `/medhit/${areaSlug}/${projectSlug}/matrix`,
      tooltip: { title: "Matriz de Priorização (Eisenhower)", description: "Organize demandas por Urgente vs Importante em 4 quadrantes para decisão ágil." },
    },
    {
      id: "sprints",
      label: "Sprints",
      icon: Flame,
      href: `/medhit/${areaSlug}/${projectSlug}/sprints`,
      tooltip: { title: "Ciclos Ágeis (Sprints & Burndown)", description: "Gestão por ciclos iterativos, capacidade da equipe, story points e queima de sprint." },
    },
    {
      id: "roadmap",
      label: "Marcos",
      icon: Flag,
      href: `/medhit/${areaSlug}/${projectSlug}/roadmap`,
      tooltip: { title: "Marcos & Roadmap (Milestones)", description: "Entregáveis macro com barra de progresso percentual e acompanhamento temporal." },
    },
    {
      id: "backlog",
      label: "Backlog",
      icon: Inbox,
      href: `/medhit/${areaSlug}/${projectSlug}/backlog`,
      tooltip: { title: "Backlog de Demandas", description: "Triagem de tarefas pendentes, priorização rápida e envio em lote para o quadro ativo." },
    },
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      href: `/medhit/${areaSlug}/${projectSlug}/dashboard`,
      tooltip: { title: "Dashboard Executivo do Projeto", description: "Taxa de conclusão em tempo real, barra de bateria de status e distribuição por responsável." },
    },
  ];

  return (
    <div className="border-b border-slate-200 dark:border-sky-500/15 bg-white/40 dark:bg-[#070e1e]/60 backdrop-blur-xl px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none shrink-0 z-10">
      {/* Esquerda: Project Title com ícone de edição, avatares e exclusão de board */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <EducationalTooltip
            title="Projeto Ativo"
            description="Nome do projeto atual. O MedHit organiza demandas em contêineres independentes por squad."
          >
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight cursor-help">
              {projectName}
            </h1>
          </EducationalTooltip>

          {/* Botão de Excluir Board */}
          {onDeleteBoard && (
            <EducationalTooltip
              title="Excluir este Board"
              description="Remove permanentemente este projeto/quadro e todas as suas tarefas."
            >
              <button
                onClick={onDeleteBoard}
                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </EducationalTooltip>
          )}
        </div>

        {/* Avatares dos membros do projeto + contador */}
        <EducationalTooltip
          title="Squad Alocada"
          description="Colaboradores e especialistas alocados neste quadro."
        >
          <div className="flex items-center -space-x-2 pl-2 border-l border-slate-200 dark:border-white/10 cursor-help">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucca"
              alt="Lucca"
              className="h-6 w-6 rounded-full border-2 border-slate-900 object-cover"
            />
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Fillipe"
              alt="Fillipe"
              className="h-6 w-6 rounded-full border-2 border-slate-900 object-cover"
            />
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mariana"
              alt="Mariana"
              className="h-6 w-6 rounded-full border-2 border-slate-900 object-cover"
            />
            <span className="h-6 w-6 rounded-full bg-slate-800 border-2 border-slate-900 text-[10px] font-mono text-slate-300 flex items-center justify-center font-bold">
              +5
            </span>
          </div>
        </EducationalTooltip>
      </div>

      {/* Direita: Quick Actions bar com Tooltips */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Quick Tag Filter */}
        <EducationalTooltip
          title="Filtrar por Tags"
          description="Isole tarefas por palavras-chave (#lancamento, #urgente, #copywriting)."
        >
          <button
            className="p-2 rounded-lg border border-slate-200 dark:border-sky-500/20 bg-slate-100/80 dark:bg-[#0c1830]/80 text-slate-600 dark:text-slate-300 hover:text-sky-400 hover:border-sky-500/40 transition-colors cursor-pointer"
          >
            <Tag className="h-3.5 w-3.5" />
          </button>
        </EducationalTooltip>

        {/* Calendar Filter */}
        <EducationalTooltip
          title="Prazos & Calendário"
          description="Filtre tarefas por data limite de entrega ou marcos de lançamento."
        >
          <button
            className="p-2 rounded-lg border border-slate-200 dark:border-sky-500/20 bg-slate-100/80 dark:bg-[#0c1830]/80 text-slate-600 dark:text-slate-300 hover:text-sky-400 hover:border-sky-500/40 transition-colors cursor-pointer"
          >
            <CalendarDays className="h-3.5 w-3.5" />
          </button>
        </EducationalTooltip>

        {/* View Switcher Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0c1830] p-1 rounded-xl border border-slate-200 dark:border-sky-500/20">
          {views.map((v) => {
            const isActive = pathname.endsWith(`/${v.id}`);
            return (
              <EducationalTooltip
                key={v.id}
                title={v.tooltip.title}
                description={v.tooltip.description}
              >
                <Link
                  href={v.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                    isActive
                      ? "bg-sky-500 text-slate-950 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <v.icon className="h-3.5 w-3.5" />
                  <span>{v.label}</span>
                </Link>
              </EducationalTooltip>
            );
          })}
        </div>

        {/* Sort Filter Button */}
        <EducationalTooltip
          title="Ordenar Tarefas"
          description="Alterne a ordenação por data de criação, prioridade ou prazo de vencimento."
        >
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-sky-500/20 bg-slate-100/80 dark:bg-[#0c1830]/80 text-slate-700 dark:text-slate-300 hover:text-sky-400 hover:border-sky-500/40 text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <span>Sort</span>
          </button>
        </EducationalTooltip>

        {/* Share Button */}
        <EducationalTooltip
          title="Compartilhar Link do Quadro"
          description="Copia a URL direta deste projeto para envio rápido a colaboradores."
        >
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Link do projeto copiado para o clipboard!");
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/30 transition-all cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>
        </EducationalTooltip>
      </div>
    </div>
  );
}
