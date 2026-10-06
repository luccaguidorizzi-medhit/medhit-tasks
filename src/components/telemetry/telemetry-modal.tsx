/**
 * MedHit Integrações & Automações
 * Componente Visualizador de Telemetria e Auditoria de Ações do Usuário.
 * 
 * Permite filtrar logs em tempo real, inspecionar payloads, exportar JSON
 * e auditar o histórico de eventos da aplicação. Restrito a Administradores e Owners.
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useState, useEffect } from "react";
import { telemetry, TelemetryLog, TelemetryLevel } from "@/lib/telemetry";
import { useTasks } from "@/context/task-context";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Trash2,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Info,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TelemetryModal({ isOpen, onClose }: TelemetryModalProps) {
  const { currentUser, hasPermission } = useTasks();
  const canView = hasPermission("view_telemetry");

  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<"all" | TelemetryLevel>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !canView) return;
    const unsubscribe = telemetry.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsubscribe();
  }, [isOpen, canView]);

  if (!isOpen) return null;

  if (!canView) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-md bg-white/95 dark:bg-[#081226]/95 border border-rose-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mx-auto flex items-center justify-center">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Acesso Restrito a Administradores</h3>
            <p className="text-xs text-slate-400 mt-1">
              Seu perfil atual ({currentUser.role.toUpperCase()}) não possui permissão para inspecionar registros de auditoria e telemetria de segurança.
            </p>
          </div>
          <Button variant="secondary" onClick={onClose} className="w-full text-xs">
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = selectedLevel === "all" || log.level === selectedLevel;
    const query = search.toLowerCase();
    const matchesSearch =
      !search ||
      log.type.toLowerCase().includes(query) ||
      log.message.toLowerCase().includes(query) ||
      (log.source && log.source.toLowerCase().includes(query));
    return matchesLevel && matchesSearch;
  });

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warnCount = logs.filter((l) => l.level === "warn").length;
  const successCount = logs.filter((l) => l.level === "success").length;
  const infoCount = logs.filter((l) => l.level === "info").length;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(telemetry.exportAsJson());
    setCopied(true);
    toast.success("Logs copiados para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(telemetry.exportAsJson());
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `medhit-telemetry-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Arquivo de telemetria exportado!");
  };

  const handleClear = () => {
    telemetry.clearLogs();
    toast.info("Histórico de telemetria limpo.");
  };

  const getLevelBadge = (level: TelemetryLevel) => {
    switch (level) {
      case "error":
        return {
          icon: ShieldAlert,
          bg: "bg-rose-500/15 text-rose-500 border-rose-500/30",
          dot: "bg-rose-500",
        };
      case "warn":
        return {
          icon: AlertTriangle,
          bg: "bg-amber-500/15 text-amber-500 border-amber-500/30",
          dot: "bg-amber-500",
        };
      case "success":
        return {
          icon: CheckCircle2,
          bg: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
          dot: "bg-emerald-500",
        };
      case "info":
      default:
        return {
          icon: Info,
          bg: "bg-sky-500/15 text-sky-500 border-sky-500/30",
          dot: "bg-sky-500",
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white/95 dark:bg-[#081226]/95 border border-slate-200 dark:border-sky-500/25 rounded-3xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/20">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Telemetria & Auditoria de Ações
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30">
                  MedHit Tasks
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro transparente de eventos, erros e navegação em tempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              title="Copiar JSON"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              onClick={handleDownloadJson}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors cursor-pointer text-xs"
              title="Exportar JSON"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={handleClear}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-xs"
              title="Limpar Histórico"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Toolbar de Filtros e Métricas */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#070e1e]/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por evento, mensagem ou fonte..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500/50 transition-colors"
            />
          </div>

          {/* Filtros de Nível */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setSelectedLevel("all")}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                selectedLevel === "all"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs"
                  : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-white/5"
              }`}
            >
              Todos ({logs.length})
            </button>
            <button
              onClick={() => setSelectedLevel("error")}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                selectedLevel === "error"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-rose-500 hover:bg-rose-500/10"
              }`}
            >
              Erros ({errorCount})
            </button>
            <button
              onClick={() => setSelectedLevel("warn")}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                selectedLevel === "warn"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "text-amber-500 hover:bg-amber-500/10"
              }`}
            >
              Alertas ({warnCount})
            </button>
            <button
              onClick={() => setSelectedLevel("success")}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                selectedLevel === "success"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-emerald-500 hover:bg-emerald-500/10"
              }`}
            >
              Sucessos ({successCount})
            </button>
            <button
              onClick={() => setSelectedLevel("info")}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                selectedLevel === "info"
                  ? "bg-sky-500 text-slate-950 shadow-xs"
                  : "text-sky-500 hover:bg-sky-500/10"
              }`}
            >
              Info ({infoCount})
            </button>
          </div>
        </div>

        {/* Lista de Logs */}
        <div className="flex-1 overflow-y-auto p-4 px-6 space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Terminal className="h-8 w-8 text-slate-400 mx-auto opacity-50" />
              <p className="text-xs text-slate-500">Nenhum evento registrado com os filtros selecionados.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const badge = getLevelBadge(log.level);
              const isExpanded = expandedLogId === log.id;
              const hasPayload = log.payload && Object.keys(log.payload).length > 0;
              const timeFormatted = new Date(log.timestamp).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              return (
                <div
                  key={log.id}
                  className={`rounded-2xl border transition-all text-xs font-sans ${
                    isExpanded
                      ? "border-sky-500/40 bg-sky-500/[0.04]"
                      : "border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 bg-white/50 dark:bg-black/20"
                  }`}
                >
                  <div
                    onClick={() => hasPayload && setExpandedLogId(isExpanded ? null : log.id)}
                    className={`p-3 px-4 flex items-center justify-between gap-3 ${
                      hasPayload ? "cursor-pointer select-none" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {timeFormatted}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border shrink-0 ${badge.bg}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        {log.level}
                      </span>

                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 shrink-0">
                        {log.type}
                      </span>

                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {log.message}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {log.source && (
                        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                          src: {log.source}
                        </span>
                      )}
                      {hasPayload && (
                        <span className="text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalhe Expansível do Payload */}
                  {isExpanded && hasPayload && (
                    <div className="px-4 pb-3 pt-1 border-t border-slate-200/50 dark:border-white/5">
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 overflow-x-auto">
                        <pre className="text-[11px] font-mono text-sky-300 whitespace-pre-wrap leading-relaxed">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-6 border-t border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>
            Total: <strong>{logs.length}</strong> eventos registrados em memória/localStorage
          </span>
          <span className="font-mono text-[10px]">
            MedHit Tasks by Integrações & Automações
          </span>
        </div>
      </div>
    </div>
  );
}
