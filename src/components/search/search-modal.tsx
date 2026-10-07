/**
 * MedHit Integrações & Automações
 * Modal de Busca Global Rápida (Estilo Monday / Linear / Spotlight)
 * 
 * Permite buscar instantaneamente em todo o workspace:
 * - Tarefas por título, descrição e tags (abre diretamente no TaskDrawer)
 * - Projetos e Quadros por nome (navega diretamente para o board)
 * - Atalho global de teclado ⌘K / Ctrl+K
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  FolderKanban,
  CheckSquare,
  ArrowRight,
  Clock,
  Sparkles,
  Layers,
  CalendarCheck2,
  LayoutDashboard,
} from "lucide-react";
import { useTasks } from "@/context/task-context";
import { Task, Project } from "@/server/services/data-store";
import { cn } from "@/lib/utils";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const { tasks, areas, setSelectedTask, isTaskVisibleForCurrentUser } = useTasks();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Foco automático ao abrir
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Captura Esc para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Coleta projetos de todas as áreas
  const allProjects = useMemo(() => {
    return areas.flatMap((area) =>
      area.projects.map((proj) => ({
        ...proj,
        areaSlug: area.slug,
        areaName: area.name,
      }))
    );
  }, [areas]);

  // Filtra tarefas visíveis que correspondem à query
  const matchingTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tasks
      .filter(isTaskVisibleForCurrentUser)
      .filter((t) => {
        const titleMatch = t.title.toLowerCase().includes(q);
        const descMatch = (t.description || "").toLowerCase().includes(q);
        const tagMatch = (t.tags || []).some((tg) => tg.toLowerCase().includes(q));
        return titleMatch || descMatch || tagMatch;
      })
      .slice(0, 8);
  }, [tasks, query, isTaskVisibleForCurrentUser]);

  // Filtra projetos que correspondem à query
  const matchingProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allProjects
      .filter((p) => p.name.toLowerCase().includes(q) || p.areaName.toLowerCase().includes(q))
      .slice(0, 5);
  }, [allProjects, query]);

  if (!isOpen) return null;

  const handleSelectTask = (task: Task) => {
    onClose();
    setSelectedTask(task);
  };

  const handleSelectProject = (project: typeof allProjects[0]) => {
    onClose();
    router.push(`/medhit/${project.areaSlug}/${project.slug}/table`);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-[#081226] border border-slate-200 dark:border-sky-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Barra de Pesquisa */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-3 bg-slate-50/60 dark:bg-slate-950/40">
          <Search className="h-5 w-5 text-sky-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar tarefas, projetos, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-white/10">
              ESC
            </kbd>
          )}
        </div>

        {/* Resultados */}
        <div className="p-3 max-h-[60vh] overflow-y-auto space-y-4">
          {query.trim() === "" ? (
            /* Estado Inicial: Atalhos Rápidos */
            <div className="p-4 space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block mb-2">
                  Atalhos Rápidos
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      router.push("/medhit/today");
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/5 hover:border-sky-500/40 bg-slate-50/70 dark:bg-white/[0.02] hover:bg-sky-500/5 transition-all text-left cursor-pointer"
                  >
                    <CalendarCheck2 className="h-4 w-4 text-sky-500" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Minhas Tarefas
                      </div>
                      <div className="text-[10px] text-slate-400">Ver demandas do dia</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      router.push("/medhit");
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/5 hover:border-sky-500/40 bg-slate-50/70 dark:bg-white/[0.02] hover:bg-sky-500/5 transition-all text-left cursor-pointer"
                  >
                    <LayoutDashboard className="h-4 w-4 text-emerald-500" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Visão Geral do Workspace
                      </div>
                      <div className="text-[10px] text-slate-400">Todos os projetos e métricas</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block mb-2">
                  Projetos Ativos
                </span>
                <div className="space-y-1">
                  {allProjects.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProject(p)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.color || "#38bdf8" }}
                        />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {p.name}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : matchingTasks.length === 0 && matchingProjects.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhum resultado encontrado
              </p>
              <p className="text-xs text-slate-400">
                Não encontramos tarefas ou projetos correspondentes a "{query}".
              </p>
            </div>
          ) : (
            <>
              {/* Tarefas Encontradas */}
              {matchingTasks.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold px-2 block">
                    Tarefas ({matchingTasks.length})
                  </span>
                  {matchingTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleSelectTask(task)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-sky-500/10 hover:text-sky-500 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <CheckSquare className="h-4 w-4 text-sky-500 shrink-0" />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-sky-500 truncate">
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {task.dueDate && (
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </span>
                        )}
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500">
                          {task.priority}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Projetos Encontrados */}
              {matchingProjects.length > 0 && (
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold px-2 block">
                    Projetos & Quadros ({matchingProjects.length})
                  </span>
                  {matchingProjects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => handleSelectProject(proj)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-sky-500/10 hover:text-sky-500 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color || "#38bdf8" }}
                        />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-sky-500 truncate">
                          {proj.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({proj.areaName})
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-500" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Pressione ESC para fechar</span>
          <span>MedHit Tasks</span>
        </div>
      </div>
    </div>
  );
}
