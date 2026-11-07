/**
 * MedHit WorkTrack - Card Sync Endpoint para Google Forms & Apps Script
 * Mantido por: Equipe MedHit I&A
 *
 * Endpoint HTTP REST simples projetado especificamente para ser chamado via
 * Google Apps Script (UrlFetchApp.fetch) ou automações externas (n8n, Make).
 *
 * Realiza UPSERT por externalId:
 * - Se o card com externalId já existe no projeto -> Atualiza status e customFields
 * - Se não existe -> Cria novo card já na coluna certa com os dados gravados
 */

import { NextResponse } from "next/server";
import { tasksService } from "@/server/services/tasks.service";
import { workspaceService } from "@/server/services/workspace.service";
import { store } from "@/server/services/data-store";

async function authenticateToken(req: Request) {
  const authHeader = req.headers.get("authorization") || req.headers.get("x-mcp-token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) return null;

  // Master tokens
  if (token === "mh_live_lucca_sec82910" || token === "medtask_live_9a7f3c21_sec82910") {
    return { type: "master", role: "owner" };
  }

  // Token de membro
  const member = store.workspace.members.find((m) => m.mcpToken === token);
  if (member) {
    return { type: "member", role: member.role, member };
  }

  // Token de serviço com escopo restrito (mh_svc_...)
  const svc = await workspaceService.validateServiceToken(token);
  if (svc) {
    return { type: "service", projectId: svc.project_id, name: svc.name };
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Token de autorização inválido ou ausente. Use 'Authorization: Bearer <TOKEN>'" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      projectId,
      externalId,
      title,
      description,
      statusId,
      priority = "medium",
      assigneeId,
      customFields = {},
      tags = [],
      dueDate,
    } = body;

    if (!projectId || !title) {
      return NextResponse.json(
        { error: "Campos obrigatórios: 'projectId' e 'title'" },
        { status: 400 }
      );
    }

    // Validação de escopo restrito de projeto para Service Tokens
    if (auth.type === "service" && auth.projectId && auth.projectId !== projectId) {
      return NextResponse.json(
        { error: `Acesso negado: Este token de serviço está restrito ao projeto '${auth.projectId}'` },
        { status: 403 }
      );
    }

    // 1. Busca por externalId para evitar duplicatas (P1 - Item 7)
    let existingTask = null;
    if (externalId) {
      existingTask = await tasksService.getTaskByExternalId(externalId, projectId);
    }

    // 2. Se já existe, realiza UPDATE com os novos campos e status
    if (existingTask) {
      const updates: any = {
        title,
        ...(description ? { description } : {}),
        ...(statusId ? { statusId } : {}),
        ...(priority ? { priority } : {}),
        ...(assigneeId ? { assigneeId } : {}),
        ...(dueDate ? { dueDate } : {}),
        customFields: {
          ...(existingTask.customFields || {}),
          ...customFields,
          externalId,
        },
      };

      if (tags && tags.length > 0) {
        updates.tags = Array.from(new Set([...(existingTask.tags || []), ...tags]));
      }

      const updated = await tasksService.updateTask(existingTask.id, updates);
      return NextResponse.json({
        success: true,
        action: "updated",
        message: `Card atualizado com sucesso via externalId '${externalId}'`,
        task: updated,
      });
    }

    // 3. Se não existe, cria novo card (P0 - Item 3)
    // Se statusId não foi informado, pega o primeiro status do projeto
    let targetStatusId = statusId;
    if (!targetStatusId) {
      const projFound = workspaceService.findProject(projectId);
      targetStatusId = projFound?.project.statuses[0]?.id || "st-todo";
    }

    const created = tasksService.createTask({
      projectId,
      title,
      description: description || "",
      statusId: targetStatusId,
      priority,
      assigneeId,
      externalId,
      dueDate,
      tags,
      customFields: {
        ...customFields,
        externalId,
      },
    });

    return NextResponse.json({
      success: true,
      action: "created",
      message: "Card criado com sucesso no pipeline",
      task: created,
    });
  } catch (err) {
    console.error("[Card Sync] Erro no processamento:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
