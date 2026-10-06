"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Search,
  Plus,
  Moon,
  Sun,
  Bell,
  Settings,
  Sparkles,
  ChevronRight,
  Layers,
  CalendarCheck2,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/settings/settings-modal";
import { EducationalTooltip } from "@/components/ui/tooltip";

interface TopbarProps {
  areaSlug?: string;
  areaName?: string;
  projectSlug?: string;
  projectName?: string;
  onOpenNewTask: () => void;
  onOpenSearch?: () => void;
}

export function Topbar({
  areaSlug = "marketing",
  areaName = "Marketing & Growth",
  projectSlug = "workshop-medicina-integrativa",
  projectName = "Lançamento Workshop Medicina Integrativa",
  onOpenNewTask,
  onOpenSearch,
}: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<"appearance" | "ai" | "mcp" | "telemetry">("appearance");

  return (
    <>
      <header className="h-14 border-b border-slate-200 dark:border-sky-500/15 bg-white/80 dark:bg-[#070e1e]/85 backdrop-blur-xl px-6 flex items-center justify-between gap-4 select-none shrink-0 z-20">
        {/* Breadcrumbs 100% Clicáveis e Interativos */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          {/* Nível 1: Workspace Global */}
          <EducationalTooltip
            title="Workspace MedHit (Início)"
            description="Clique para ir para a tela de Visão Geral com todos os projetos e métricas consolidadas."
          >
            <Link
              href="/medhit"
              className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-2 hover:text-sky-500 transition-colors"
            >
              <img
                src="/logo.svg"
                alt="MedHit"
                className="h-4 w-4 object-contain"
              />
              <span>MedHit</span>
            </Link>
          </EducationalTooltip>

          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 shrink-0" />

          {/* Nível 2: Área de Trabalho / Squad (Agora Clicável!) */}
          <EducationalTooltip
            title={`Squad: ${areaName}`}
            description="Clique para abrir o painel executivo desta área de trabalho e ver todos os boards pertencentes a ela."
          >
            <Link
              href={`/medhit/${areaSlug}`}
              className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors font-medium text-slate-600 dark:text-slate-400"
            >
              {areaName}
            </Link>
          </EducationalTooltip>

          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 shrink-0" />

          {/* Nível 3: Projeto / Board Ativo */}
          <EducationalTooltip
            title={`Board: ${projectName}`}
            description="Projeto ativo atual. Alterne entre Quadro, Lista, Tabela e Dashboard na barra de ferramentas."
          >
            <Link
              href={`/medhit/${areaSlug}/${projectSlug}/board`}
              className="text-slate-900 dark:text-white font-bold hover:text-sky-500 dark:hover:text-sky-400 transition-colors truncate max-w-xs"
            >
              {projectName}
            </Link>
          </EducationalTooltip>
        </div>

        {/* Search Bar estilo Referência com Tooltip */}
        <div className="flex-1 max-w-md mx-4">
          <EducationalTooltip
            title="Busca Global Rápida"
            description="Pesquise tarefas, projetos, tags ou membros em todo o workspace instantaneamente."
            shortcut="⌘K"
          >
            <div
              onClick={onOpenSearch}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-sky-500/20 bg-slate-100/80 dark:bg-[#0c1830]/70 hover:border-sky-500/40 text-slate-400 dark:text-slate-400 text-xs transition-all cursor-pointer shadow-inner"
            >
              <Search className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span className="flex-1 text-[11px] font-normal truncate">
                Buscar projetos, tarefas, tags...
              </span>
              <kbd className="text-[9px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </EducationalTooltip>
        </div>

        {/* Direita: Ações & Perfil com Tooltips Educativos */}
        <div className="flex items-center gap-2">
          {/* Acesso Rápido: Tarefas de Hoje */}
          <EducationalTooltip
            title="Tarefas para Hoje"
            description="Visão consolidada das suas demandas com vencimento hoje, atrasadas e próximos prazos."
          >
            <Link href="/medhit/today">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg border border-slate-200 dark:border-sky-500/20"
              >
                <CalendarCheck2 className="h-4 w-4 text-sky-400" />
                <span className="hidden md:inline font-medium">Hoje</span>
              </Button>
            </Link>
          </EducationalTooltip>

          {/* Acesso Rápido: Gestão de Squads */}
          <EducationalTooltip
            title="Gestão de Squads & Times"
            description="Painel de controle central de equipes, distribuição de boards e alocação de capacidade."
          >
            <Link href="/medhit/squads">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg border border-slate-200 dark:border-sky-500/20"
              >
                <Layers className="h-4 w-4 text-sky-400" />
                <span className="hidden md:inline font-medium">Squads</span>
              </Button>
            </Link>
          </EducationalTooltip>



          {/* Botão Configurações */}
          <EducationalTooltip
            title="Configurações do Workspace"
            description="Alterne temas, gerencie credenciais de IA e visualize os endpoints do servidor MCP."
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSettingsDefaultTab("appearance");
                setIsSettingsOpen(true);
              }}
              className="h-8 px-2.5 gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg border border-transparent hover:border-sky-500/20"
            >
              <Settings className="h-4 w-4 text-sky-400" />
              <span className="hidden sm:inline">Configurações</span>
            </Button>
          </EducationalTooltip>

          {/* Theme Toggle */}
          <EducationalTooltip
            title="Alternador de Tema"
            description="Alterne entre o Modo Claro (alto contraste) e o Modo Escuro (fundo espacial cósmico)."
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg border border-slate-200 dark:border-sky-500/20"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-sky-500" />
              )}
            </Button>
          </EducationalTooltip>

          {/* Notificações */}
          <EducationalTooltip
            title="Central de Notificações"
            description="Avisos de novas menções, conclusões de tarefas e solicitações de aprovação."
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#070e1e]"></span>
            </Button>
          </EducationalTooltip>

          {/* Perfil */}
          <EducationalTooltip
            title="Perfil do Usuário"
            description="Logado como Lucca Lagana (Owner / Admin do Workspace)."
          >
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10 cursor-help">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucca"
                alt="Lucca"
                className="h-7 w-7 rounded-full border border-sky-400/40 bg-sky-950 object-cover shadow-sm"
              />
            </div>
          </EducationalTooltip>

          {/* Botão Nova Tarefa */}
          <EducationalTooltip
            title="Criar Nova Demanda"
            description="Abre o painel rápido para cadastrar tarefas, definir tags ou gerar novos projetos."
            shortcut="C"
          >
            <Button
              onClick={onOpenNewTask}
              size="sm"
              className="h-8 px-3.5 text-xs font-semibold gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 dark:text-slate-950 shadow-md shadow-sky-500/20 rounded-lg ml-1"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Tarefa</span>
            </Button>
          </EducationalTooltip>
        </div>
      </header>

      {/* Modal de Configurações */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultTab={settingsDefaultTab}
      />
    </>
  );
}
