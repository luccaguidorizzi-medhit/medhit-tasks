/**
 * MedHit Integrações & Automações
 * Global Error Boundary para o MedHit Tasks.
 * 
 * Captura e recupera exceções não tratadas do cliente com telemetria
 * integrada, registro de pilha e botões de recuperação limpa.
 * Assinado por: MedHit Integrações & Automações
 */

"use client";

import React, { useEffect, useState } from "react";
import { telemetry } from "@/lib/telemetry";
import { Button } from "@/components/ui/button";
import {
  AlertOctagon,
  RefreshCw,
  Home,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Terminal,
  Check,
  Copy,
} from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MedhitGlobalError({ error, reset }: GlobalErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Registra automaticamente a exceção na telemetria MedHit
    telemetry.logError(error, {
      source: "medhit_global_error_boundary",
      payload: {
        digest: error.digest,
        time: new Date().toISOString(),
      },
    });
  }, [error]);

  const handleCopyError = () => {
    const errorReport = JSON.stringify(
      {
        message: error.message,
        name: error.name,
        digest: error.digest,
        stack: error.stack,
        url: typeof window !== "undefined" ? window.location.href : "unknown",
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
    navigator.clipboard.writeText(errorReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHardReset = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/medhit";
    }
  };

  return (
    <div className="flex-1 min-h-screen w-full flex items-center justify-center p-6 bg-slate-950 text-slate-100 relative overflow-hidden select-none">
      {/* Luz ambiente de emergência suave */}
      <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-rose-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="max-w-xl w-full bg-[#081226]/90 border border-rose-500/30 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho de Confiabilidade */}
        <div className="flex items-center justify-between border-b border-rose-500/20 pb-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>MedHit • Error Boundary Ativo</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {error.digest ? `Digest: ${error.digest}` : "Client Intercept"}
          </span>
        </div>

        {/* Ícone e Mensagem Principal */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500 shrink-0 shadow-lg shadow-rose-500/20">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Instabilidade de Renderização Contida
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ocorreu uma falha inesperada na visualização da página. O mecanismo de confiabilidade da MedHit capturou o incidente para impedir o travamento da sessão.
            </p>
          </div>
        </div>

        {/* Detalhes Técnicos Expansíveis */}
        <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-sky-400" />
              <span>Ver Detalhes do Erro e Stack Trace</span>
            </div>
            {showDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showDetails && (
            <div className="p-4 border-t border-white/10 space-y-3 bg-black/60 font-mono text-[11px]">
              <div className="text-rose-400 font-semibold break-words">
                {error.name}: {error.message}
              </div>
              {error.stack && (
                <pre className="text-[10px] text-slate-400 overflow-x-auto max-h-48 p-2 rounded bg-slate-950/70 border border-white/5 whitespace-pre-wrap leading-relaxed">
                  {error.stack}
                </pre>
              )}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleCopyError}
                  className="flex items-center gap-1.5 text-[10px] text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado para transferência!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copiar Diagnóstico</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ações de Recuperação */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            onClick={handleHardReset}
            variant="outline"
            className="w-full sm:w-auto gap-2 text-xs rounded-xl border-slate-700 hover:bg-white/5 text-slate-300 cursor-pointer"
          >
            <Home className="h-4 w-4 text-slate-400" />
            <span>Retornar ao Início</span>
          </Button>

          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto gap-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/25 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Tentar Novamente (Limpar Estado)</span>
          </Button>
        </div>

        {/* Assinatura MedHit */}
        <div className="text-center pt-2">
          <span className="text-[10px] font-mono text-slate-500">
            Medhit WorkTrack by Integrações & Automações
          </span>
        </div>
      </div>
    </div>
  );
}
