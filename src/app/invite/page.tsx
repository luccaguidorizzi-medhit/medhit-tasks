/**
 * MedHit Integrações & Automações
 * Tela de Aceite de Convite e Criação/Definição de Senha de Colaborador
 *
 * Apenas acessível por colaboradores convidados (com email ou token nos parâmetros)
 */

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTasks } from "@/context/task-context";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Check, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { members, updateMemberPassword, login } = useTasks();

  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetMember, setTargetMember] = useState<any>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  useEffect(() => {
    if (email) {
      const found = members.find((m) => m.email.toLowerCase() === email.toLowerCase().trim());
      setTargetMember(found || null);
    }
  }, [email, members]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPass = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass || cleanPass.length < 6) {
      setErrorMessage("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMessage("As senhas informadas não coincidem.");
      return;
    }

    // Procura o membro convidado
    const member = targetMember || members.find((m) => m.email.toLowerCase() === email.toLowerCase().trim());

    if (!member) {
      setErrorMessage("Nenhum convite pendente encontrado para este e-mail. Solicite um novo convite ao administrador.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Atualiza a senha no contexto e store
      updateMemberPassword(member.id, cleanPass);

      // Realiza login automático
      login(member.email, cleanPass, true);

      toast.success("Senha cadastrada com sucesso! Bem-vindo ao time MedHit.");
      router.replace("/");
    } catch {
      setErrorMessage("Erro ao salvar senha. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#050a14] text-white p-4 relative overflow-hidden select-none">
      {/* Background Decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950/30 via-[#050a14] to-[#03060c] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <div className="rounded-2xl border border-white/10 bg-[#081226]/90 p-8 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 p-0.5 shadow-lg shadow-sky-500/20 mb-3">
              <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-sky-400" />
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              Ativar Seu Acesso
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Defina sua senha pessoal para acessar seus quadros e demandas no MedHit Tasks.
            </p>
          </div>

          {/* Banner de Erro */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-200 leading-relaxed">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail (somente leitura se já veio no link) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">E-mail Convidado</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={Boolean(emailParam)}
                  placeholder="seu.email@medhit.com.br"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-sky-500 transition-colors disabled:opacity-60"
                  required
                />
              </div>
            </div>

            {/* Nova Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-10 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-sky-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-sky-500 transition-colors"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 mt-2 gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Salvando credenciais...</span>
              ) : (
                <>
                  <span>Criar Senha e Acessar Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Rodapé Seguro */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Acesso criptografado e restrito por convite</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050a14] flex items-center justify-center text-white text-xs">Carregando convite...</div>}>
      <InviteContent />
    </Suspense>
  );
}
