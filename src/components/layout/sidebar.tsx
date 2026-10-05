"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Sparkles,
  Star,
  Plus,
  FolderPlus,
  Zap,
  Users,
} from "lucide-react";
import { useTasks } from "@/context/task-context";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentProjectSlug?: string;
  currentAreaSlug?: string;
  pendingApprovalsCount?: number;
}

export function Sidebar({
  currentProjectSlug = "workshop-medicina-integrativa",
  currentAreaSlug = "marketing",
  pendingApprovalsCount = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const { areas, setIsNewBoardModalOpen, setIsNewTeamModalOpen } = useTasks();

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
              <Link
                key={proj.id}
                href={`/medhit/${proj.areaSlug}/${proj.slug}/board`}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                  proj.active
                    ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30 shadow-sm font-semibold"
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
                {proj.active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0 shadow-[0_0_8px_#38bdf8]"></span>
                )}
              </Link>
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
  );
}
