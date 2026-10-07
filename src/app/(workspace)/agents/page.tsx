"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTasks } from "@/context/task-context";
import { AgentsPanel } from "@/components/agents/agents-panel";
import { SettingsModal } from "@/components/settings/settings-modal";
import { Button } from "@/components/ui/button";
import { Bot, Key, Lock, ShieldAlert, Sparkles, Sliders } from "lucide-react";

export default function AgentsPage() {
  const { agents, agentRuns, triggerClaim, isAiConfigured, hasPermission } = useTasks();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const canManageAi = hasPermission("manage_ai_tokens");

  if (!isAiConfigured) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#081226]/80 backdrop-blur-xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Módulo de Agentes de IA Desativado
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Nenhuma chave de API de IA (OpenAI, Gemini ou Anthropic) está vinculada a este workspace. Para proteger o sistema e evitar execuções sem saldo, os agentes autônomos permanecem desativados.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 text-left flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              {canManageAi
                ? "Como administrador, você pode conectar uma chave de API nas Configurações para ativar os agentes imediatamente."
                : "Apenas administradores do workspace podem vincular ou alterar as credenciais de IA."}
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            {canManageAi ? (
              <Button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full sm:w-auto bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs gap-2"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Configurar Chave de API</span>
              </Button>
            ) : null}

            <Link href="/medhit" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full text-xs">
                Voltar à Visão Geral
              </Button>
            </Link>
          </div>
        </div>

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          defaultTab="ai"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <AgentsPanel
        agents={agents}
        runs={agentRuns}
        onTriggerClaim={triggerClaim}
      />
    </div>
  );
}

