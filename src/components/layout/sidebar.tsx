/**
 * MedHit WorkTrack v2 - Sidebar de Navegação (Padrão Monday.com)
 * Mantido por: Equipe MedHit I&A
 * 
 * Seções estruturadas:
 * 1. Brand Header + Seletor de Time / Workspace (Área ativa)
 * 2. Navegação Pessoal (Início & Minhas Tarefas)
 * 3. Quadros do Time Ativo com Ações Rápidas (+ Novo Quadro, Context Menu)
 * 4. Alternador Rápido de Times / Outros Espaços
 * 5. Rodapé com Perfil do Usuário e Configurações
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck2,
  FolderKanban,
  Plus,
  Settings,
  ExternalLink,
  Copy,
  Trash2,
  Check,
  Lock,
  HelpCircle,
  ChevronDown,
  Layers,
  Sparkles,
  X,
  Menu,
} from "lucide-react";
import { useTasks } from "@/context/task-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { HelpModal } from "@/components/help/help-modal";

interface SidebarProps {
  currentProjectSlug?: string;
  currentAreaSlug?: string;
  pendingApprovalsCount?: number;
}

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  project: {
    id: string;
    name: string;
    slug: string;
    areaSlug: string;
    areaName: string;
    color?: string;
  } | null;
}

export function Sidebar({
  currentProjectSlug = "",
  currentAreaSlug = "",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    tasks,
    areas,
    currentArea,
    currentUser,
    hasPermission,
    setIsNewBoardModalOpen,
    setBoardToDelete,
    setIsDeleteBoardModalOpen,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useTasks();

  const canCreateBoard = hasPermission("create_board");
  const canDeleteBoard = hasPermission("delete_board");

  // Time / Área ativa no seletor
  const activeArea =
    currentArea ||
    areas.find((a) => a.slug === currentAreaSlug) ||
    areas.find((a) => pathname.includes(`/${a.slug}/`)) ||
    areas[0];

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  // Estado do Menu de Contexto
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    project: null,
  });

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname, setIsMobileSidebarOpen]);

  // Fecha menus ao clicar fora
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
      }
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
        setIsWorkspaceMenuOpen(false);
      }
    };

    if (contextMenu.isOpen || isWorkspaceMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("scroll", () => setContextMenu((prev) => ({ ...prev, isOpen: false })), true);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu.isOpen, isWorkspaceMenuOpen]);

  const handleBoardContextMenu = (e: React.MouseEvent, proj: any, area: any) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 220;
    const menuHeight = 170;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight);

    setContextMenu({
      isOpen: true,
      x,
      y,
      project: {
        id: proj.id,
        name: proj.name,
        slug: proj.slug,
        areaSlug: area.slug,
        areaName: area.name,
        color: proj.color || area.color,
      },
    });
  };

  const handleOpenBoard = () => {
    if (!contextMenu.project) return;
    const targetUrl = `/${contextMenu.project.areaSlug}/${contextMenu.project.slug}/table`;
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
    router.push(targetUrl);
  };

  const handleCopyLink = () => {
    if (!contextMenu.project) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/${contextMenu.project.areaSlug}/${contextMenu.project.slug}/table`;

    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    toast.success("Link do quadro copiado!");

    setTimeout(() => {
      setCopiedLink(false);
      setContextMenu((prev) => ({ ...prev, isOpen: false }));
    }, 600);
  };

  const handleDeleteBoard = () => {
    if (!contextMenu.project) return;
    if (!canDeleteBoard) {
      toast.error("Apenas administradores podem excluir quadros.");
      setContextMenu((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    const targetProj = contextMenu.project;
    let fullProject: any = null;
    for (const a of areas) {
      const match = a.projects.find((p) => p.id === targetProj.id);
      if (match) {
        fullProject = match;
        break;
      }
    }

    if (fullProject) {
      setBoardToDelete(fullProject);
      setIsDeleteBoardModalOpen(true);
    }

    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  // Contagem de tarefas atribuídas ao usuário ativo
  const myPendingTasksCount = tasks.filter((t) => {
    const isAssigned = (t.assigneeIds || []).some(
      (a) => a.id === currentUser?.id || a.name?.toLowerCase() === currentUser?.name?.toLowerCase()
    );
    const isCompleted = t.statusId === "st-obra-4" || t.statusId === "st-conteudo-4" || t.statusId?.includes("done");
    return isAssigned && !isCompleted;
  }).length;

  const renderSidebarBody = () => (
    <>
        {/* Seletor de Time / Workspace no Topo (Estilo Monday) */}
        <div className="p-2 border-b border-slate-200/80 dark:border-white/5 relative" ref={workspaceMenuRef}>
          <button
            type="button"
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/70 dark:hover:bg-white/[0.08] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: activeArea?.color || "#0ea5e9" }}
              />
              <div className="truncate">
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
                  Espaço de Trabalho
                </p>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {activeArea?.name || "Geral"}
                </p>
              </div>
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", isWorkspaceMenuOpen && "rotate-180")} />
          </button>

          {/* Dropdown de Alternância de Times */}
          {isWorkspaceMenuOpen && (
            <div className="absolute top-full left-2 right-2 mt-1 z-50 rounded-xl bg-white dark:bg-[#0b1528] border border-slate-200 dark:border-sky-500/30 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
              <p className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 font-semibold border-b border-slate-100 dark:border-white/5 mb-1">
                Selecione o Time / Squad
              </p>
              <div className="space-y-0.5 max-h-56 overflow-y-auto">
                {areas.map((a) => {
                  const isSelected = a.slug === activeArea?.slug;
                  const firstBoard = a.projects?.[0];
                  return (
                    <button
                      key={a.slug}
                      type="button"
                      onClick={() => {
                        setIsWorkspaceMenuOpen(false);
                        if (firstBoard) {
                          router.push(`/${a.slug}/${firstBoard.slug}/table`);
                        } else {
                          router.push(`/${a.slug}`);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left",
                        isSelected
                          ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 font-semibold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: a.color || "#0ea5e9" }}
                        />
                        <span className="truncate">{a.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {a.projects?.length || 0} quadros
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Corpo da Navegação */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* Seção 1: Acesso Rápido Pessoal */}
          <div className="space-y-0.5">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                pathname === "/"
                  ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
              )}
            >
              <LayoutDashboard
                className={cn(
                  "h-3.5 w-3.5",
                  pathname === "/" ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"
                )}
              />
              <span>Início</span>
            </Link>

            <Link
              href="/today"
              className={cn(
                "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                pathname === "/today"
                  ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
              )}
            >
              <div className="flex items-center gap-2.5">
                <CalendarCheck2
                  className={cn(
                    "h-3.5 w-3.5",
                    pathname === "/today" ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"
                  )}
                />
                <span>Minhas Tarefas</span>
              </div>
              {myPendingTasksCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-sky-500/20 text-sky-600 dark:text-sky-300 font-bold">
                  {myPendingTasksCount}
                </span>
              )}
            </Link>
          </div>

          {/* Seção 2: Quadros do Time Ativo (Padrão Monday) */}
          <div className="space-y-1.5">
            <div className="px-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              <div className="flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5 text-sky-500" />
                <span>Quadros ({activeArea?.projects?.length || 0})</span>
              </div>
              {canCreateBoard && (
                <button
                  type="button"
                  onClick={() => setIsNewBoardModalOpen(true)}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-sky-500 transition-colors cursor-pointer"
                  title="Criar novo quadro no time"
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="space-y-0.5">
              {(activeArea?.projects || []).map((proj) => {
                const isCurrentProject = pathname.includes(`/${activeArea.slug}/${proj.slug}`);
                const boardTasks = tasks.filter((t) => t.projectId === proj.id && !t.parentId);

                return (
                  <div
                    key={proj.id}
                    onContextMenu={(e) => handleBoardContextMenu(e, proj, activeArea)}
                    className="group flex items-center justify-between rounded-lg transition-colors"
                  >
                    <Link
                      href={`/${activeArea.slug}/${proj.slug}/table`}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 truncate",
                        isCurrentProject
                          ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 font-semibold shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || activeArea.color || "#38bdf8" }}
                      />
                      <span className="truncate">{proj.name}</span>
                    </Link>

                    <div className="flex items-center gap-1 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-mono text-slate-400">
                        {boardTasks.length}
                      </span>
                    </div>
                  </div>
                );
              })}

              {(!activeArea?.projects || activeArea.projects.length === 0) && (
                <p className="px-2 py-2 text-[11px] text-slate-400 italic">
                  Nenhum quadro criado neste time.
                </p>
              )}
            </div>
          </div>

          {/* Seção 3: Outros Times (Acesso Rápido) */}
          {areas.filter((a) => a.slug !== activeArea?.slug).length > 0 && (
            <div className="pt-2 border-t border-slate-200/70 dark:border-white/5 space-y-1">
              <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span>Outros Espaços</span>
              </div>
              <div className="space-y-0.5">
                {areas
                  .filter((a) => a.slug !== activeArea?.slug)
                  .map((otherArea) => {
                    const firstBoard = otherArea.projects?.[0];
                    return (
                      <Link
                        key={otherArea.slug}
                        href={firstBoard ? `/${otherArea.slug}/${firstBoard.slug}/table` : `/${otherArea.slug}`}
                        className="flex items-center justify-between px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: otherArea.color || "#94a3b8" }}
                          />
                          <span className="truncate text-[11px]">{otherArea.name}</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400">
                          {otherArea.projects?.length || 0}
                        </span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé: Perfil, Configurações e Assinatura MedHit */}
        <div className="p-2.5 border-t border-slate-200 dark:border-sky-500/15 space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-2 text-xs font-medium transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                pathname === "/settings" && "text-sky-500 font-semibold"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Configurações</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Ajuda e Documentação"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Card do Usuário Logado */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5">
            <img
              src={currentUser?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucca"}
              alt={currentUser?.name || "Usuário"}
              className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"
            />
            <div className="truncate flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {currentUser?.name || "Lucca G."}
              </p>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {currentUser?.role === "owner" ? "Proprietário" : currentUser?.role || "Membro"}
              </p>
            </div>
          </div>

          {/* Assinatura Corporativa Obrigatória MedHit */}
          <div className="pt-1 px-1 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>MedHit WorkTrack</span>
            <span className="text-sky-500 font-semibold">Equipe MedHit I&A</span>
          </div>
        </div>
    </>
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-60 border-r border-slate-200 dark:border-sky-500/15 bg-white/95 dark:bg-[#070e1e]/95 backdrop-blur-2xl flex-col h-screen select-none shrink-0 z-20">
        {/* Brand Header Desktop */}
        <div className="p-3 border-b border-slate-200 dark:border-sky-500/15 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/20 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <img
                src="/logo.svg"
                alt="MedHit Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="font-bold text-xs tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>MedHit WorkTrack</span>
                <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold">
                  v2.0
                </span>
              </div>
            </div>
          </Link>
        </div>

        {renderSidebarBody()}
      </aside>

      {/* Drawer Mobile (Overlay com Backdrop - mobile-design) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] border-r border-slate-200 dark:border-sky-500/25 bg-white dark:bg-[#070e1e] shadow-2xl flex flex-col h-screen z-50 animate-in slide-in-from-left duration-200 select-none">
            {/* Brand Header Mobile com Botão Fechar de 44px */}
            <div className="p-3 border-b border-slate-200 dark:border-sky-500/15 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center gap-2 group"
              >
                <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/20 p-1 flex items-center justify-center shadow-xs">
                  <img
                    src="/logo.svg"
                    alt="MedHit Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <div className="font-bold text-xs tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>MedHit WorkTrack</span>
                    <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold">
                      v2.0
                    </span>
                  </div>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                title="Fechar menu"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {renderSidebarBody()}
          </aside>
        </div>
      )}

      {/* Modal de Ajuda & Documentação */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      {/* Menu de Contexto do Botão Direito */}
      {contextMenu.isOpen && contextMenu.project && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-52 rounded-xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none"
        >
          <div className="px-2 py-1 border-b border-slate-200/80 dark:border-white/10 mb-1 flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: contextMenu.project.color || "#38bdf8" }}
            />
            <span className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
              {contextMenu.project.name}
            </span>
          </div>

          <div className="space-y-0.5">
            <button
              onClick={handleOpenBoard}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-300 transition-colors cursor-pointer text-left"
            >
              <ExternalLink className="h-3.5 w-3.5 text-sky-500" />
              <span>Abrir Quadro</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
            >
              {copiedLink ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span>{copiedLink ? "Link Copiado!" : "Copiar Link"}</span>
            </button>

            <div className="my-1 border-t border-slate-200/60 dark:border-white/5" />

            <button
              onClick={handleDeleteBoard}
              disabled={!canDeleteBoard}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left",
                canDeleteBoard
                  ? "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                  : "opacity-40 cursor-not-allowed text-slate-400"
              )}
            >
              {canDeleteBoard ? <Trash2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              <span>{canDeleteBoard ? "Excluir Quadro" : "Excluir (Restrito)"}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
