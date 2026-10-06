/**
 * Lagana Flow - Core Reliability & UX Architect
 * Modal de Configurações do Workspace MedHit Tasks.
 * 
 * Inclui gerenciamento de temas, configuração MCP e aba dedicada de
 * Auditoria & Telemetria em tempo real com exportação de logs.
 * Assinado por: Lagana Flow
 */

"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { McpSettings } from "@/components/settings/mcp-settings";
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
  Activity,
  Trash2,
  Download,
  Search,
  ChevronDown,
  ChevronRight,
  Info,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { telemetry, TelemetryLog, TelemetryLevel } from "@/lib/telemetry";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "appearance" | "ai" | "mcp" | "telemetry";
}

export function SettingsModal({ isOpen, onClose, defaultTab = "appearance" }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"appearance" | "ai" | "mcp" | "telemetry">(defaultTab);
  const [copiedKey, setCopiedKey] = useState(false);

  // Estados da Telemetria
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [logSearch, setLogSearch] = useState("");
  const [logLevel, setLogLevel] = useState<"all" | TelemetryLevel>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = telemetry.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success("Copiado com sucesso!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(telemetry.exportAsJson());
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `medhit-audit-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Arquivo de logs baixado!");
  };

  const handleClearLogs = () => {
    telemetry.clearLogs();
    toast.info("Histórico de auditoria foi reiniciado.");
  };

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = logLevel === "all" || log.level === logLevel;
    const q = logSearch.toLowerCase();
    const matchesSearch =
      !logSearch ||
      log.type.toLowerCase().includes(q) ||
      log.message.toLowerCase().includes(q) ||
      (log.source && log.source.toLowerCase().includes(q));
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/25 rounded-2xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Configurações do Workspace</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20">
                  Lagana Flow
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Personalização, IA, MCP e Auditoria de Telemetria</p>
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
        <div className="flex flex-1 min-h-[420px] overflow-hidden">
          {/* Navigation */}
          <div className="w-52 border-r border-slate-200 dark:border-white/10 p-3 space-y-1 bg-slate-50 dark:bg-slate-950/30 select-none shrink-0">
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

            <button
              onClick={() => setActiveTab("telemetry")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "telemetry"
                  ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="h-4 w-4 text-sky-400" />
                <span>Auditoria & Logs</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                {logs.length}
              </span>
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
                    Selecione o esquema de cores para sua visualização no MedHit Tasks.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                      theme === "light"
                        ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Sun className="h-5 w-5" />
                    <span className="text-xs font-medium">Claro</span>
                  </button>

                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                      theme === "dark"
                        ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Moon className="h-5 w-5" />
                    <span className="text-xs font-medium">Escuro</span>
                  </button>

                  <button
                    onClick={() => setTheme("system")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                      theme === "system"
                        ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Laptop className="h-5 w-5" />
                    <span className="text-xs font-medium">Sistema</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1 font-mono">
                    Chaves de API & Modelos LLM
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gerenciamento seguro de credenciais para os agentes autônomos.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                  <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                    As chaves são gerenciadas via variáveis de ambiente no servidor (.env.local) para garantir total conformidade de segurança.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">OpenAI API Key</span>
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
                <McpSettings />
              </div>
            )}

            {activeTab === "telemetry" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1 font-mono">
                      Log de Auditoria e Telemetria
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Rastreamento em tempo real de eventos críticos, ciclo de vida e ações de UX.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExportLogs}
                      className="h-7 text-[11px] gap-1 rounded-lg"
                    >
                      <Download className="h-3 w-3" />
                      <span>Exportar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClearLogs}
                      className="h-7 text-[11px] gap-1 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Limpar</span>
                    </Button>
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar logs..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/30 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1 text-[11px]">
                    {(["all", "error", "warn", "success", "info"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setLogLevel(lvl)}
                        className={`px-2 py-0.5 rounded font-mono font-medium capitalize transition-colors ${
                          logLevel === lvl
                            ? "bg-sky-500 text-slate-950 font-bold"
                            : "text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Registros */}
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Nenhum evento registrado.
                    </div>
                  ) : (
                    filteredLogs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      const hasPayload = log.payload && Object.keys(log.payload).length > 0;
                      return (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 text-xs space-y-1"
                        >
                          <div
                            onClick={() => hasPayload && setExpandedLogId(isExpanded ? null : log.id)}
                            className={`flex items-center justify-between gap-2 ${
                              hasPayload ? "cursor-pointer" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                {new Date(log.timestamp).toLocaleTimeString("pt-BR")}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                                  log.level === "error"
                                    ? "bg-rose-500/15 text-rose-500"
                                    : log.level === "warn"
                                    ? "bg-amber-500/15 text-amber-500"
                                    : log.level === "success"
                                    ? "bg-emerald-500/15 text-emerald-500"
                                    : "bg-sky-500/15 text-sky-500"
                                }`}
                              >
                                {log.level}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                                [{log.type}]
                              </span>
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {log.message}
                              </span>
                            </div>

                            {hasPayload && (
                              <span className="text-slate-400 shrink-0">
                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              </span>
                            )}
                          </div>

                          {isExpanded && hasPayload && (
                            <div className="pt-2 border-t border-slate-200/50 dark:border-white/5">
                              <pre className="text-[10px] font-mono text-sky-400 bg-slate-950 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(log.payload, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 px-6 border-t border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-slate-950/40 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono text-slate-400">
            Lagana Flow • Core Reliability & UX
          </span>
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
