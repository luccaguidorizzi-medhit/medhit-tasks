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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AgentsPanelProps {
  agents: Agent[];
  runs: AgentRun[];
  onTriggerClaim: (agentId: string) => void;
}

export function AgentsPanel({ agents, runs, onTriggerClaim }: AgentsPanelProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || "");

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
  const agentRuns = runs.filter((r) => r.agentId === selectedAgent?.id);

  return (
    <div className="space-y-6 max-w-5xl pb-12 select-none">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-zinc-400" />
          <span>Agentes de IA & Telemetria</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/[0.08]">
            3 Instâncias
          </span>
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
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
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                isSelected
                  ? "border-white/20 bg-[#141518] shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "border-white/[0.06] bg-[#0f1013] hover:border-white/12 hover:bg-[#121316]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={ag.avatarUrl}
                    alt={ag.name}
                    className="h-8 w-8 rounded-full border border-white/10 bg-zinc-900 object-cover"
                  />
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-200 leading-tight">
                      {ag.name}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono truncate">{ag.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ativo</span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                {ag.description}
              </p>

              {/* Barra de Progresso de Tokens */}
              <div className="space-y-1 pt-2 border-t border-white/[0.05]">
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>Tokens / Mês</span>
                  <span>{(ag.currentTokensUsed / 1000).toFixed(0)}k / {(ag.monthlyTokenBudget / 1000000).toFixed(1)}M</span>
                </div>
                <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/[0.04]">
                  <div
                    className="h-full bg-zinc-400 rounded-full"
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
        <div className="rounded-xl border border-white/[0.06] bg-[#0c0d10] p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>Console de Execução: {selectedAgent.name}</span>
                <span className="text-[10px] font-mono text-zinc-500">({selectedAgent.model})</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Limite de concorrência: {selectedAgent.maxConcurrentTasks} tarefas simultâneas · Timeout: {selectedAgent.timeoutSeconds}s
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                onTriggerClaim(selectedAgent.id);
                toast.success(`Ciclo de reivindicação disparado para ${selectedAgent.name}`);
              }}
              className="gap-1.5 text-xs font-semibold"
            >
              <Play className="h-3 w-3" />
              Reivindicar Próxima Tarefa
            </Button>
          </div>

          {/* Histórico de Runs em Formato de Terminal UNIX */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5" />
                EXECUTION_LOGS_STREAM
              </span>
              <span>{agentRuns.length} runs registrados</span>
            </div>

            <div className="space-y-3">
              {agentRuns.map((run) => (
                <div
                  key={run.id}
                  className="rounded-lg border border-white/[0.06] bg-[#08090b] overflow-hidden"
                >
                  {/* Top Bar do Run */}
                  <div className="px-3.5 py-2 bg-zinc-950 border-b border-white/[0.04] flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-300 font-semibold">{run.taskTitle}</span>
                      <span className="text-zinc-600">({run.id})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded border font-bold uppercase ${
                          run.status === "running"
                            ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                            : run.status === "waiting_approval"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {run.status}
                      </span>
                      <span className="text-zinc-500 text-[10px]">
                        {run.tokenUsage.total} tokens ($~{run.costEstimate.toFixed(4)})
                      </span>
                    </div>
                  </div>

                  {/* Logs Monospaced */}
                  <div className="p-3 font-mono text-[11px] space-y-1.5 text-zinc-400">
                    {run.events.map((ev) => (
                      <div key={ev.id} className="flex items-start gap-2">
                        <span className="text-zinc-600 shrink-0 select-none">
                          [{new Date(ev.createdAt).toLocaleTimeString("pt-BR")}]
                        </span>
                        <span className="text-indigo-400 uppercase text-[9px] font-bold shrink-0">
                          {ev.type}:
                        </span>
                        <span className="text-zinc-300">{ev.content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {agentRuns.length === 0 && (
                <div className="p-8 text-center border border-dashed border-white/[0.06] rounded-xl text-xs text-zinc-600 font-mono">
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
