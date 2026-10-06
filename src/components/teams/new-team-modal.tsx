"use client";

import React, { useState } from "react";
import { useTasks } from "@/context/task-context";
import { Button } from "@/components/ui/button";
import { Users, X, Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface NewTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewTeamModal({ isOpen, onClose }: NewTeamModalProps) {
  const { createTeam } = useTasks();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
      toast.error("Informe o nome do time");
      return;
    }

    createTeam({
      name: name.trim(),
      description: description.trim(),
      color: selectedColor,
      icon: "users",
    });

    onClose();
    setName("");
    setDescription("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#081226] border border-slate-200 dark:border-sky-500/25 rounded-2xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Criar Nova Equipe / Área</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Agrupe projetos e pessoas em uma equipe de trabalho</p>
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
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nome da Equipe *
            </label>
            <input
              autoFocus
              type="text"
              placeholder="Ex: Comercial, Novos Negócios, Operações, Clínico..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Descrição da Equipe / Propósito
            </label>
            <textarea
              rows={2}
              placeholder="Descreva as responsabilidades e objetivos desta equipe de trabalho..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors resize-none"
            />
          </div>

          {/* Seletor de Cores */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Palette className="h-3 w-3 text-sky-400" />
              <span>Cor Identificadora da Equipe</span>
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  className={`h-7 w-7 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                    selectedColor === c.value ? "ring-2 ring-white scale-110 shadow-md" : "opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-white/10">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20"
            >
              Criar Time
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
