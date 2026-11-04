/**
 * MedHit WorkTrack v2 - Cabeçalho Unificado do Quadro (BoardHeader - 56px)
 * Mantido por: Equipe MedHit I&A
 * 
 * Unifica título do quadro, abas de visualização (Tabela, Quadro, Calendário, Visão Geral),
 * filtros rápidos e botão de ação rápida (+ Novo Item / + Novo Grupo).
 */

"use client";

import React, { useState } from "react";
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
  Search,
  Filter,
  FolderPlus,
  ChevronDown,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTasks } from "@/context/task-context";

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
  const { currentProject, createGroup, hasPermission, setIsMobileSidebarOpen } = useTasks();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // As 4 visões essenciais padronizadas estilo Monday
  const views = [
    {
      id: "table",
      label: "Tabela",
      icon: TableIcon,
      href: `/${areaSlug}/${projectSlug}/table`,
    },
    {
      id: "board",
      label: "Quadro",
      icon: Kanban,
      href: `/${areaSlug}/${projectSlug}/board`,
    },
    {
      id: "calendar",
      label: "Calendário",
      icon: CalendarDays,
      href: `/${areaSlug}/${projectSlug}/calendar`,
    },
    {
      id: "dashboard",
      label: "Visão Geral",
      icon: BarChart3,
      href: `/${areaSlug}/${projectSlug}/dashboard`,
    },
  ];

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link do quadro copiado!");
    }
  };

  const handleCreateNewGroup = () => {
    setIsAddMenuOpen(false);
    if (!currentProject) return;
    const groupName = window.prompt("Nome do novo grupo:");
    if (groupName && groupName.trim()) {
      createGroup(currentProject.id, groupName.trim());
    }
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-sky-500/15 bg-white/90 dark:bg-[#070e1e]/90 backdrop-blur-xl px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 select-none shrink-0 z-20">
      {/* Esquerda: Menu Hamburguer Mobile + Identificação do Quadro */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Botão Menu Mobile (Thumb Zone: 44px) */}
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden p-2 -ml-1 rounded-xl text-slate-500 hover:text-sky-500 hover:bg-sky-500/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
          title="Abrir menu lateral"
          aria-label="Abrir menu lateral"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: currentProject?.color || "#0ea5e9" }}
          />
          <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
            {projectName}
          </h1>

          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
            {totalTasksCount} {totalTasksCount === 1 ? "item" : "itens"}
          </span>
        </div>

        {onDeleteBoard && hasPermission("delete_board") && (
          <button
            type="button"
            onClick={onDeleteBoard}
            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Excluir este quadro"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Centro: Abas de Visualização (Monday Tabs) */}
      <nav className="flex items-center gap-1 bg-slate-100/80 dark:bg-[#0c1830] p-1 rounded-xl border border-slate-200/80 dark:border-sky-500/20 overflow-x-auto scrollbar-none max-w-full">
        {views.map((v) => {
          const isActive =
            pathname.endsWith(`/${v.id}`) ||
            (v.id === "table" && (pathname.endsWith("/list") || pathname.endsWith("/lista"))) ||
            (v.id === "board" && pathname.endsWith("/quadro")) ||
            (v.id === "calendar" && pathname.endsWith("/calendario")) ||
            (v.id === "dashboard" && pathname.endsWith("/visao-geral"));

          return (
            <Link
              key={v.id}
              href={v.href}
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 min-h-[36px]",
                isActive
                  ? "bg-sky-500 text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
              )}
            >
              <v.icon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{v.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Direita: Busca, Filtros, Compartilhar e Botão de Ação */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Campo de Busca Rápida Inline (se suportado pelo pai) */}
        {onSearchChange && (
          <div className="relative hidden lg:block w-36 xl:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar itens..."
              className="w-full pl-8 pr-2.5 py-1 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        )}

        {/* Botão Compartilhar */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-sky-500 hover:border-sky-500/40 text-xs font-medium transition-colors cursor-pointer"
          title="Copiar link do quadro"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Compartilhar</span>
        </button>

        {/* Dropdown de Ação: + Novo Item / + Novo Grupo */}
        <div className="relative">
          <div className="flex items-center rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-xs transition-colors">
            <button
              type="button"
              onClick={onOpenNewTask}
              className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Novo Item</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="px-1.5 py-1.5 border-l border-slate-950/20 hover:bg-black/10 rounded-r-xl cursor-pointer"
              title="Mais opções de criação"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {isAddMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-white dark:bg-[#0b1528] border border-slate-200 dark:border-sky-500/30 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 z-50">
              <button
                type="button"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  onOpenNewTask();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-300 transition-colors text-left cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-sky-500" />
                <span>Novo Item / Tarefa</span>
              </button>
              <button
                type="button"
                onClick={handleCreateNewGroup}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-300 transition-colors text-left cursor-pointer"
              >
                <FolderPlus className="h-3.5 w-3.5 text-indigo-500" />
                <span>Novo Grupo (Fase/Módulo)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
