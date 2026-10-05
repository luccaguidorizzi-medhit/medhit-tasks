"use client";

import React, { useState } from "react";
import { useTasks } from "@/context/task-context";
import { Member } from "@/server/services/data-store";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Mail,
  Plus,
  Trash2,
  FolderKanban,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MembersAndAccessPage() {
  const {
    members,
    areas,
    updateMemberRole,
    inviteMember,
    setIsNewTeamModalOpen,
    deleteTeam,
  } = useTasks();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Member["role"]>("member");

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Preencha nome e e-mail");
      return;
    }
    inviteMember({
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
    });
    setInviteName("");
    setInviteEmail("");
    setIsInviteModalOpen(false);
  };

  const getRoleBadge = (role: Member["role"]) => {
    switch (role) {
      case "owner":
        return {
          label: "Proprietário (Owner)",
          className: "bg-amber-500/15 text-amber-500 border-amber-500/30",
          icon: ShieldAlert,
        };
      case "admin":
        return {
          label: "Administrador",
          className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
          icon: ShieldCheck,
        };
      case "member":
        return {
          label: "Membro",
          className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          icon: Shield,
        };
      case "guest":
        return {
          label: "Convidado (Guest)",
          className: "bg-slate-500/15 text-slate-400 border-slate-500/30",
          icon: UserCheck,
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto p-8 space-y-8 relative select-none">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-sky-500/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
              WORKSPACE MEDHIT
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestão de Usuários & Equipes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle de acessos simplificado, distribuição de squads e permissões por colaborador.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsNewTeamModalOpen(true)}
            variant="secondary"
            className="text-xs font-semibold gap-2 rounded-xl"
          >
            <Users className="h-4 w-4" />
            <span>+ Novo Time</span>
          </Button>

          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-2 shadow-lg shadow-sky-500/30 rounded-xl"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Convidar Membro</span>
          </Button>
        </div>
      </div>

      {/* Seção 1: Times & Squads Ativos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Times / Squads Cadastrados
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cada time possui seus próprios quadros e fluxos de trabalho
            </p>
          </div>
          <Button
            onClick={() => setIsNewTeamModalOpen(true)}
            variant="ghost"
            size="sm"
            className="text-xs text-sky-500 hover:text-sky-400 gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Criar Squad</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((team) => (
            <div
              key={team.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: team.color || "#38bdf8" }}
                    />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {team.name}
                    </h3>
                  </div>
                  {areas.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente remover o time "${team.name}"?`)) {
                          deleteTeam(team.id);
                        }
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Excluir time"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {team.description || "Squad operacional da MedHit."}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-mono">
                  <FolderKanban className="h-3.5 w-3.5 text-sky-400" />
                  <span>{team.projects.length} boards</span>
                </div>
                <span className="text-[11px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full font-semibold">
                  Ativo
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção 2: Membros e Papéis */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Colaboradores do Workspace ({members.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Defina o nível de permissão de cada membro da equipe
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="py-3 px-4 font-semibold">Colaborador</th>
                  <th className="py-3 px-4 font-semibold">E-mail</th>
                  <th className="py-3 px-4 font-semibold">Papel / Nível de Acesso</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {members.map((member) => {
                  const roleBadge = getRoleBadge(member.role);
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 object-cover"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {member.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {member.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {member.email}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              updateMemberRole(member.id, e.target.value as Member["role"])
                            }
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold bg-transparent outline-none cursor-pointer ${roleBadge.className}`}
                          >
                            <option value="owner" className="bg-slate-900 text-white">Owner (Acesso Total)</option>
                            <option value="admin" className="bg-slate-900 text-white">Admin (Cria/Edita Times)</option>
                            <option value="member" className="bg-slate-900 text-white">Membro (Colaborador)</option>
                            <option value="guest" className="bg-slate-900 text-white">Convidado (Restrito)</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 font-mono">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                          Ativo
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="text-[11px] text-slate-400 font-mono">Autorizado</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Convidar Membro */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#081226] border border-slate-200 dark:border-sky-500/25 rounded-2xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 px-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Convidar Novo Colaborador</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Adicione um membro ao MedHit Workspace</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nome Completo *
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ex: Carlos Eduardo"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  E-mail Corporativo *
                </label>
                <input
                  type="email"
                  placeholder="carlos@medhit.com.br"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Papel de Acesso
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Member["role"])}
                  className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="member">Membro (Pode criar e movimentar tarefas)</option>
                  <option value="admin">Administrador (Pode gerenciar times e projetos)</option>
                  <option value="guest">Convidado (Acesso restrito apenas a tarefas alocadas)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-white/10">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20"
                >
                  Enviar Convite
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
