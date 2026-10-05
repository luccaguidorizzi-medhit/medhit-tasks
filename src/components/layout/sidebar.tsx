/**
 * Lagana Flow - Core Reliability & UX Architect
 * Sidebar de Navegação do MedHit Tasks.
 * 
 * Inclui menu de contexto no botão direito nos boards favoritos
 * (Abrir Board, Copiar Link, Excluir Board) e atalhos rápidos.
 * Assinado por: Lagana Flow
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Sparkles,
  Star,
  Plus,
  FolderPlus,
  Zap,
  Users,
  Layers,
  CalendarCheck2,
  ExternalLink,
  Copy,
  Trash2,
  Check,
  MoreVertical,
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
  currentProjectSlug = "workshop-medicina-integrativa",
  currentAreaSlug = "marketing",
  pendingApprovalsCount = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    areas,
    setIsNewBoardModalOpen,
    setIsNewTeamModalOpen,
    setBoardToDelete,
    setIsDeleteBoardModalOpen,
  } = useTasks();

  // Estado do Menu de Contexto do Botão Direito
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    project: null,
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu de contexto ao clicar fora ou rolar
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

    // Calcula posição na tela sem ultrapassar as bordas
    const menuWidth = 220;
    const menuHeight = 160;
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
    const targetUrl = `/medhit/${contextMenu.project.areaSlug}/${contextMenu.project.slug}/board`;
    telemetry.track(
      "context_menu_action",
      `Abrir board "${contextMenu.project.name}" via menu de contexto`,
      { projectId: contextMenu.project.id, url: targetUrl },
      "info",
      "sidebar"
    );
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
    router.push(targetUrl);
  };

  const handleCopyLink = () => {
    if (!contextMenu.project) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/medhit/${contextMenu.project.areaSlug}/${contextMenu.project.slug}/board`;
    
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    toast.success("Link do quadro copiado para a área de transferência!");

    telemetry.track(
      "context_menu_action",
      `Link do quadro "${contextMenu.project.name}" copiado`,
      { projectId: contextMenu.project.id, url: fullUrl },
      "info",
      "sidebar"
    );

    setTimeout(() => {
      setCopiedLink(false);
      setContextMenu((prev) => ({ ...prev, isOpen: false }));
    }, 600);
  };

  const handleDeleteBoard = () => {
    if (!contextMenu.project) return;
    const targetProj = contextMenu.project;

    // Localiza o objeto completo do projeto a partir de areas
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
      telemetry.track(
        "context_menu_action",
        `Modal de exclusão do quadro "${fullProject.name}" acionado via menu de contexto`,
        { projectId: fullProject.id },
        "warn",
        "sidebar"
      );
    }

    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  const mainActions = [
    {
      title: "Visão Geral / Home",
      icon: Sparkles,
      href: "/medhit",
      isActive: pathname === "/medhit",
    },
    {
      title: "Projects board",
      icon: LayoutDashboard,
      href: `/medhit/${currentAreaSlug}/${currentProjectSlug}/board`,
      isActive: pathname.endsWith("/board"),
    },
    {
      title: "Task management",
      icon: CheckSquare,
      href: `/medhit/${currentAreaSlug}/${currentProjectSlug}/list`,
      isActive: pathname.endsWith("/list") || pathname.endsWith("/table"),
    },
    {
      title: "Dashboard do Projeto",
      icon: LayoutDashboard,
      href: `/medhit/${currentAreaSlug}/${currentProjectSlug}/dashboard`,
      isActive: pathname.endsWith("/dashboard"),
    },
    {
      title: "Membros & Equipes",
      icon: Users,
      href: "/medhit/members",
      isActive: pathname === "/medhit/members",
    },
  ];

  // Coleta todos os projetos das áreas dinamicamente
  const allProjects = areas.flatMap((area) =>
    area.projects.map((proj) => ({
      ...proj,
      areaSlug: area.slug,
      areaName: area.name,
      active: currentProjectSlug === proj.slug,
    }))
  );

  return (
    <>
      <aside className="w-64 border-r border-slate-200 dark:border-sky-500/15 bg-white/80 dark:bg-[#070e1e]/90 backdrop-blur-2xl flex flex-col h-screen select-none shrink-0 z-20">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 dark:border-sky-500/15 flex items-center justify-between">
          <Link href="/medhit" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/20 p-1.5 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/10 group-hover:scale-105 transition-transform">
              <img
                src="/logo.svg"
                alt="MedHit Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>MedHit Tasks</span>
              </div>
              <p className="text-[10px] text-sky-500 dark:text-sky-400 font-mono tracking-wider font-semibold">
                PROJECT MANAGER
              </p>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Actions */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
              Main actions
            </div>

            <div className="space-y-1">
              {mainActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                    action.isActive
                      ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30 shadow-xs font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                  )}
                >
                  <action.icon
                    className={cn(
                      "h-4 w-4",
                      action.isActive ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                  <span>{action.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* My Projects & Botão + Novo Board */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <Star className="h-3 w-3 text-amber-400" />
                <span>Favorite boards</span>
              </div>

              {/* Botão de Criação de Novo Board */}
              <button
                onClick={() => setIsNewBoardModalOpen(true)}
                className="h-5 w-5 rounded-md hover:bg-sky-500/10 hover:text-sky-400 flex items-center justify-center transition-colors cursor-pointer text-slate-400"
                title="Criar novo board"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {allProjects.map((proj) => (
                <div
                  key={proj.id}
                  onContextMenu={(e) => handleBoardContextMenu(e, proj)}
                  className="relative group/item"
                >
                  <Link
                    href={`/medhit/${proj.areaSlug}/${proj.slug}/board`}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all",
                      proj.active
                        ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30 shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="h-2 w-2 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: proj.color || "#38bdf8" }}
                      />
                      <span className="truncate">{proj.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {proj.active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0 shadow-[0_0_8px_#38bdf8]" />
                      )}
                      {/* Botão sutil de menu rápido (3 pontinhos) visível no hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleBoardContextMenu(e, proj);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-opacity cursor-pointer"
                        title="Opções do quadro (Botão Direito)"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </button>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botão Criar Board no Rodapé da Sidebar */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setIsNewBoardModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-sky-500/25 hover:border-sky-500/50 hover:bg-sky-500/5 text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-300 text-xs font-medium transition-all cursor-pointer"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>+ Criar Novo Board</span>
          </button>
        </div>

        {/* Upgrade / Workspace Footer Card estilo imagem de referência */}
        <div className="p-3 border-t border-slate-200 dark:border-sky-500/15">
          <div className="p-3.5 rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 dark:from-sky-500/15 dark:to-indigo-500/15 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Workspace MedHit</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-semibold">
                Lagana Flow
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Gestão cirúrgica de demandas & esteiras de alta performance.
            </p>
          </div>
        </div>
      </aside>

      {/* Menu de Contexto Elegante no Botão Direito (Lagana Flow) */}
      {contextMenu.isOpen && contextMenu.project && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-56 rounded-2xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none"
        >
          {/* Header do Menu */}
          <div className="px-2.5 py-1.5 border-b border-slate-200/80 dark:border-white/10 mb-1 flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: contextMenu.project.color || "#38bdf8" }}
            />
            <span className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">
              {contextMenu.project.name}
            </span>
          </div>

          <div className="space-y-0.5">
            {/* Opção 1: Abrir Board */}
            <button
              onClick={handleOpenBoard}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-300 transition-colors cursor-pointer text-left"
            >
              <ExternalLink className="h-3.5 w-3.5 text-sky-500" />
              <span>Abrir Board</span>
            </button>

            {/* Opção 2: Copiar Link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
            >
              {copiedLink ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span>{copiedLink ? "Link Copiado!" : "Copiar Link"}</span>
            </button>

            {/* Separador */}
            <div className="my-1 border-t border-slate-200/60 dark:border-white/5" />

            {/* Opção 3: Excluir Board */}
            <button
              onClick={handleDeleteBoard}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Excluir Board</span>
            </button>
          </div>

          {/* Mini Rodapé Lagana Flow */}
          <div className="px-2.5 pt-1 mt-1 border-t border-slate-200/50 dark:border-white/5 text-[9px] font-mono text-slate-400 text-right">
            Lagana Flow
          </div>
        </div>
      )}
    </>
  );
}
