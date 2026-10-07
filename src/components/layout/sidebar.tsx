/**
 * MedHit Integrações & Automações
 * Sidebar de Navegação Simplificada e Pragmática (Estilo Monday.com).
 * 
 * 3 seções limpas e objetivas:
 * 1. Início & Minhas Tarefas
 * 2. Projetos & Quadros com menu de contexto
 * 3. Membros, Configurações e Rodapé
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck2,
  FolderKanban,
  Folder,
  Plus,
  Users,
  Settings,
  ExternalLink,
  Copy,
  Trash2,
  Check,
  MoreVertical,
  Lock,
  Layers,
} from "lucide-react";
import { useTasks } from "@/context/task-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { telemetry } from "@/lib/telemetry";

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
    currentUser,
    hasPermission,
    setIsNewBoardModalOpen,
    setBoardToDelete,
    setIsDeleteBoardModalOpen,
  } = useTasks();

  const canCreateBoard = hasPermission("create_board");
  const canDeleteBoard = hasPermission("delete_board");

  // Estado do Menu de Contexto
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    project: null,
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
      }
    };

    if (contextMenu.isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("scroll", () => setContextMenu((prev) => ({ ...prev, isOpen: false })), true);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu.isOpen]);

  const handleBoardContextMenu = (e: React.MouseEvent, proj: any) => {
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
      project: proj,
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
    toast.success("Link do projeto copiado!");

    setTimeout(() => {
      setCopiedLink(false);
      setContextMenu((prev) => ({ ...prev, isOpen: false }));
    }, 600);
  };

  const handleDeleteBoard = () => {
    if (!contextMenu.project) return;
    if (!canDeleteBoard) {
      toast.error("Apenas administradores podem excluir projetos.");
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

  // Pastas/Tags por projeto extraídas das tarefas existentes
  const [collapsedSpaces, setCollapsedSpaces] = useState<Record<string, boolean>>({});

  const toggleSpaceCollapse = (spaceSlug: string) => {
    setCollapsedSpaces((prev) => ({
      ...prev,
      [spaceSlug]: !prev[spaceSlug],
    }));
  };

  return (
    <>
      <aside className="w-64 border-r border-slate-200 dark:border-sky-500/15 bg-white/95 dark:bg-[#070e1e]/95 backdrop-blur-2xl flex flex-col h-screen select-none shrink-0 z-20">
        {/* Brand Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-sky-500/15 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 p-1 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <img
                src="/logo.svg"
                alt="MedHit Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                <span>Medhit WorkTrack</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Corpo da Navegação */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {/* Seção 1: Início & Tarefas */}
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
                  "h-4 w-4",
                  pathname === "/" ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"
                )}
              />
              <span>Início</span>
            </Link>

            <Link
              href="/today"
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                pathname === "/today"
                  ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
              )}
            >
              <CalendarCheck2
                className={cn(
                  "h-4 w-4",
                  pathname === "/today" ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"
                )}
              />
              <span>Minhas Tarefas</span>
            </Link>
          </div>

          {/* Seção 2: Espaços & Pastas (Padrão ClickUp) */}
          <div className="space-y-3">
            <div className="px-2.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-sky-500" />
                <span>Espaços</span>
              </div>
              {canCreateBoard && (
                <button
                  type="button"
                  onClick={() => setIsNewBoardModalOpen(true)}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-sky-500 transition-colors cursor-pointer"
                  title="Criar novo espaço / projeto"
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {areas.map((area) => {
                const isSpaceCollapsed = !!collapsedSpaces[area.slug];
                const areaProject = area.projects[0];
                const projectSlug = areaProject?.slug || area.slug;

                // Extrai pastas (tags únicas) das tarefas desta área
                const areaTasks = tasks.filter((t) => t.areaId === area.slug || t.areaId === (area as any).id || t.projectId === areaProject?.id);
                const folderTagsMap = new Map<string, number>();
                areaTasks.forEach((t) => {
                  (t.tags || []).forEach((tag) => {
                    const clean = tag.trim();
                    if (clean) {
                      folderTagsMap.set(clean, (folderTagsMap.get(clean) || 0) + 1);
                    }
                  });
                });
                const folderTags = Array.from(folderTagsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

                const isCurrentSpace = pathname.includes(`/${area.slug}/`);

                return (
                  <div key={area.slug} className="space-y-1">
                    {/* Espaço Header */}
                    <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors group">
                      <button
                        type="button"
                        onClick={() => toggleSpaceCollapse(area.slug)}
                        className="flex items-center gap-2 text-left truncate flex-1 cursor-pointer"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: area.color || "#38bdf8" }}
                        />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {area.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({areaTasks.length})
                        </span>
                      </button>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/${area.slug}/${projectSlug}/table`}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-sky-500"
                          title="Abrir quadro geral"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Pastas dentro do Espaço */}
                    {!isSpaceCollapsed && (
                      <div className="pl-3.5 pr-1 space-y-0.5 border-l border-slate-200 dark:border-white/10 ml-3">
                        {/* Ver tudo deste espaço */}
                        <Link
                          href={`/${area.slug}/${projectSlug}/table`}
                          className={cn(
                            "flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-medium transition-colors",
                            isCurrentSpace && !pathname.includes("tag=") && !pathname.includes("folder=")
                              ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 font-semibold"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                          )}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <FolderKanban className="h-3 w-3 text-slate-400" />
                            <span className="truncate">Todas as Tarefas</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{areaTasks.length}</span>
                        </Link>

                        {/* Lista de Pastas (Tags) */}
                        {folderTags.map(([tag, count]) => {
                          const isTagActive = isCurrentSpace && (pathname.includes(`tag=${encodeURIComponent(tag)}`) || (typeof window !== "undefined" && window.location.search.includes(encodeURIComponent(tag))));
                          return (
                            <Link
                              key={tag}
                              href={`/${area.slug}/${projectSlug}/table?tag=${encodeURIComponent(tag)}`}
                              className={cn(
                                "flex items-center justify-between px-2 py-1 rounded-md text-[11px] transition-colors group/folder",
                                isTagActive
                                  ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 font-semibold"
                                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                              )}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Folder className="h-3 w-3 text-amber-500/80 shrink-0" />
                                <span className="truncate">{tag}</span>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                                {count}
                              </span>
                            </Link>
                          );
                        })}

                        {/* Botão de Nova Pasta rápido */}
                        <Link
                          href={`/${area.slug}/${projectSlug}/table`}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-slate-400 hover:text-sky-500 transition-colors"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          <span>+ Nova Pasta</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {canCreateBoard && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsNewBoardModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg border border-dashed border-slate-300 dark:border-sky-500/25 hover:border-sky-500/50 hover:bg-sky-500/5 text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-300 text-[11px] font-medium transition-all cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>+ Novo Espaço</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Seção 3: Rodapé com Configurações */}
        <div className="p-2.5 border-t border-slate-200 dark:border-sky-500/15 space-y-1">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              pathname === "/settings"
                ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
            )}
          >
            <Settings className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span>Configurações</span>
          </Link>

          {/* Assinatura no Rodapé */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/5 px-2 text-[10px] text-slate-400 flex flex-col gap-0.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Medhit WorkTrack</span>
              <span className="text-sky-500 font-bold text-[9px]">v1.0</span>
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
              by Integrações & Automações
            </span>
          </div>
        </div>
      </aside>

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
              <span>Abrir Projeto</span>
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
              <span>{copiedLink ? "Link Copiado!" : "Copiar Link do Projeto"}</span>
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
              <span>{canDeleteBoard ? "Excluir Projeto" : "Excluir (Restrito)"}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
