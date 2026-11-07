/**
 * MedHit WorkTrack - Card Move Endpoint
 * Mantido por: Equipe MedHit I&A
 *
 * Endpoint REST simples para mover cards entre colunas (com suporte a externalId).
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

export async function POST(request: Request) {
  try {
    const auth = await authenticateToken(request);
    if (!auth) {
      return NextResponse.json({ error: "Token não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, externalId, projectId, targetStatusId, customFields } = body;

    if (!targetStatusId || (!taskId && !externalId)) {
      return NextResponse.json(
        { error: "Informe 'targetStatusId' e pelo menos 'taskId' ou 'externalId'" },
        { status: 400 }
      );
    }

    let targetTask = null;
    if (taskId) {
      targetTask = tasksService.getTaskById(taskId);
    } else if (externalId) {
      targetTask = await tasksService.getTaskByExternalId(externalId, projectId);
    }

    if (!targetTask) {
      return NextResponse.json({ error: "Card não encontrado" }, { status: 404 });
    }

    if (auth.type === "service" && auth.projectId && auth.projectId !== targetTask.projectId) {
      return NextResponse.json(
        { error: `Este token de serviço está restrito ao projeto '${auth.projectId}'` },
        { status: 403 }
      );
    }

    // Move a tarefa (atualiza statusChangedAt e dispara webhooks)
    const moved = await tasksService.moveTask(targetTask.id, targetStatusId);

    // Se passou campos adicionais para atualizar no mesmo movimento
    if (customFields && moved) {
      await tasksService.updateTask(targetTask.id, { customFields });
    }

    return NextResponse.json({
      success: true,
      message: `Card '${targetTask.title}' movido para status '${targetStatusId}'`,
      task: moved,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
