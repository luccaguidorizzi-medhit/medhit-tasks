"use client";

import React, { useState } from "react";
import { Approval } from "@/server/services/data-store";
import {
  ShieldCheck,
  Check,
  X,
  Bot,
  AlertTriangle,
  Code,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTasks } from "@/context/task-context";

interface ApprovalsPanelProps {
  approvals: Approval[];
  onReview: (approvalId: string, decision: "approved" | "rejected", comment?: string) => void;
}

export function ApprovalsPanel({ approvals, onReview }: ApprovalsPanelProps) {
  const { hasPermission } = useTasks();
  const canApprove = hasPermission("review_approvals");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const reviewedApprovals = approvals.filter((a) => a.status !== "pending");

  const handleDecision = (id: string, decision: "approved" | "rejected") => {
    if (!canApprove) {
      toast.error("Permissão insuficiente para homologar solicitações de IA.");
      return;
    }
    const comment = commentInputs[id];
    onReview(id, decision, comment);
    toast.success(decision === "approved" ? "Solicitação APROVADA" : "Solicitação REJEITADA");
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12 select-none">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-400" />
          <span>Central de Governança & Aprovações</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/[0.08]">
            Human-in-the-Loop
          </span>
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Ações de segurança e operações de alto impacto solicitadas por agentes autônomos que requerem aprovação humana.
        </p>
      </div>

      {/* Solicitações Pendentes */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <span>Aguardando Decisão Humana</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {pendingApprovals.length}
          </span>
        </h2>

        <div className="space-y-3">
          {pendingApprovals.map((appr) => (
            <div
              key={appr.id}
              className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-4.5 space-y-3.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 rounded-md bg-zinc-800 text-zinc-300 border border-white/[0.06]">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-200">{appr.agentName}</h3>
                    <p className="text-[11px] text-zinc-500 font-mono">Tarefa: {appr.taskTitle}</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(appr.requestedAt).toLocaleTimeString("pt-BR")}
                </span>
              </div>

              {/* Ação Solicitada */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.05] space-y-1">
                <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Ação Crítica Requisitada:</span>
                </div>
                <p className="text-xs text-zinc-300 leading-snug">{appr.requestedAction}</p>
              </div>

              {/* Payload Técnico */}
              {appr.payload && Object.keys(appr.payload).length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                    <Code className="h-3 w-3" />
                    Payload Técnico
                  </span>
                  <pre className="p-3 rounded-lg bg-[#07080a] text-[11px] font-mono text-zinc-300 overflow-x-auto border border-white/[0.05]">
                    {JSON.stringify(appr.payload, null, 2)}
                  </pre>
                </div>
              )}

              {/* Input de Justificativa e Botões de Decisão */}
              <div className="pt-2 border-t border-white/[0.05] flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <input
                  type="text"
                  placeholder="Instruções ou observações (opcional)..."
                  value={commentInputs[appr.id] || ""}
                  onChange={(e) =>
                    setCommentInputs((prev) => ({ ...prev, [appr.id]: e.target.value }))
                  }
                  className="w-full sm:flex-1 bg-[#111215] border border-white/[0.06] rounded-md px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-white/20"
                />

                <div className="flex items-center gap-2 shrink-0">
                  {canApprove ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDecision(appr.id, "rejected")}
                        className="gap-1 text-xs text-rose-400 hover:bg-rose-500/10 border-rose-500/20"
                      >
                        <X className="h-3 w-3" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDecision(appr.id, "approved")}
                        className="gap-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <Check className="h-3 w-3" />
                        Aprovar Execução
                      </Button>
                    </>
                  ) : (
                    <span className="text-[11px] font-mono text-zinc-500 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                      Homologação restrita a administradores
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {pendingApprovals.length === 0 && (
            <div className="p-8 text-center border border-dashed border-white/[0.06] rounded-xl text-xs text-zinc-600 font-mono">
              Nenhuma solicitação pendente no momento.
            </div>
          )}
        </div>
      </div>

      {/* Histórico Recente */}
      {reviewedApprovals.length > 0 && (
        <div className="space-y-2.5 pt-4 border-t border-white/[0.06]">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Histórico Recente</h2>
          <div className="space-y-1.5">
            {reviewedApprovals.map((appr) => (
              <div
                key={appr.id}
                className="p-3 rounded-lg border border-white/[0.04] bg-[#0c0d10] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-medium text-zinc-300">{appr.taskTitle}</span>
                  <p className="text-[11px] text-zinc-500">{appr.requestedAction}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold ${
                      appr.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {appr.status}
                  </span>
                  <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                    por {appr.reviewedBy}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
