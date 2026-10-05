"use client";

import React, { useState } from "react";
import {
  Workflow,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  Bot,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AutomationsPage() {
  const [activeRules, setActiveRules] = useState([
    {
      id: "rule-1",
      name: "Em Revisão Criativa → Atribuir ao MedCopy IA",
      trigger: "Quando o status mudar para 'Revisão Criativa'",
      condition: "Se o projeto for da área de Marketing",
      action: "Disparar execução do agente MedCopy IA para revisão",
      isActive: true,
      executionsCount: 42,
    },
    {
      id: "rule-2",
      name: "Demanda Crítica n8n → Alerta Imediato e DLQ",
      trigger: "Quando uma tarefa for marcada como Urgente",
      condition: "Se o tipo for 'agent_task' e projeto 'Esteira n8n'",
      action: "Solicitar aprovação humana de segurança e notificar Lucca Lagana",
      isActive: true,
      executionsCount: 18,
    },
    {
      id: "rule-3",
      name: "Formulário de Solicitação → Triagem por IA",
      trigger: "Quando um novo formulário público for submetido",
      condition: "Se não houver responsável definido",
      action: "Atribuir ao Triage Bot IA para classificação de esforço",
      isActive: true,
      executionsCount: 89,
    },
  ]);

  const toggleRule = (id: string) => {
    setActiveRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
    toast.success("Status da automação atualizado");
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="space-y-6 max-w-5xl pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Workflow className="h-6 w-6 text-blue-500" />
            <span>Motor de Automações Visuais</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Crie fluxos inteligentes no formato "Quando → Se → Então" para disparar agentes de IA e gerenciar tarefas.
          </p>
        </div>

        <Button
          onClick={() => toast.info("Builder visual de automações acionado")}
          className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova Automação
        </Button>
      </div>

      {/* Lista de Automações Ativas */}
      <div className="space-y-3">
        {activeRules.map((rule) => (
          <div
            key={rule.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Zap className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{rule.name}</h3>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {rule.executionsCount} execuções registradas com sucesso
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`text-xs px-2.5 py-1 rounded-full font-mono transition-colors border ${
                    rule.isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {rule.isActive ? "Ativa" : "Pausada"}
                </button>
              </div>
            </div>

            {/* Pipeline Visual: Quando -> Se -> Então */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">
                  1. Quando (Gatilho)
                </span>
                <p className="text-foreground/90 font-medium">{rule.trigger}</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                  2. Se (Condição)
                </span>
                <p className="text-foreground/90 font-medium">{rule.condition}</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1">
                  3. Então (Ação IA)
                </span>
                <p className="text-foreground/90 font-medium">{rule.action}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
}
