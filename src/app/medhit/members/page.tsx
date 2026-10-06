"use client";

import React from "react";
import Link from "next/link";
import { useTasks } from "@/context/task-context";
import { MembersManagement } from "@/components/settings/members-management";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MembersPage() {
  const { currentUser } = useTasks();

  if (currentUser.role === "guest") {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white dark:bg-[#081226] border border-rose-500/20 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Acesso Restrito</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Seu perfil de <strong>Convidado (Guest)</strong> não possui permissão para visualizar os membros, senhas ou configurações da equipe.
          </p>
          <Link href="/medhit">
            <Button size="sm" className="mt-2 text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold gap-1.5 rounded-xl">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar para o Início</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
      <MembersManagement />
    </div>
  );
}

