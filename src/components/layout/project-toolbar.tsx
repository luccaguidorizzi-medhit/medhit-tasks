/**
 * MedHit Integrações & Automações
 * Barra de Ferramentas do Projeto (Project Toolbar - Monday Style).
 * 
 * Focada nos 4 modos essenciais de visualização:
 * 1. Quadro (Kanban)
 * 2. Tabela (Monday Table interativa)
 * 3. Calendário (Prazos e entregas)
 * 4. Visão Geral (Dashboard do projeto)
 * 
 * Ações diretas: + Nova Tarefa, Compartilhar Link, Excluir Quadro.
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Kanban,
  Table as TableIcon,
  BarChart3,
  CalendarDays,
  Share2,
  Trash2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EducationalTooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
}: ProjectToolbarProps) {
  const pathname = usePathname();

  // As 4 visões essenciais estilo Monday.com
  const views = [
    {
      id: "board",
      label: "Quadro",
      icon: Kanban,
      href: `/medhit/${areaSlug}/${projectSlug}/board`,
      tooltip: {
        title: "Quadro Kanban",
        description: "Visualização espacial de fluxo com cartões organizados por status.",
      },
    },
    {
      id: "table",
      label: "Tabela",
      icon: TableIcon,
      href: `/medhit/${areaSlug}/${projectSlug}/table`,
      tooltip: {
        title: "Tabela Interativa",
        description: "Planilha estilo Monday com badges de status, responsável, prazos e criação rápida.",
      },
    },
    {
      id: "calendar",
      label: "Calendário",
      icon: CalendarDays,
      href: `/medhit/${areaSlug}/${projectSlug}/calendar`,
      tooltip: {
        title: "Calendário de Entregas",
        description: "Tarefas organizadas por data de vencimento.",
      },
    },
    {
      id: "dashboard",
      label: "Visão Geral",
      icon: BarChart3,
      href: `/medhit/${areaSlug}/${projectSlug}/dashboard`,
      tooltip: {
        title: "Visão Geral & Métricas",
        description: "Percentual de conclusão, distribuição por status e progresso do projeto.",
      },
    },
  ];

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link do projeto copiado para a área de transferência!");
    }
  };

  return (
    <div className="border-b border-slate-200 dark:border-sky-500/15 bg-white/60 dark:bg-[#070e1e]/70 backdrop-blur-xl px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none shrink-0 z-10">
      {/* Esquerda: Nome do Projeto + Contador de Tarefas */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-xs">
            {projectName}
          </h1>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
            {totalTasksCount} {totalTasksCount === 1 ? "tarefa" : "tarefas"}
          </span>

          {onDeleteBoard && (
            <EducationalTooltip
              title="Excluir este Quadro"
              description="Exclui este projeto/quadro e suas tarefas."
            >
              <button
                type="button"
                onClick={onDeleteBoard}
                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Excluir quadro"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </EducationalTooltip>
          )}
        </div>
      </div>

      {/* Centro / Direita: Seletor de Visões + Botão Nova Tarefa */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Segmented Control das 4 Visões */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0c1830] p-1 rounded-xl border border-slate-200 dark:border-sky-500/20">
          {views.map((v) => {
            const isActive =
              pathname.endsWith(`/${v.id}`) ||
              (v.id === "table" && pathname.endsWith("/list"));

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
                      ? "bg-sky-500 text-slate-950 shadow-xs"
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

        {/* Botão Compartilhar */}
        <EducationalTooltip
          title="Compartilhar Link"
          description="Copia a URL direta deste projeto."
        >
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-sky-500/20 bg-slate-100/80 dark:bg-[#0c1830]/80 text-slate-700 dark:text-slate-300 hover:text-sky-400 hover:border-sky-500/40 text-xs font-medium transition-colors cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Compartilhar</span>
          </button>
        </EducationalTooltip>

        {/* Botão Principal: + Nova Tarefa */}
        <Button
          onClick={onOpenNewTask}
          size="sm"
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-1.5 rounded-xl shadow-xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nova Tarefa</span>
        </Button>
      </div>
    </div>
  );
}
