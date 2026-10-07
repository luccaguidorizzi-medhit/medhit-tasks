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

  // Coleta projetos de todas as áreas
  const allProjects = areas.flatMap((area) =>
    area.projects.map((proj) => ({
      ...proj,
      areaSlug: area.slug,
      areaName: area.name,
      active: Boolean(currentProjectSlug && currentProjectSlug === proj.slug && pathname.includes(proj.slug)),
    }))
  );

  return (
    <>
      <aside className="w-60 border-r border-slate-200 dark:border-sky-500/15 bg-white/90 dark:bg-[#070e1e]/90 backdrop-blur-2xl flex flex-col h-screen select-none shrink-0 z-20">
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
                <span>MedHit Tasks</span>
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

          {/* Seção 2: Projetos */}
          <div>
            <div className="px-2.5 mb-1.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <FolderKanban className="h-3 w-3 text-sky-500" />
                <span>Projetos</span>
              </div>
              {canCreateBoard && (
                <button
                  type="button"
                  onClick={() => setIsNewBoardModalOpen(true)}
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-sky-500 transition-colors cursor-pointer"
                  title="Criar novo projeto"
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="space-y-0.5 max-h-[calc(100vh-320px)] overflow-y-auto">
              {allProjects.map((proj) => (
                <div
                  key={proj.id}
                  onContextMenu={(e) => handleBoardContextMenu(e, proj)}
                  className="relative group/item"
                >
                  <Link
                    href={`/${proj.areaSlug}/${proj.slug}/table`}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                      proj.active
                        ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="h-2 w-2 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: proj.color || "#38bdf8" }}
                      />
                      <span className="truncate">{proj.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {proj.active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0 shadow-[0_0_6px_#38bdf8]" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleBoardContextMenu(e, proj);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-opacity cursor-pointer"
                        title="Opções do projeto"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </button>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {canCreateBoard && (
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => setIsNewBoardModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg border border-dashed border-slate-300 dark:border-sky-500/25 hover:border-sky-500/50 hover:bg-sky-500/5 text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-300 text-[11px] font-medium transition-all cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>+ Novo Projeto</span>
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
              <span className="font-semibold text-slate-700 dark:text-slate-300">MedHit Tasks</span>
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
