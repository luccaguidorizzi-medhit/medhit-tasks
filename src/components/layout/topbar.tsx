"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/settings/settings-modal";
import { TelemetryModal } from "@/components/telemetry/telemetry-modal";
import { SearchModal } from "@/components/search/search-modal";
import { EducationalTooltip } from "@/components/ui/tooltip";
import { useTasks, UserRole } from "@/context/task-context";

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
  projectSlug = "",
  projectName = "",
  onOpenNewTask,
  onOpenSearch,
}: TopbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { currentUser, hasPermission, switchActiveRole, switchActiveUser, members } = useTasks();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<"appearance" | "members" | "permissions" | "ai" | "mcp" | "telemetry">("appearance");
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const canViewTelemetry = hasPermission("view_telemetry");
  const canCreateTask = hasPermission("create_task");

  const isInsideProject = Boolean(
    projectSlug &&
    projectName &&
    projectName !== "MedHit Tasks" &&
    pathname.includes(projectSlug)
  );

  const isToday = pathname.startsWith("/medhit/today");
  const isMembers = pathname.startsWith("/medhit/members");
  const isSettings = pathname.startsWith("/medhit/settings");
  const isSquads = pathname.startsWith("/medhit/squads");

  // Atalho global Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  return (
    <>
      <header className="h-14 border-b border-slate-200 dark:border-sky-500/15 bg-white/80 dark:bg-[#070e1e]/85 backdrop-blur-xl px-6 flex items-center justify-between gap-4 select-none shrink-0 z-20">
        {/* Breadcrumbs Dinâmicos & Contextuais */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Link
            href="/medhit"
            className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-2 hover:text-sky-500 transition-colors"
          >
            <img
              src="/logo.svg"
              alt="MedHit"
              className="h-4 w-4 object-contain"
            />
            <span>MedHit Tasks</span>
          </Link>

          {isInsideProject ? (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 shrink-0" />
              <Link
                href={`/medhit/${areaSlug}`}
                className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors font-medium text-slate-600 dark:text-slate-400 max-w-[130px] truncate"
              >
                {areaName}
              </Link>
              <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 shrink-0" />
              <span className="text-slate-900 dark:text-white font-bold truncate max-w-xs">
                {projectName}
              </span>
            </>
          ) : isToday ? (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 shrink-0" />
              <span className="text-slate-900 dark:text-white font-bold">Minhas Tarefas</span>
            </>
          ) : isMembers ? (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 shrink-0" />
              <span className="text-slate-900 dark:text-white font-bold">Membros & Equipe</span>
            </>
          ) : isSettings ? (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 shrink-0" />
              <span className="text-slate-900 dark:text-white font-bold">Configurações</span>
            </>
          ) : isSquads ? (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 shrink-0" />
              <span className="text-slate-900 dark:text-white font-bold">Equipes & Áreas</span>
            </>
          ) : pathname.startsWith("/medhit/") && pathname.split("/").filter(Boolean).length === 2 && !isToday && !isMembers && !isSettings ? (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600 shrink-0" />
              <span className="text-slate-900 dark:text-white font-bold">{areaName}</span>
            </>
          ) : null}
        </div>

        {/* Search Bar estilo Referência com Tooltip */}
        <div className="flex-1 max-w-md mx-4">
          <EducationalTooltip
            title="Busca Global Rápida"
            description="Pesquise tarefas, projetos, tags ou membros em todo o workspace instantaneamente."
            shortcut="⌘K"
          >
            <div
              onClick={() => {
                if (onOpenSearch) onOpenSearch();
                else setIsSearchOpen(true);
              }}
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

        {/* Direita: Ações & Perfil */}
        <div className="flex items-center gap-2">
          {/* Botão Configurações */}
          <EducationalTooltip
            title="Configurações do Workspace"
            description="Alterne temas, gerencie credenciais de IA, regras RBAC e membros."
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
            description="Alterne entre o Modo Claro e o Modo Escuro."
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

          {/* Perfil & Menu RBAC Interativo */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10 hover:opacity-85 transition-opacity cursor-pointer text-left"
              title="Clique para gerenciar seu perfil e simular papéis RBAC"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="h-7 w-7 rounded-full border border-sky-400/40 bg-sky-950 object-cover shadow-sm"
              />
              <div className="hidden xl:flex flex-col">
                <span className="text-xs font-semibold text-slate-900 dark:text-white leading-none">
                  {currentUser.name}
                </span>
                <span className="text-[9px] font-mono text-sky-400 uppercase font-bold mt-0.5">
                  {currentUser.role}
                </span>
              </div>
            </button>

            {/* Dropdown Menu do Perfil & Seletor de Papéis */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-10 w-64 rounded-2xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/30 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none z-50">
                {/* Cabeçalho do Usuário */}
                <div className="p-2 border-b border-slate-100 dark:border-white/10 mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="h-8 w-8 rounded-full border border-sky-400/40 object-cover"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Papel Atual:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-sky-500/15 text-sky-400 border border-sky-500/25">
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                {/* Simulador de Papéis RBAC */}
                <div className="p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl mb-2 border border-slate-200/50 dark:border-white/5">
                  {currentUser.role !== "guest" && (
                    <>
                      <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold mb-1.5 flex items-center justify-between">
                        <span>Alternar Usuário Ativo:</span>
                        <span className="text-[9px] text-sky-400 font-normal">({members.length} usuários)</span>
                      </div>
                      <div className="space-y-1 mb-2 max-h-36 overflow-y-auto pr-1">
                        {members.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              switchActiveUser(m.id);
                              setIsProfileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-all ${
                              currentUser.id === m.id
                                ? "bg-sky-500/15 border border-sky-500/30 text-sky-400"
                                : "hover:bg-slate-200/60 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img src={m.avatarUrl} alt={m.name} className="h-4 w-4 rounded-full object-cover shrink-0" />
                              <span className="text-xs truncate">{m.name}</span>
                            </div>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                              m.role === "admin" || m.role === "owner" ? "text-amber-400 bg-amber-400/10" : m.role === "member" ? "text-sky-400 bg-sky-400/10" : "text-slate-400 bg-slate-400/10"
                            }`}>
                              {m.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <div className={`text-[10px] font-mono text-slate-400 uppercase font-semibold mb-1.5 ${currentUser.role !== "guest" ? "border-t border-slate-200/50 dark:border-white/5 pt-1.5" : ""}`}>
                    Simular Papel (Role Override):
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                    {(["owner", "admin", "member", "guest"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          switchActiveRole(r);
                          setIsProfileMenuOpen(false);
                        }}
                        className={`px-2 py-1 rounded text-center font-bold uppercase transition-all ${
                          currentUser.role === r
                            ? "bg-sky-500 text-slate-950 shadow-xs"
                            : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ações do Menu - Protegidas para Guest */}
                {currentUser.role !== "guest" && (
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        setSettingsDefaultTab("permissions");
                        setIsSettingsOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-500/10 hover:text-sky-400 transition-colors text-left cursor-pointer"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Matriz de Permissões RBAC</span>
                    </button>

                    <button
                      onClick={() => {
                        setSettingsDefaultTab("members");
                        setIsSettingsOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-500/10 hover:text-sky-400 transition-colors text-left cursor-pointer"
                    >
                      <Users className="h-3.5 w-3.5 text-sky-400" />
                      <span>Membros & Senhas</span>
                    </button>

                    {canViewTelemetry && (
                      <button
                        onClick={() => {
                          setIsTelemetryOpen(true);
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-500/10 hover:text-sky-400 transition-colors text-left cursor-pointer"
                      >
                        <Activity className="h-3.5 w-3.5 text-sky-400" />
                        <span>Auditoria & Telemetria</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botão Nova Tarefa */}
          <EducationalTooltip
            title="Criar Nova Demanda"
            description={canCreateTask ? "Abre o painel rápido para cadastrar tarefas." : "Ação restrita a Membros e Administradores."}
            shortcut={canCreateTask ? "C" : undefined}
          >
            <Button
              onClick={canCreateTask ? onOpenNewTask : undefined}
              disabled={!canCreateTask}
              size="sm"
              className={`h-8 px-3.5 text-xs font-semibold gap-1.5 rounded-lg ml-1 ${
                canCreateTask
                  ? "bg-sky-500 hover:bg-sky-400 text-slate-950 dark:text-slate-950 shadow-md shadow-sky-500/20"
                  : "opacity-50 cursor-not-allowed bg-slate-300 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {canCreateTask ? <Plus className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
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

      {/* Modal de Telemetria */}
      <TelemetryModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />

      {/* Modal de Busca Global Rápida */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
