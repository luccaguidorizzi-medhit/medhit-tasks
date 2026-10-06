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
  Plus,
  Trash2,
  FolderKanban,
  Check,
  Key,
  Copy,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function MembersManagement() {
  const {
    members,
    areas,
    currentUser,
    updateMemberRole,
    updateMemberPassword,
    regenerateMemberMcpToken,
    inviteMember,
    setIsNewTeamModalOpen,
    deleteTeam,
  } = useTasks();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<Member["role"]>("member");

  // Estado para edição rápida de senha / token
  const [selectedMemberForSecurity, setSelectedMemberForSecurity] = useState<Member | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Preencha nome e e-mail");
      return;
    }
    inviteMember({
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      initialPassword: invitePassword.trim() || undefined,
    });
    setInviteName("");
    setInviteEmail("");
    setInvitePassword("");
    setIsInviteModalOpen(false);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForSecurity || !newPasswordInput.trim()) {
      toast.error("Digite uma nova senha válida");
      return;
    }
    updateMemberPassword(selectedMemberForSecurity.id, newPasswordInput.trim());
    setSelectedMemberForSecurity(null);
    setNewPasswordInput("");
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
    <div className="space-y-6">
      {/* Header interno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-400" />
            <span>Gestão de Usuários & Equipes</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Controle de acessos, senhas individuais e tokens MCP por usuário.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsNewTeamModalOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs font-semibold gap-1.5 rounded-lg border-slate-300 dark:border-white/10"
          >
            <Users className="h-3.5 w-3.5" />
            <span>+ Novo Time</span>
          </Button>

          <Button
            onClick={() => setIsInviteModalOpen(true)}
            size="sm"
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md shadow-sky-500/20 rounded-lg"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>+ Convidar</span>
          </Button>
        </div>
      </div>

      {/* Card do Usuário Master */}
      <div className="p-4 rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="h-10 w-10 rounded-xl border border-sky-400/40 object-cover bg-sky-950"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                MASTER OWNER
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {currentUser.email} • Senha: <span className="text-emerald-400 font-semibold">{currentUser.password || "x32kd58"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-950/70 border border-white/10 rounded-lg px-2.5 py-1 text-left">
            <div className="text-[9px] uppercase font-mono text-slate-400">Token MCP</div>
            <div className="text-xs font-mono text-sky-300 truncate max-w-[150px]">
              {currentUser.mcpToken || "medtask_user_lucca_x32kd58_sec99"}
            </div>
          </div>
          <button
            onClick={() => handleCopy(currentUser.mcpToken || "medtask_user_lucca_x32kd58_sec99", "me-modal")}
            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 transition-colors"
            title="Copiar Token MCP"
          >
            {copiedToken === "me-modal" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Lista de Membros */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/70 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-white/10">
            <tr>
              <th className="py-2.5 px-3 font-semibold">Membro</th>
              <th className="py-2.5 px-3 font-semibold">Papel</th>
              <th className="py-2.5 px-3 font-semibold">Senha</th>
              <th className="py-2.5 px-3 font-semibold">Token MCP</th>
              <th className="py-2.5 px-3 font-semibold text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {members.map((member) => {
              const roleBadge = getRoleBadge(member.role);
              const isPassVisible = !!showPasswordMap[member.id];
              return (
                <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="h-6 w-6 rounded-full border border-white/10 object-cover"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                          <span>{member.name}</span>
                          {member.id === currentUser.id && (
                            <span className="text-[9px] font-mono px-1 rounded bg-sky-500/20 text-sky-400">
                              VOCÊ
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{member.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <select
                      value={member.role}
                      onChange={(e) => updateMemberRole(member.id, e.target.value as Member["role"])}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold bg-transparent border outline-none cursor-pointer ${roleBadge.className}`}
                    >
                      <option value="owner" className="bg-slate-900 text-white">Owner</option>
                      <option value="admin" className="bg-slate-900 text-white">Admin</option>
                      <option value="member" className="bg-slate-900 text-white">Membro</option>
                      <option value="guest" className="bg-slate-900 text-white">Convidado</option>
                    </select>
                  </td>

                  <td className="py-2.5 px-3 font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-700 dark:text-slate-300">
                        {isPassVisible ? member.password || "x32kd58" : "••••••••"}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(member.id)}
                        className="p-0.5 text-slate-400 hover:text-slate-200"
                      >
                        {isPassVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 font-mono">
                    <div className="flex items-center gap-1 max-w-[140px]">
                      <span className="truncate text-[10px] text-slate-400 bg-black/30 px-1.5 py-0.5 rounded">
                        {member.mcpToken || "token-ativo"}
                      </span>
                      <button
                        onClick={() => handleCopy(member.mcpToken || "", member.id)}
                        className="p-0.5 text-slate-400 hover:text-sky-400"
                        title="Copiar token"
                      >
                        {copiedToken === member.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => regenerateMemberMcpToken(member.id)}
                        className="p-0.5 text-slate-400 hover:text-amber-400"
                        title="Regenerar token"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedMemberForSecurity(member);
                        setNewPasswordInput("");
                      }}
                      className="h-6 px-1.5 text-[10px] text-sky-400 hover:bg-sky-500/10 gap-1 rounded"
                    >
                      <Lock className="h-3 w-3" />
                      <span>Senha</span>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Convidar */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#081226] border border-slate-200 dark:border-sky-500/25 rounded-2xl text-slate-900 dark:text-slate-100 shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-sky-400" />
              <span>Convidar Membro</span>
            </h3>

            <form onSubmit={handleSendInvite} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Nome *</label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">E-mail *</label>
                <input
                  type="email"
                  placeholder="usuario@medhit.com.br"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Senha Provisória</label>
                <input
                  type="text"
                  placeholder="Ex: medhit2026@"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs font-mono outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Papel</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Member["role"])}
                  className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs outline-none"
                >
                  <option value="member">Membro (Padrão)</option>
                  <option value="admin">Administrador</option>
                  <option value="guest">Convidado</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsInviteModalOpen(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs">
                  Enviar Convite
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Alterar Senha */}
      {selectedMemberForSecurity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#081226] border border-slate-200 dark:border-sky-500/25 rounded-2xl text-slate-900 dark:text-slate-100 shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-sky-400" />
              <span>Alterar Senha de {selectedMemberForSecurity.name}</span>
            </h3>

            <form onSubmit={handleSavePassword} className="space-y-3">
              <input
                autoFocus
                type="text"
                placeholder="Nova senha"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs font-mono outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedMemberForSecurity(null)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs">
                  Salvar Senha
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
