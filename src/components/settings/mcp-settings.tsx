"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function McpSettings() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const endpointUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/mcp`
    : "http://localhost:3000/api/mcp";

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        "medhit-tasks": {
          url: endpointUrl,
          headers: {
            Authorization: "Bearer medtask_live_9a7f3c21_sec82910",
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
          <Terminal className="h-5 w-5 text-zinc-400" />
          <span>Configuração & Servidor MCP</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/[0.08]">
            Streamable HTTP
          </span>
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Conecte ferramentas de IA (Cursor IDE, Claude Desktop, Antigravity, n8n) diretamente à esteira de tarefas da MedHit.
        </p>
      </div>

      {/* Card do Endpoint */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-4.5 space-y-3 shadow-xs">
        <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
          Endpoint MCP Streamable HTTP
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

      {/* Gerador de API Keys */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0c0d10] p-4.5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-emerald-400" />
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
              Chave de API Ativa (Escopo Total)
            </h2>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            ATIVA
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value="medtask_live_9a7f3c21_sec82910"
            className="flex-1 bg-[#111215] border border-white/[0.08] rounded-md px-3 py-1.5 text-xs font-mono text-zinc-400 outline-none"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard("medtask_live_9a7f3c21_sec82910", "key")}
            className="gap-1.5 text-xs"
          >
            {copiedKey === "key" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copiar
          </Button>
        </div>
      </div>

      {/* Snippets de Configuração */}
      <div className="space-y-3.5">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          Snippets de Conexão Rápida
        </h2>

        {/* Cursor IDE */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0c0d10] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 font-mono">
              Cursor (~/.cursor/mcp.json)
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
          <pre className="p-3 rounded-lg bg-[#07080a] text-[11px] font-mono text-zinc-300 overflow-x-auto border border-white/[0.04]">
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
          <pre className="p-3 rounded-lg bg-[#07080a] text-[11px] font-mono text-zinc-300 overflow-x-auto border border-white/[0.04]">
            {claudeDesktopConfig}
          </pre>
        </div>
      </div>
    </div>
  );
}
