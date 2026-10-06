/**
 * MedHit Integrações & Automações
 * Modal de Configurações do Workspace MedHit Tasks.
 * 
 * Inclui gerenciamento de temas, controle de acessos RBAC, configuração MCP
 * e aba dedicada de Auditoria & Telemetria em tempo real restrita a administradores.
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { McpSettings } from "@/components/settings/mcp-settings";
import { MembersManagement } from "@/components/settings/members-management";
import { useTasks } from "@/context/task-context";
import {
  Sun,
  Moon,
  Laptop,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Bot,
  Terminal,
  ExternalLink,
  Users,
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
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { telemetry, TelemetryLog, TelemetryLevel } from "@/lib/telemetry";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "appearance" | "members" | "permissions" | "ai" | "mcp" | "telemetry";
}

export function SettingsModal({ isOpen, onClose, defaultTab = "appearance" }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const {
    currentUser,
    hasPermission,
    switchActiveRole,
    isAiConfigured,
    aiApiKey,
    saveAiApiKey,
    removeAiApiKey,
  } = useTasks();
  const [inputAiKey, setInputAiKey] = useState("");

  const canViewTelemetry = hasPermission("view_telemetry");
  const canManageMembers = hasPermission("manage_members");
  const canManageSettings = hasPermission("manage_settings");
  const canManageAiTokens = hasPermission("manage_ai_tokens");
  const canManageMcp = hasPermission("manage_mcp");

  const isTabAllowed = (tab: "appearance" | "members" | "permissions" | "ai" | "mcp" | "telemetry") => {
    if (currentUser.role === "guest" && tab !== "appearance") return false;
    if (tab === "members") return currentUser.role !== "guest";
    if (tab === "telemetry") return canViewTelemetry;
    if (tab === "permissions") return canManageSettings;
    if (tab === "ai") return canManageAiTokens;
    if (tab === "mcp") return canManageMcp;
    return true;
  };

  const [activeTab, setActiveTab] = useState<"appearance" | "members" | "permissions" | "ai" | "mcp" | "telemetry">(
    isTabAllowed(defaultTab) ? defaultTab : "appearance"
  );
  const [copiedKey, setCopiedKey] = useState(false);

  // Estados da Telemetria
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [logSearch, setLogSearch] = useState("");
  const [logLevel, setLogLevel] = useState<"all" | TelemetryLevel>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultTab) {
      if (isTabAllowed(defaultTab)) {
        setActiveTab(defaultTab);
      } else {
        setActiveTab("appearance");
      }
    }
  }, [defaultTab, isOpen, canViewTelemetry, canManageSettings, canManageAiTokens, canManageMcp]);

  // Se o papel do usuário mudar enquanto a modal estiver aberta, garante que a aba ativa seja permitida
  useEffect(() => {
    if (!isTabAllowed(activeTab)) {
      setActiveTab("appearance");
    }
  }, [currentUser.role]);

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
    if (!canViewTelemetry) {
      toast.error("Ação não autorizada para o seu cargo.");
      return;
    }
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
    if (!canViewTelemetry) {
      toast.error("Ação não autorizada para o seu cargo.");
      return;
    }
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
                  MedHit Integrações & Automações
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalização, Governança RBAC, MCP e Auditoria Restrita
              </p>
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

            {currentUser.role !== "guest" && (
              <button
                onClick={() => setActiveTab("members")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "members"
                    ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Membros & Equipe</span>
              </button>
            )}

            {canManageSettings && (
              <button
                onClick={() => setActiveTab("permissions")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "permissions"
                    ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5"
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Permissões & RBAC</span>
              </button>
            )}

            {canManageAiTokens && (
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
            )}

            {canManageMcp && (
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
            )}

            {canViewTelemetry && (
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
            )}
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

            {activeTab === "members" && (
              <div className="space-y-4">
                <MembersManagement />
              </div>
            )}

            {activeTab === "permissions" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1 font-mono flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Controle de Acessos & Permissões (RBAC)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Definição de privilégios de segurança por cargo no Workspace MedHit Tasks.
                  </p>
                </div>

                {/* Perfil Atual & Simulador */}
                <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Seu Perfil Ativo</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 uppercase">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 mr-1">Alternar Papel:</span>
                    {(["owner", "admin", "member", "guest"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => switchActiveRole(r)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase transition-all cursor-pointer ${
                          currentUser.role === r
                            ? "bg-sky-500 text-slate-950 shadow-sm"
                            : "bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-white"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Matriz de Permissões */}
                <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-white/10">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Recurso / Ação</th>
                        <th className="py-2 px-2 text-center font-semibold text-amber-500">Owner</th>
                        <th className="py-2 px-2 text-center font-semibold text-sky-400">Admin</th>
                        <th className="py-2 px-2 text-center font-semibold text-emerald-400">Membro</th>
                        <th className="py-2 px-2 text-center font-semibold text-slate-400">Guest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[11px]">
                      {[
                        { name: "Visualizar Telemetria & Logs", owner: true, admin: true, member: false, guest: false, desc: "Acesso a auditoria e registros de integridade" },
                        { name: "Gestão de Membros & Convites", owner: true, admin: true, member: false, guest: false, desc: "Convidar, alterar papéis e redefinir credenciais" },
                        { name: "Configurar Servidor MCP & IA", owner: true, admin: true, member: false, guest: false, desc: "Ajustar tokens e endpoints externos" },
                        { name: "Criar Novos Boards & Projetos", owner: true, admin: true, member: true, guest: false, desc: "Estruturar novos fluxos de trabalho" },
                        { name: "Excluir Boards do Workspace", owner: true, admin: true, member: false, guest: false, desc: "Ação crítica de remoção permanente" },
                        { name: "Criar e Editar Tarefas", owner: true, admin: true, member: true, guest: false, desc: "Operação diária em kanban, lista e tabela" },
                        { name: "Aprovar Execuções de Agentes", owner: true, admin: true, member: false, guest: false, desc: "Homologação de ações de IA" },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</div>
                            <div className="text-[10px] text-slate-400">{item.desc}</div>
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {item.owner ? <Check className="h-3.5 w-3.5 text-emerald-400 mx-auto" /> : <X className="h-3.5 w-3.5 text-slate-600 mx-auto" />}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {item.admin ? <Check className="h-3.5 w-3.5 text-emerald-400 mx-auto" /> : <X className="h-3.5 w-3.5 text-slate-600 mx-auto" />}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {item.member ? <Check className="h-3.5 w-3.5 text-emerald-400 mx-auto" /> : <X className="h-3.5 w-3.5 text-slate-600 mx-auto" />}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">
                            {item.guest ? <Check className="h-3.5 w-3.5 text-emerald-400 mx-auto" /> : <X className="h-3.5 w-3.5 text-slate-600 mx-auto" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1 font-mono flex items-center gap-2">
                    <Bot className="h-4 w-4 text-sky-400" />
                    <span>Chaves de API & Modelos LLM</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gerenciamento seguro de credenciais para os agentes autônomos e automações do MedHit Tasks.
                  </p>
                </div>

                {/* Status da Conexão */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isAiConfigured
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                }`}>
                  {isAiConfigured ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span>{isAiConfigured ? "Chave de IA Conectada — Agentes Ativos" : "Nenhuma Chave Conectada — Agentes Inativos"}</span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed text-slate-600 dark:text-slate-300">
                      {isAiConfigured
                        ? "O motor de inteligência artificial está habilitado. Tarefas automáticas e o painel de agentes estão disponíveis para a equipe."
                        : "Por segurança e para evitar custos inesperados, os agentes autônomos ficam desabilitados no menu até que uma chave válida de API seja configurada."}
                    </p>
                  </div>
                </div>

                {/* Painel de Configuração da Chave */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-4">
                  {isAiConfigured ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Chave Ativa no Workspace
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                          Pronta para uso
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={aiApiKey ? `${aiApiKey.slice(0, 7)}••••••••••••${aiApiKey.slice(-4)}` : "••••••••••••••••••••••••"}
                          className="flex-1 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-500 cursor-not-allowed"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeAiApiKey}
                          className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/30"
                        >
                          Desconectar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                        Conectar Chave de API (OpenAI, Gemini ou Anthropic)
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="password"
                          value={inputAiKey}
                          onChange={(e) => setInputAiKey(e.target.value)}
                          placeholder="Cole sua chave (ex: sk-... ou AIza...)"
                          className="flex-1 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500/50"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!inputAiKey.trim()) {
                              toast.error("Por favor, informe uma chave de API válida.");
                              return;
                            }
                            saveAiApiKey(inputAiKey);
                            setInputAiKey("");
                          }}
                          className="text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold"
                        >
                          Salvar & Ativar
                        </Button>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                        A chave é mantida de forma segura no ambiente local da sua sessão do MedHit Tasks.
                      </span>
                    </div>
                  )}
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
            MedHit Integrações & Automações • Governança & Eficiência
          </span>
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
