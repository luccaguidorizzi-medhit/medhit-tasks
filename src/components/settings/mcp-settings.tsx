"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal, Key, UserCheck, ShieldCheck, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/context/task-context";
import { toast } from "sonner";

export function McpSettings() {
  const { currentUser, regenerateMemberMcpToken } = useTasks();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const endpointUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/mcp`
    : "https://medhit-tasks.vercel.app/api/mcp";

  const userMcpToken = currentUser?.mcpToken || "medtask_user_lucca_x32kd58_sec99";

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const antigravityConfig = JSON.stringify(
    {
      mcpServers: {
        "medhit-tasks": {
          type: "http",
          url: endpointUrl,
          serverUrl: endpointUrl,
          headers: {
            Authorization: `Bearer ${userMcpToken}`,
          },
        },
      },
    },
    null,
    2
  );

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        "medhit-tasks": {
          url: endpointUrl,
          headers: {
            Authorization: `Bearer ${userMcpToken}`,
          },
        },
      },
    },
    null,
    2
  );

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        "medhit-tasks": {
          command: "npx",
          args: ["-y", "mcp-proxy", endpointUrl],
          env: {
            MCP_AUTHORIZATION: `Bearer ${userMcpToken}`,
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div className="space-y-6 max-w-4xl pb-12 select-none">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Terminal className="h-5 w-5 text-sky-400" />
          <span>Configuração MCP por Usuário</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
            Autenticado: {currentUser.name}
          </span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Cada usuário possui um token MCP individual exclusivo. Conecte o Google Antigravity, Cursor IDE, Claude Desktop ou n8n diretamente à sua conta.
        </p>
      </div>

      {/* Card do Usuário Autenticado */}
      <div className="rounded-2xl border border-sky-500/20 bg-[#081226]/90 p-5 space-y-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="h-10 w-10 rounded-xl border border-sky-400/40 object-cover bg-sky-950"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{currentUser.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
                  {currentUser.role.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              CONECTADO AO ANTIGRAVITY
            </span>
          </div>
        </div>

        {/* Chave de API Individual */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-sky-300 font-mono flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-sky-400" />
              <span>Seu Token MCP Individual</span>
            </label>
            <button
              onClick={() => regenerateMemberMcpToken(currentUser.id)}
              className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Regenerar Chave</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={userMcpToken}
              className="flex-1 bg-[#0c1830] border border-sky-500/30 rounded-xl px-3.5 py-2 text-xs font-mono text-sky-300 outline-none"
            />
            <Button
              size="sm"
              onClick={() => copyToClipboard(userMcpToken, "token")}
              className="gap-1.5 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl"
            >
              {copiedKey === "token" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copiar Token
            </Button>
          </div>
        </div>
      </div>

      {/* Card do Endpoint */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-4.5 space-y-3 shadow-xs">
        <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
          Endpoint MCP Streamable HTTP (MedHit)
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={endpointUrl}
            className="flex-1 bg-[#111215] border border-white/[0.08] rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 outline-none"
          />
          <Button
            size="sm"
            onClick={() => copyToClipboard(endpointUrl, "endpoint")}
            className="gap-1.5 text-xs font-semibold"
          >
            {copiedKey === "endpoint" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copiar URL
          </Button>
        </div>
      </div>

      {/* Snippets de Conexão Rápida */}
      <div className="space-y-3.5">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          Snippets de Conexão (Já Pré-configurados com seu usuário)
        </h2>

        {/* Google Antigravity */}
        <div className="rounded-xl border border-sky-500/30 bg-[#081226]/80 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-300 font-mono flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>Google Antigravity (~/.gemini/config/mcp_config.json)</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(antigravityConfig, "antigravity")}
              className="h-6 text-xs gap-1 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
            >
              {copiedKey === "antigravity" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              Copiar
            </Button>
          </div>
          <pre className="p-3 rounded-lg bg-[#040813] border border-white/5 text-[11px] font-mono text-sky-200/90 overflow-x-auto">
            {antigravityConfig}
          </pre>
        </div>

        {/* Cursor IDE */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0c0d10] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 font-mono">
              Cursor IDE (~/.cursor/mcp.json)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(cursorConfig, "cursor")}
              className="h-6 text-xs gap-1"
            >
              {copiedKey === "cursor" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              Copiar
            </Button>
          </div>
          <pre className="p-3 rounded-lg bg-[#07080a] text-[11px] font-mono text-zinc-400 overflow-x-auto">
            {cursorConfig}
          </pre>
        </div>

        {/* Claude Desktop */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0c0d10] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 font-mono">
              Claude Desktop (claude_desktop_config.json)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(claudeDesktopConfig, "claude")}
              className="h-6 text-xs gap-1"
            >
              {copiedKey === "claude" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              Copiar
            </Button>
          </div>
          <pre className="p-3 rounded-lg bg-[#07080a] text-[11px] font-mono text-zinc-400 overflow-x-auto">
            {claudeDesktopConfig}
          </pre>
        </div>
      </div>
    </div>
  );
}
