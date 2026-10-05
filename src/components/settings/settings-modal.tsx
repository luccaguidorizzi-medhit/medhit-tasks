"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Moon,
  Laptop,
  Key,
  ShieldAlert,
  Bot,
  Terminal,
  ExternalLink,
  Check,
  Copy,
  Sliders,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"appearance" | "ai" | "mcp">("appearance");
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success("Copiado com sucesso!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white/90 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/25 rounded-2xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Configurações do Workspace</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Personalização, IA e integração MCP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs & Content */}
        <div className="flex min-h-[380px]">
          {/* Navigation */}
          <div className="w-48 border-r border-slate-200 dark:border-white/10 p-3 space-y-1 bg-slate-50 dark:bg-slate-950/30 select-none">
            <button
              onClick={() => setActiveTab("appearance")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "appearance"
                  ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5"
              }`}
            >
              <Sun className="h-4 w-4" />
              <span>Aparência & Tema</span>
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "ai"
                  ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5"
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>Agentes & Token IA</span>
            </button>

            <button
              onClick={() => setActiveTab("mcp")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "mcp"
                  ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5"
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span>Servidor MCP</span>
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {activeTab === "appearance" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1 font-mono">
                    Tema da Interface
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Alterne entre o visual Cósmico/Obsidian (escuro) ou Modo Claro para ambientes bem iluminados.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Escuro */}
                  <div
                    onClick={() => {
                      setTheme("dark");
                      toast.success("Modo escuro ativado");
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-2 ${
                      theme === "dark"
                        ? "border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.2)] font-semibold"
                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 hover:border-sky-500/30"
                    }`}
                  >
                    <Moon className="h-5 w-5 text-sky-400" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">Escuro</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Profundo Cósmico</span>
                  </div>

                  {/* Claro */}
                  <div
                    onClick={() => {
                      setTheme("light");
                      toast.success("Modo claro ativado");
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-2 ${
                      theme === "light"
                        ? "border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.2)] font-semibold"
                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 hover:border-sky-500/30"
                    }`}
                  >
                    <Sun className="h-5 w-5 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">Claro</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Alto Contraste</span>
                  </div>

                  {/* Sistema */}
                  <div
                    onClick={() => {
                      setTheme("system");
                      toast.success("Tema definido pelo sistema");
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-2 ${
                      theme === "system"
                        ? "border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.2)] font-semibold"
                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 hover:border-sky-500/30"
                    }`}
                  >
                    <Laptop className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">Sistema</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Automático</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Execução Autônoma de Agentes Desativada</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-200/90">
                    Conforme sua configuração, as execuções de IA locais foram desconectadas da interface para não consumir sua cota ou limites. O módulo de agentes será habilitado exclusivamente via token externo de API.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Token de Acesso Externo (Futuro)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      disabled
                      value="••••••••••••••••••••••••••••••••"
                      className="flex-1 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-400 cursor-not-allowed"
                    />
                    <Button variant="secondary" size="sm" disabled className="text-xs opacity-50">
                      Vincular Token
                    </Button>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Integração sob demanda por chave de serviço dedicada.
                  </span>
                </div>
              </div>
            )}

            {activeTab === "mcp" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1 font-mono">
                    Servidor MCP Streamable HTTP
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ferramentas de IA externas podem orquestrar tarefas via MCP.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Endpoint HTTP</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value="http://localhost:3000/api/mcp"
                      className="flex-1 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 outline-none"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleCopy("http://localhost:3000/api/mcp")}
                      className="h-8 gap-1.5 text-xs font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400"
                    >
                      {copiedKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-slate-950/40 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
