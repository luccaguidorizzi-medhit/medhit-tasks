"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/context/task-context";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  X,
  Palette,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";

interface NewBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewBoardModal({ isOpen, onClose }: NewBoardModalProps) {
  const router = useRouter();
  const { areas, createProject, currentArea } = useTasks();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAreaSlug, setSelectedAreaSlug] = useState(currentArea?.slug || "marketing");
  const [methodology, setMethodology] = useState<"kanban" | "scrum" | "simple">("kanban");
  const [selectedColor, setSelectedColor] = useState("#38bdf8");

  if (!isOpen) return null;

  const colorOptions = [
    { label: "Sky Blue", value: "#38bdf8" },
    { label: "Emerald", value: "#10b981" },
    { label: "Amber", value: "#f59e0b" },
    { label: "Purple", value: "#a855f7" },
    { label: "Rose", value: "#f43f5e" },
    { label: "Indigo", value: "#6366f1" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome do quadro");
      return;
    }

    const created = createProject({
      name: name.trim(),
      description: description.trim(),
      areaSlug: selectedAreaSlug,
      color: selectedColor,
      methodology,
    });

    toast.success(`Quadro "${created.name}" criado com sucesso!`);
    onClose();
    setName("");
    setDescription("");
    router.push(`/medhit/${selectedAreaSlug}/${created.slug}/board`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/25 rounded-2xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FolderPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Criar Novo Quadro / Projeto</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure um novo espaço de trabalho</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nome do Board / Projeto *
            </label>
            <input
              autoFocus
              type="text"
              placeholder="Ex: Tráfego Afiliados, Sprint CRM, Reformulação Portal..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Área / Squad */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Área de Trabalho (Squad)
            </label>
            <select
              value={selectedAreaSlug}
              onChange={(e) => setSelectedAreaSlug(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.slug} className="bg-slate-900 text-white">
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Metodologia */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Metodologia de Gestão
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethodology("kanban")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  methodology === "kanban"
                    ? "border-sky-500 bg-sky-500/10 text-sky-400 font-semibold"
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 text-slate-400"
                }`}
              >
                <div className="text-xs font-bold">Kanban</div>
                <div className="text-[10px] opacity-75">Fluxo Contínuo</div>
              </button>

              <button
                type="button"
                onClick={() => setMethodology("scrum")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  methodology === "scrum"
                    ? "border-sky-500 bg-sky-500/10 text-sky-400 font-semibold"
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 text-slate-400"
                }`}
              >
                <div className="text-xs font-bold">Scrum</div>
                <div className="text-[10px] opacity-75">Sprints & Pontos</div>
              </button>

              <button
                type="button"
                onClick={() => setMethodology("simple")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  methodology === "simple"
                    ? "border-sky-500 bg-sky-500/10 text-sky-400 font-semibold"
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 text-slate-400"
                }`}
              >
                <div className="text-xs font-bold">Lista Simples</div>
                <div className="text-[10px] opacity-75">To-do Linear</div>
              </button>
            </div>
          </div>

          {/* Cor do Projeto */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Identificador Visual (Cor do Board)
            </label>
            <div className="flex items-center gap-3">
              {colorOptions.map((c) => (
                <div
                  key={c.value}
                  onClick={() => setSelectedColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  className={`h-6 w-6 rounded-full cursor-pointer transition-transform ${
                    selectedColor === c.value ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900" : "hover:scale-110 opacity-70"
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Descrição / Objetivo
            </label>
            <textarea
              rows={2}
              placeholder="Objetivo principal deste projeto para o MedHit..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-white/10">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs">
              Criar Quadro
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
