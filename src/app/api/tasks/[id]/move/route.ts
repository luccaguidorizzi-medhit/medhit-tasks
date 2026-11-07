/**
 * MedHit WorkTrack - Task Move by ID Endpoint
 * Mantido por: Equipe MedHit I&A
 *
 * Endpoint HTTP REST solicitado especificamente na especificação v2:
 * POST /api/tasks/{id}/move
 * Aceita autenticação via Bearer token (Master, Membro ou Token de Serviço mh_svc_...).
 */

import { NextResponse } from "next/server";
import { tasksService } from "@/server/services/tasks.service";
import { workspaceService } from "@/server/services/workspace.service";
import { store } from "@/server/services/data-store";

async function authenticateToken(req: Request) {
  const authHeader = req.headers.get("authorization") || req.headers.get("x-mcp-token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) return null;

  if (token === "mh_live_lucca_sec82910" || token === "medtask_live_9a7f3c21_sec82910") {
    return { type: "master", role: "owner" };
  }

  const member = store.workspace.members.find((m) => m.mcpToken === token);
  if (member) return { type: "member", role: member.role, member };

  const svc = await workspaceService.validateServiceToken(token);
  if (svc) return { type: "service", projectId: svc.project_id, name: svc.name };

  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Token não autorizado. Envie 'Authorization: Bearer <TOKEN>'" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const targetStatusId = body.targetStatusId || body.statusId;

    if (!targetStatusId) {
      return NextResponse.json(
        { error: "Campo 'targetStatusId' (ou 'statusId') é obrigatório" },
        { status: 400 }
      );
    }

    // Busca a tarefa por ID (ou externalId caso passem ID externo na URL)
    let task = await tasksService.getTaskByIdAsync(id);
    if (!task) {
      task = await tasksService.getTaskByExternalId(id);
    }

    if (!task) {
      return NextResponse.json(
        { error: `Card '${id}' não encontrado` },
        { status: 404 }
      );
    }

    // Validação de escopo do service token
    if (auth.type === "service" && auth.projectId && auth.projectId !== task.projectId) {
      return NextResponse.json(
        { error: "Acesso negado: Este token de serviço está restrito a outro projeto" },
        { status: 403 }
      );
    }

    // Move a tarefa
    const moved = await tasksService.moveTask(task.id, targetStatusId);
    if (!moved) {
      return NextResponse.json(
        { error: `Falha ao mover tarefa para status '${targetStatusId}'` },
        { status: 500 }
      );
    }

    // Atualiza customFields se foram enviados no body
    if (body.customFields && typeof body.customFields === "object") {
      await tasksService.updateTask(task.id, {
        customFields: {
          ...moved.customFields,
          ...body.customFields,
        },
      });
    }

    // Adiciona comentário de histórico se fornecido
    if (body.comment && typeof body.comment === "string") {
      const authorName = auth.type === "service" ? `Automação (${auth.name})` : "Integração Externa";
      await tasksService.addComment(task.id, body.comment, "agent", authorName);
    }

    const updated = await tasksService.getTaskByIdAsync(task.id);

    return NextResponse.json({
      success: true,
      message: `Card '${task.title}' movido para status '${targetStatusId}' com sucesso`,
      task: updated,
    });
  } catch (err: any) {
    console.error("[/api/tasks/[id]/move] Erro ao mover card:", err);
    return NextResponse.json(
      { error: err?.message || "Erro interno ao processar movimentação" },
      { status: 500 }
    );
  }
}
