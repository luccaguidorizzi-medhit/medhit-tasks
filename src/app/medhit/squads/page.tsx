"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTasks } from "@/context/task-context";
import { Member } from "@/server/services/data-store";
import {
  Layers,
  Users,
  UserPlus,
  Plus,
  Trash2,
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Shield,
  UserCheck,
  LayoutDashboard,
  Sparkles,
  Kanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EducationalTooltip } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Gestão de Squads e Times - MedHit Tasks
 * Desenvolvido pela equipe MedHit Integrações & Automações
 */
export default function SquadsManagementPage() {
  const {
    areas,
    tasks,
    members,
    hasPermission,
    setIsNewTeamModalOpen,
    setIsNewBoardModalOpen,
    deleteTeam,
    updateMemberRole,
    inviteMember,
  } = useTasks();

  const canCreateTeam = hasPermission("create_team");
  const canCreateBoard = hasPermission("create_board");
  const canDeleteTeam = hasPermission("delete_team");
  const canManageMembers = hasPermission("manage_members");
  const canChangeRole = hasPermission("change_member_role");

  const [activeTab, setActiveTab] = useState<"squads" | "members">("squads");
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

  const totalBoards = areas.reduce((acc, a) => acc + a.projects.length, 0);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => {
    return t.checklists.every((c) => c.items.every((i) => i.isCompleted));
  }).length;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto p-6 md:p-8 space-y-6 relative select-none">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Header com Metadados & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-sky-500/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-500 border border-sky-500/30">
              WORKSPACE MEDHIT
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-sky-400" />
            <span>Gestão de Equipes & Áreas</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organização departamental, esteiras de entrega contínua e distribuição de membros entre projetos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {canCreateTeam && (
            <EducationalTooltip
              title="Cadastrar Nova Equipe"
              description="Crie uma nova equipe ou área de trabalho com seus próprios projetos e fluxos."
            >
              <Button
                onClick={() => setIsNewTeamModalOpen(true)}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-1.5 shadow-lg shadow-sky-500/25 rounded-xl cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Nova Equipe</span>
              </Button>
            </EducationalTooltip>
          )}

          {canCreateBoard && (
            <EducationalTooltip
              title="Criar Novo Board"
              description="Adicione um novo quadro de projeto vinculado à squad de sua escolha."
            >
              <Button
                onClick={() => setIsNewBoardModalOpen(true)}
                variant="outline"
                className="text-xs font-semibold gap-1.5 rounded-xl border-slate-200 dark:border-sky-500/20 cursor-pointer"
              >
                <FolderKanban className="h-4 w-4 text-sky-400" />
                <span>+ Novo Board</span>
              </Button>
            </EducationalTooltip>
          )}

          {canManageMembers && (
            <EducationalTooltip
              title="Convidar Colaborador"
              description="Adicione um novo especialista ou gestor para colaborar no workspace."
            >
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                variant="secondary"
                className="text-xs font-semibold gap-1.5 rounded-xl cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Convidar Membro</span>
              </Button>
            </EducationalTooltip>
          )}
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/70 dark:bg-[#0c1830]/70 backdrop-blur-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Equipes Ativas</span>
            <Layers className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {areas.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Áreas operando
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/70 dark:bg-[#0c1830]/70 backdrop-blur-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Projetos Totais</span>
            <FolderKanban className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalBoards}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Projetos ativos
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/70 dark:bg-[#0c1830]/70 backdrop-blur-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Colaboradores</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {members.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Especialistas alocados
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/70 dark:bg-[#0c1830]/70 backdrop-blur-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Demandas Gerenciadas</span>
            <CheckCircle2 className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalTasks}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Itens no pipeline
          </div>
        </div>
      </div>

      {/* Seletor de Abas Estilo Linear/ClickUp */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-sky-500/15 pb-2">
        <button
          onClick={() => setActiveTab("squads")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeTab === "squads"
              ? "bg-sky-500/15 text-sky-500 dark:text-sky-300 border border-sky-500/30 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
          )}
        >
          <Layers className="h-4 w-4" />
          <span>Equipes & Áreas ({areas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            activeTab === "members"
              ? "bg-sky-500/15 text-sky-500 dark:text-sky-300 border border-sky-500/30 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
          )}
        >
          <Users className="h-4 w-4" />
          <span>Membros & Permissões ({members.length})</span>
        </button>
      </div>

      {/* Conteúdo da Aba 1: Squads & Times */}
      {activeTab === "squads" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Squads Operacionais Ativas
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Arquitetura MedHit Tasks
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {areas.map((team) => {
              const teamTasks = tasks.filter((t) => t.areaId === team.id);
              const teamCompleted = teamTasks.filter((t) => {
                // Checa se todos os checklists estão concluídos ou status é categoria done
                return t.checklists.length > 0 && t.checklists.every((c) => c.items.every((i) => i.isCompleted));
              }).length;
              const progressPct = teamTasks.length > 0 ? Math.round((teamCompleted / teamTasks.length) * 100) : 0;

              return (
                <div
                  key={team.id}
                  className="p-6 rounded-2xl border border-slate-200 dark:border-sky-500/20 bg-white/80 dark:bg-[#0c1830]/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20 flex flex-col justify-between space-y-5 transition-all hover:border-sky-500/40"
                >
                  {/* Cabeçalho da Squad */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                          style={{ backgroundColor: team.color || "#38bdf8" }}
                        >
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {team.name}
                            </h3>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              /{team.slug}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {team.description || "Squad dedicada da operação MedHit."}
                          </p>
                        </div>
                      </div>

                      {canDeleteTeam && areas.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente remover a squad "${team.name}"?`)) {
                              deleteTeam(team.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Excluir Squad"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Barra de Progresso de Entregas */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          Eficiência de Entregas
                        </span>
                        <span className="font-mono font-bold text-sky-500 dark:text-sky-400">
                          {progressPct}% ({teamCompleted}/{teamTasks.length} tarefas)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Boards Vinculados */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-between">
                      <span>Boards & Projetos ({team.projects.length})</span>
                      {canCreateBoard && (
                        <button
                          onClick={() => setIsNewBoardModalOpen(true)}
                          className="text-sky-400 hover:text-sky-300 font-semibold normal-case flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Novo Board</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {team.projects.map((proj) => (
                        <Link
                          key={proj.id}
                          href={`/medhit/${team.slug}/${proj.slug}/board`}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-950/40 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: proj.color || "#38bdf8" }}
                            />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-400 truncate">
                              {proj.name}
                            </span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Rodapé: Membros da Squad e Acesso Rápido */}
                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-1.5">
                        {members.slice(0, 3).map((m) => (
                          <img
                            key={m.id}
                            src={m.avatarUrl}
                            alt={m.name}
                            title={m.name}
                            className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-950 object-cover"
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {members.length} membros alocados
                      </span>
                    </div>

                    <Link
                      href={`/medhit/${team.slug}`}
                      className="text-xs font-bold text-sky-500 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>Abrir Painel</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 2: Membros & Permissões */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Colaboradores do Workspace ({members.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alterne os níveis de acesso de cada membro entre Owner, Admin, Membro e Convidado.
              </p>
            </div>

            {canManageMembers && (
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-1.5 rounded-xl cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ Convidar Membro</span>
              </Button>
            )}
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
                    <th className="py-3 px-4 font-semibold text-right">Permissão</th>
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
                          <select
                            value={member.role}
                            disabled={!canChangeRole}
                            onChange={(e) =>
                              updateMemberRole(member.id, e.target.value as Member["role"])
                            }
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold bg-transparent outline-none ${
                              canChangeRole ? "cursor-pointer" : "opacity-80 cursor-not-allowed"
                            } ${roleBadge.className}`}
                          >
                            <option value="owner" className="bg-slate-900 text-white">Owner (Acesso Total)</option>
                            <option value="admin" className="bg-slate-900 text-white">Admin (Cria/Edita Squads)</option>
                            <option value="member" className="bg-slate-900 text-white">Membro (Colaborador)</option>
                            <option value="guest" className="bg-slate-900 text-white">Convidado (Restrito)</option>
                          </select>
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
      )}

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
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Convidar Novo Especialista</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Alocação direta nas squads da MedHit</p>
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
                  <option value="admin">Administrador (Pode gerenciar squads e quadros)</option>
                  <option value="guest">Convidado (Acesso restrito apenas a demandas vinculadas)</option>
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
