"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/context/task-context";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, hasHydrated } = useTasks();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redireciona se o usuário já estiver com sessão autenticada ativa
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace("/");
    }
  }, [hasHydrated, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMessage("Por favor, informe seu e-mail institucional.");
      return;
    }
    if (!cleanPassword) {
      setErrorMessage("Por favor, informe sua senha de acesso.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simula leve latência para segurança e feedback tátil
      await new Promise((resolve) => setTimeout(resolve, 200));

      const result = login(cleanEmail, cleanPassword, remember);
      if (result.success) {
        router.replace("/");
      } else {
        setErrorMessage(result.error || "Credenciais inválidas. Verifique seu e-mail e senha.");
      }
    } catch {
      setErrorMessage("Ocorreu um erro ao validar seu acesso. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#050a14] text-white p-4 relative overflow-hidden select-none">
      {/* Background Decorativo Sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950/30 via-[#050a14] to-[#03060c] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Sutil */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      <div className="relative w-full max-w-md z-10">
        {/* Card de Login */}
        <div className="rounded-2xl border border-white/10 bg-[#081226]/85 p-8 shadow-2xl backdrop-blur-2xl">
          {/* Header da Marca MedHit */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 p-0.5 shadow-lg shadow-sky-500/20 mb-3">
              <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-sky-400" />
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              MedHit <span className="text-sky-400">Tasks</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Ambiente Corporativo de Gestão de Projetos, Automações & Agentes
            </p>
          </div>

          {/* Banner de Erro */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200 leading-relaxed font-medium">
                {errorMessage}
              </div>
            </div>
          )}

          {/* Formulário Estritamente Padrão de Produção */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="login-email">
                E-mail Institucional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@medhit.com.br"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="login-password">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/40 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                  title={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-sky-500 focus:ring-sky-500/40"
                />
                <span>Lembrar meu acesso</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Acesso restrito MedHit
              </span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  <span>Entrar na Plataforma</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Rodapé de Segurança */}
          <div className="mt-8 pt-5 border-t border-white/5 text-center flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/80" />
            <span>Autenticação Criptografada • MedHit Integrações & Automações</span>
          </div>
        </div>
      </div>
    </div>
  );
}
