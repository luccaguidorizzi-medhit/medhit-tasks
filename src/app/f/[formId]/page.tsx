"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicFormPage() {
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requester, setRequester] = useState("");
  const [priority, setPriority] = useState("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center space-y-4 shadow-xl">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Solicitação Enviada com Sucesso!</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sua solicitação foi registrada na esteira da MedHit e encaminhada automaticamente para o Triage Bot IA para classificação de esforço e priorização.
          </p>
          <Button onClick={() => setSubmitted(false)} variant="outline" size="sm" className="text-xs">
            Enviar Outra Solicitação
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-6 w-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              MH
            </div>
            <span className="text-xs font-semibold text-muted-foreground">MedHit Workflows</span>
          </div>
          <h1 className="text-lg font-bold text-foreground">Solicitação ao Time de Marketing & Automação</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Preencha os dados abaixo para abrir uma demanda prioritária na esteira de produção.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Seu Nome / Departamento *</label>
            <input
              type="text"
              required
              placeholder="Ex: Dra. Camila - Coordenação Médica"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-primary/50 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">O que você precisa? (Título) *</label>
            <input
              type="text"
              required
              placeholder="Ex: Novo criativo para workshop de emergência médica"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-primary/50 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Prioridade Sugerida</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-2 text-foreground outline-none"
            >
              <option value="low">Baixa (Pode aguardar sprint futura)</option>
              <option value="medium">Média (Rotina de entrega)</option>
              <option value="high">Alta (Impacto direto em campanha)</option>
              <option value="urgent">Urgente (Bloqueio crítico)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Detalhes e Orientações</label>
            <textarea
              rows={4}
              placeholder="Descreva o objetivo da solicitação, links ou referências..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-primary/50 resize-none text-xs"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-xs gap-2">
              <Send className="h-4 w-4" />
              Enviar Solicitação para a Esteira
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
