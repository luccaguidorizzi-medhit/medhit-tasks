/**
 * MedHit Integrações & Automações
 * Página Geral de Configurações do Workspace MedHit Tasks.
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useState } from "react";
import { MembersManagement } from "@/components/settings/members-management";
import { McpSettings } from "@/components/settings/mcp-settings";
import { useTasks } from "@/context/task-context";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Laptop,
  Users,
  ShieldCheck,
  Bot,
  Terminal,
  Activity,
  Sliders,
  Check,
  X,
} from "lucide-react";
import { TelemetryModal } from "@/components/telemetry/telemetry-modal";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { currentUser, hasPermission, switchActiveRole } = useTasks();

  const canViewTelemetry = hasPermission("view_telemetry");
  const canManageSettings = hasPermission("manage_settings");
  const canManageAiTokens = hasPermission("manage_ai_tokens");
  const canManageMcp = hasPermission("manage_mcp");

  const isTabAllowed = (tab: "appearance" | "members" | "permissions" | "ai" | "mcp") => {
    if (tab === "permissions") return canManageSettings;
    if (tab === "ai") return canManageAiTokens;
    if (tab === "mcp") return canManageMcp;
    return true;
  };

  const [activeTab, setActiveTab] = useState<"appearance" | "members" | "permissions" | "ai" | "mcp">("appearance");
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);

  // Garante que o usuário não fique em uma aba restrita caso seu papel mude
  React.useEffect(() => {
    if (!isTabAllowed(activeTab)) {
      setActiveTab("appearance");
    }
  }, [currentUser.role, canManageSettings, canManageAiTokens, canManageMcp]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-sky-500/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-500 border border-sky-500/30">
              WORKSPACE MEDHIT
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
              {currentUser.role}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Sliders className="h-6 w-6 text-sky-400" />
            <span>Configurações do Workspace</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão visual, credenciais de integração, regras de acesso RBAC e auditoria.
          </p>
        </div>

        {canViewTelemetry && (
          <Button
            onClick={() => setIsTelemetryModalOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Abrir Painel de Telemetria</span>
          </Button>
        )}
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab("appearance")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === "appearance"
              ? "bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sun className="h-3.5 w-3.5" />
          <span>Aparência</span>
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === "members"
              ? "bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Membros & Equipe</span>
        </button>

        {canManageSettings && (
          <button
            onClick={() => setActiveTab("permissions")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "permissions"
                ? "bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Permissões & RBAC</span>
          </button>
        )}

        {canManageAiTokens && (
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "ai"
                ? "bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Agentes & Token IA</span>
          </button>
        )}

        {canManageMcp && (
          <button
            onClick={() => setActiveTab("mcp")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "mcp"
                ? "bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Servidor MCP</span>
          </button>
        )}
      </div>

      {/* Conteúdo da Aba */}
      <div className="pt-2">
        {activeTab === "appearance" && (
          <div className="max-w-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tema da Interface</h3>
              <p className="text-xs text-slate-400">Personalize o contraste e paleta visual do MedHit Tasks.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${
                  theme === "light"
                    ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                    : "border-slate-200 dark:border-white/10 text-slate-400"
                }`}
              >
                <Sun className="h-5 w-5" />
                <span className="text-xs font-semibold">Claro</span>
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${
                  theme === "dark"
                    ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                    : "border-slate-200 dark:border-white/10 text-slate-400"
                }`}
              >
                <Moon className="h-5 w-5" />
                <span className="text-xs font-semibold">Escuro</span>
              </button>

              <button
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${
                  theme === "system"
                    ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                    : "border-slate-200 dark:border-white/10 text-slate-400"
                }`}
              >
                <Laptop className="h-5 w-5" />
                <span className="text-xs font-semibold">Sistema</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "members" && <MembersManagement />}

        {activeTab === "permissions" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Perfil de Acesso Atual</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">{currentUser.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 uppercase">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400 mr-1 font-medium">Simular Papel:</span>
                {(["owner", "admin", "member", "guest"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => switchActiveRole(r)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold uppercase transition-all cursor-pointer ${
                      currentUser.role === r
                        ? "bg-sky-500 text-slate-950 font-bold shadow-md"
                        : "bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Módulo / Ação</th>
                    <th className="py-3 px-3 text-center font-semibold text-amber-500">Owner</th>
                    <th className="py-3 px-3 text-center font-semibold text-sky-400">Admin</th>
                    <th className="py-3 px-3 text-center font-semibold text-emerald-400">Membro</th>
                    <th className="py-3 px-3 text-center font-semibold text-slate-400">Convidado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
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
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.desc}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {item.owner ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-slate-600 mx-auto" />}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {item.admin ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-slate-600 mx-auto" />}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {item.member ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-slate-600 mx-auto" />}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {item.guest ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-slate-600 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="max-w-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Agentes & Token IA</h3>
            <p className="text-xs text-slate-400">
              Credenciais centralizadas no servidor para alimentar agentes LLM de forma segura.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">OpenAI API Key</span>
              <input
                type="password"
                disabled
                value="••••••••••••••••••••••••••••••••"
                className="w-full bg-slate-200/50 dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-lg p-2 text-xs font-mono cursor-not-allowed text-slate-400"
              />
              <span className="text-[10px] text-slate-500 block">Gerenciado via variáveis de ambiente seguras.</span>
            </div>
          </div>
        )}

        {activeTab === "mcp" && <McpSettings />}
      </div>

      <TelemetryModal
        isOpen={isTelemetryModalOpen}
        onClose={() => setIsTelemetryModalOpen(false)}
      />
    </div>
  );
}
