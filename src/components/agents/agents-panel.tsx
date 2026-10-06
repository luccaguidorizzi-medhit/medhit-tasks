"use client";

import React, { useState } from "react";
import { Agent, AgentRun } from "@/server/services/data-store";
import {
  Bot,
  Cpu,
  Play,
  Terminal,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTasks } from "@/context/task-context";
import { cn } from "@/lib/utils";

interface AgentsPanelProps {
  agents: Agent[];
  runs: AgentRun[];
  onTriggerClaim: (agentId: string) => void;
}

export function AgentsPanel({ agents, runs, onTriggerClaim }: AgentsPanelProps) {
  const { isAiConfigured } = useTasks();
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || "");

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const agentRuns = runs.filter((r) => r.agentId === selectedAgent?.id);

  return (
    <div className="space-y-6 max-w-5xl pb-12 select-none">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="h-5 w-5 text-sky-500" />
          <span>Agentes de IA & Telemetria</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
            {agents.length} Instâncias
          </span>
          {!isAiConfigured && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Requer Chave de API
            </span>
          )}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitoramento de consumo de tokens, ciclos de execução atômica e ferramentas permitidas no ecossistema MedHit.
        </p>
      </div>

      {/* Grid de Cards de Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {agents.map((ag) => {
          const isSelected = ag.id === selectedAgentId;
          const tokenPercent = Math.min(
            Math.round((ag.currentTokensUsed / ag.monthlyTokenBudget) * 100),
            100
          );

          return (
            <div
              key={ag.id}
              onClick={() => setSelectedAgentId(ag.id)}
              className={cn(
                "rounded-2xl border p-4 cursor-pointer transition-all shadow-xs",
                isSelected
                  ? "border-sky-500/50 bg-sky-500/10 dark:bg-sky-500/15 ring-1 ring-sky-500/30"
                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1830]/80 hover:border-sky-500/30 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={ag.avatarUrl}
                    alt={ag.name}
                    className="h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 object-cover"
                  />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                      {ag.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{ag.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 dark:text-emerald-400 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{isAiConfigured ? "ativo" : "em espera"}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                {ag.description}
              </p>

              {/* Barra de Progresso de Tokens */}
              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-white/5">
                <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Tokens / Mês</span>
                  <span>{(ag.currentTokensUsed / 1000).toFixed(0)}k / {(ag.monthlyTokenBudget / 1000000).toFixed(1)}M</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${tokenPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalhes & Execuções do Agente Selecionado */}
      {selectedAgent && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1830]/80 p-5 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-white/10">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Console de Execução: {selectedAgent.name}</span>
                <span className="text-[10px] font-mono text-slate-400">({selectedAgent.model})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Limite de concorrência: {selectedAgent.maxConcurrentTasks} tarefas simultâneas · Timeout: {selectedAgent.timeoutSeconds}s
              </p>
            </div>

            <Button
              size="sm"
              disabled={!isAiConfigured}
              onClick={() => {
                if (!isAiConfigured) {
                  toast.error("Módulo de IA Inativo", {
                    description: "Configure uma chave de API nas Configurações para acionar os agentes.",
                  });
                  return;
                }
                onTriggerClaim(selectedAgent.id);
                toast.success(`Ciclo de reivindicação disparado para ${selectedAgent.name}`);
              }}
              className={cn(
                "gap-1.5 text-xs font-semibold",
                isAiConfigured
                  ? "bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer"
                  : "opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-500"
              )}
            >
              {isAiConfigured ? <Play className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              <span>{isAiConfigured ? "Reivindicar Próxima Tarefa" : "Requer Chave de IA"}</span>
            </Button>
          </div>

          {/* Histórico de Runs em Formato de Terminal UNIX */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-sky-500" />
                EXECUTION_LOGS_STREAM
              </span>
              <span>{agentRuns.length} runs registrados</span>
            </div>

            <div className="space-y-3">
              {agentRuns.map((run) => (
                <div
                  key={run.id}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 overflow-hidden shadow-xs"
                >
                  {/* Top Bar do Run */}
                  <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 dark:text-white font-semibold">{run.taskTitle}</span>
                      <span className="text-slate-400">({run.id})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded border font-bold uppercase ${
                          run.status === "running"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                            : run.status === "waiting_approval"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {run.status}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        {run.tokenUsage.total} tokens ($~{run.costEstimate.toFixed(4)})
                      </span>
                    </div>
                  </div>

                  {/* Logs Monospaced */}
                  <div className="p-3 font-mono text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300">
                    {run.events.map((ev) => (
                      <div key={ev.id} className="flex items-start gap-2">
                        <span className="text-slate-400 shrink-0 select-none">
                          [{new Date(ev.createdAt).toLocaleTimeString("pt-BR")}]
                        </span>
                        <span className="text-indigo-500 dark:text-indigo-400 uppercase text-[9px] font-bold shrink-0">
                          {ev.type}:
                        </span>
                        <span className="text-slate-800 dark:text-slate-200">{ev.content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {agentRuns.length === 0 && (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-400 font-mono">
                  Nenhum ciclo de execução em aberto para este agente.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
