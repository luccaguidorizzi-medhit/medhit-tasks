"use client";

import React, { useState } from "react";
import { Task, Sprint } from "@/server/services/data-store";
import {
  Layers,
  Flame,
  CheckCircle,
  Plus,
  RotateCcw,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface AgileViewProps {
  tasks: Task[];
  sprints: Sprint[];
  onTaskClick: (task: Task) => void;
}

export function AgileView({ tasks, sprints, onTaskClick }: AgileViewProps) {
  const [activeTab, setActiveTab] = useState<"sprint" | "burndown" | "retro">("sprint");

  const currentSprint = sprints.find((s) => s.status === "active") || sprints[0];

  const burndownData = [
    { day: "D1", ideal: 25, atual: 25 },
    { day: "D3", ideal: 21, atual: 24 },
    { day: "D6", ideal: 16, atual: 19 },
    { day: "D9", ideal: 11, atual: 13 },
    { day: "D12", ideal: 6, atual: 8 },
    { day: "D15", ideal: 0, atual: 3 },
  ];

  return (
    <div className="space-y-5 max-w-5xl pb-12 select-none">
      {/* Sprint Header (Linear / Jira Craft) */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-4.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-white/[0.08] font-semibold uppercase tracking-wider">
              Sprint Ativa
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              01 Out - 15 Out (10 dias restantes)
            </span>
          </div>
          <h2 className="text-sm font-bold text-zinc-100">
            {currentSprint ? currentSprint.name : "Sprint 14: Estabilidade de Webhooks"}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Meta: {currentSprint?.goal || "Garantir idempotência e re-tentativa com DLQ em todas as rotas do n8n"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 font-mono">Capacidade vs Pontos</div>
            <div className="text-xs font-bold font-mono text-zinc-200">
              {currentSprint?.completedPoints || 3} / {currentSprint?.committedPoints || 16} pts
            </div>
          </div>
          <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
            <RotateCcw className="h-3 w-3" />
            Encerrar Sprint
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] pb-2">
        <button
          onClick={() => setActiveTab("sprint")}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeTab === "sprint"
              ? "bg-zinc-800 text-white font-semibold shadow-xs border border-white/[0.08]"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Itens da Sprint ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab("burndown")}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "burndown"
              ? "bg-zinc-800 text-white font-semibold shadow-xs border border-white/[0.08]"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-amber-400" />
          Gráfico Burndown
        </button>
        <button
          onClick={() => setActiveTab("retro")}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeTab === "retro"
              ? "bg-zinc-800 text-white font-semibold shadow-xs border border-white/[0.08]"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Retrospectiva
        </button>
      </div>

      {/* Tab: Sprint Items */}
      {activeTab === "sprint" && (
        <div className="rounded-xl border border-white/[0.06] bg-[#0c0d10] overflow-hidden divide-y divide-white/[0.03]">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="h-10 px-4 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-zinc-500">
                  #MH-{task.id.replace("task-", "")}
                </span>
                <span className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                  {task.title}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 border border-white/[0.06] px-1.5 py-0.2 rounded">
                  {task.storyPoints ?? 0} pts
                </span>
                <span className="text-[10px] font-mono uppercase text-zinc-500">
                  {task.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Burndown Chart */}
      {activeTab === "burndown" && (
        <div className="rounded-xl border border-white/[0.06] bg-[#0c0d10] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-300 font-mono uppercase tracking-wider">
              Evolução da Sprint (Story Points Restantes)
            </h3>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 inline-block"></span>
                Ideal
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block"></span>
                Realizado
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" stroke="#52525b" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#52525b" fontSize={10} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111215",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ideal"
                  stroke="#71717a"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="atual"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#fbbf24" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab: Retrospective */}
      {activeTab === "retro" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-[#0c0d10] p-4 space-y-2.5">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              O que funcionou bem
            </h4>
            <div className="space-y-1.5 text-xs text-zinc-300">
              <div className="p-2.5 rounded-lg bg-[#111215] border border-white/[0.04]">
                Agente MedCopy acelerou 5x a entrega inicial dos anúncios.
              </div>
              <div className="p-2.5 rounded-lg bg-[#111215] border border-white/[0.04]">
                Comunicação com aprovação médica no board foi transparente.
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#0c0d10] p-4 space-y-2.5">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              O que pode melhorar
            </h4>
            <div className="space-y-1.5 text-xs text-zinc-300">
              <div className="p-2.5 rounded-lg bg-[#111215] border border-white/[0.04]">
                Webhooks externos do Stripe demoraram para homologar no n8n.
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#0c0d10] p-4 space-y-2.5">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold flex items-center justify-between">
              <span>Ações Práticas</span>
              <Plus className="h-3 w-3 cursor-pointer hover:text-white" />
            </h4>
            <div className="space-y-1.5 text-xs text-zinc-300">
              <div className="p-2.5 rounded-lg bg-[#111215] border border-white/[0.04]">
                Criar mock automático de webhook para testes locais.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
