/**
 * MedHit Task Manager - MCP (Model Context Protocol) Server
 * Mantido por: Equipe MedHit I&A
 * 
 * Versão 2.1.0 Enterprise:
 * - Sincronização viva com o Supabase (medtask_workspaces, medtask_tasks, medtask_service_tokens, medtask_webhooks)
 * - P0: Gestão de Status/Colunas (create_status, update_status, delete_status)
 * - P0: Atribuição flexível de responsável (assigneeId por ID, email ou nome)
 * - P0: Campos personalizados por projeto e por card (create_custom_field, set_task_custom_fields)
 * - P0: Exposição de statusChangedAt e dias na coluna atual
 * - P0: CRUD completo de Checklists e Itens (create_checklist, add_checklist_item, delete_checklist_item)
 * - P0: Tokens de serviço com escopo restrito a projetos (create_service_token, list_service_tokens, revoke_service_token)
 * - P1: Busca e deduplicação por ID externo (get_task_by_external_id)
 * - P1: Tags e Etiquetas (add_tag, remove_tag)
 * - P1: Anexos e Links (add_attachment)
 * - P1: Arquivamento de cards (archive_task, unarchive_task)
 * - P1: Webhooks de saída ao mudar de coluna (register_webhook, list_webhooks, delete_webhook)
 * - P2: Edição de projeto e criação de grupos (update_project, create_group)
 */

import { NextResponse } from "next/server";
import { tasksService } from "@/server/services/tasks.service";
import { workspaceService } from "@/server/services/workspace.service";
import { agentsService } from "@/server/services/agents.service";
import { emailService } from "@/server/services/email.service";
import { store, Member, Project, Area } from "@/server/services/data-store";

// Definição das MCP Tools
const MCP_TOOLS = [
  // 1. ÁREAS E SQUADS
  {
    name: "list_areas",
    description: "Lista todas as áreas/squads do workspace MedHit com total de projetos e estatísticas",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create_area",
    description: "Cria uma nova área ou squad de trabalho no workspace",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        color: { type: "string" },
        icon: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "delete_area",
    description: "Exclui uma área/squad e remove os projetos associados",
    inputSchema: {
      type: "object",
      properties: {
        areaId: { type: "string" },
      },
      required: ["areaId"],
    },
  },

  // 2. PROJETOS E QUADROS
  {
    name: "list_projects",
    description: "Lista quadros e projetos de uma área específica ou de todo o workspace (incluindo PosgradoMed, Casa Obra, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        areaId: { type: "string", description: "ID da área (opcional)" },
      },
    },
  },
  {
    name: "get_project",
    description: "Obtém detalhes de um projeto/board com suas colunas de status, campos personalizados e grupos",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
      },
      required: ["projectId"],
    },
  },
  {
    name: "create_project",
    description: "Cria um novo projeto/quadro em uma área do workspace",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        areaId: { type: "string" },
        description: { type: "string" },
        color: { type: "string" },
      },
      required: ["name", "areaId"],
    },
  },
  {
    name: "update_project",
    description: "Edita metadados de um projeto (nome, descrição, cor)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        color: { type: "string" },
      },
      required: ["projectId"],
    },
  },
  {
    name: "create_group",
    description: "Cria um grupo ou seção dentro de um projeto para organizar cards",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        name: { type: "string" },
        color: { type: "string" },
      },
      required: ["projectId", "name"],
    },
  },
  {
    name: "delete_project",
    description: "Exclui um projeto/quadro e todas as suas tarefas",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
      },
      required: ["projectId"],
    },
  },

  // 3. GESTÃO DE COLUNAS / STATUS (P0 - ITEM 1)
  {
    name: "create_status",
    description: "Cria uma nova coluna/status em um projeto (ex: Em Análise, Deferido, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        name: { type: "string" },
        color: { type: "string" },
        position: { type: "number" },
        category: { type: "string", enum: ["todo", "in_progress", "review", "done", "cancelled"] },
        slaDays: { type: "number", description: "SLA limite em dias para cards nesta coluna" },
      },
      required: ["projectId", "name"],
    },
  },
  {
    name: "update_status",
    description: "Renomeia, altera cor, posição, categoria ou SLA de um status existente",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        statusId: { type: "string" },
        name: { type: "string" },
        color: { type: "string" },
        position: { type: "number" },
        category: { type: "string", enum: ["todo", "in_progress", "review", "done", "cancelled"] },
        slaDays: { type: "number" },
      },
      required: ["projectId", "statusId"],
    },
  },
  {
    name: "delete_status",
    description: "Exclui um status e opcionalmente move os cards para outra coluna",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        statusId: { type: "string" },
        targetStatusIdForTasks: { type: "string", description: "ID do status para onde mover os cards existentes" },
      },
      required: ["projectId", "statusId"],
    },
  },

  // 4. CAMPOS PERSONALIZADOS (P0 - ITEM 3)
  {
    name: "create_custom_field",
    description: "Define um novo campo personalizado no projeto (ex: studentEmail, cpfNumber, driveFolderUrl, editalDeadline)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        name: { type: "string", description: "Nome visível do campo (ex: 'E-mail do Aluno')" },
        key: { type: "string", description: "Chave identificadora (ex: 'studentEmail', 'cpfNumber')" },
        type: { type: "string", enum: ["text", "number", "date", "url", "select"] },
        options: { type: "array", items: { type: "string" }, description: "Opções caso o tipo seja select" },
        description: { type: "string" },
      },
      required: ["projectId", "name", "key", "type"],
    },
  },
  {
    name: "set_task_custom_fields",
    description: "Grava ou atualiza os valores de campos personalizados em um card (studentEmail, cpfNumber, driveFolderUrl, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        customFields: { type: "object", description: "Chaves e valores dos campos personalizados" },
      },
      required: ["taskId", "customFields"],
    },
  },

  // 5. TAREFAS / CARDS (CRUD & AUTOMAÇÃO)
  {
    name: "list_tasks",
    description: "Lista tarefas com suporte a filtros flexíveis (projectId, statusId, priority, search, includeArchived)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        statusId: { type: "string" },
        priority: { type: "string" },
        search: { type: "string" },
        includeArchived: { type: "boolean" },
      },
    },
  },
  {
    name: "get_task",
    description: "Obtém detalhes de uma tarefa, incluindo statusChangedAt, dias na coluna, checklists, anexos e comentários",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "get_task_by_external_id",
    description: "Busca um card pelo seu ID externo (aluno, inscrição, protocolo do Forms) para evitar duplicatas",
    inputSchema: {
      type: "object",
      properties: {
        externalId: { type: "string" },
        projectId: { type: "string" },
      },
      required: ["externalId"],
    },
  },
  {
    name: "create_task",
    description: "Cria uma nova tarefa com suporte a assigneeId (ID, email ou nome), customFields, externalId e tags",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        projectId: { type: "string" },
        statusId: { type: "string" },
        priority: { type: "string", enum: ["urgent", "high", "medium", "low", "none"] },
        description: { type: "string" },
        assigneeId: { type: "string", description: "ID, e-mail corporativo ou nome do responsável" },
        assigneeIds: { type: "array", items: { type: "string" } },
        externalId: { type: "string", description: "ID externo do aluno/inscrição para deduplicação" },
        customFields: { type: "object", description: "Campos customizados (studentEmail, cpfNumber, driveFolderUrl, etc.)" },
        tags: { type: "array", items: { type: "string" } },
        dueDate: { type: "string" },
      },
      required: ["title", "projectId", "statusId"],
    },
  },
  {
    name: "update_task",
    description: "Atualiza uma tarefa existente (título, descrição, assigneeId, customFields, prioridade, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        statusId: { type: "string" },
        priority: { type: "string" },
        assigneeId: { type: "string" },
        externalId: { type: "string" },
        customFields: { type: "object" },
        dueDate: { type: "string" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "move_task",
    description: "Move uma tarefa para outra coluna/status, registrando statusChangedAt e acionando webhooks de saída",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        targetStatusId: { type: "string" },
        position: { type: "number" },
      },
      required: ["taskId", "targetStatusId"],
    },
  },
  {
    name: "archive_task",
    description: "Arquiva a tarefa em vez de excluí-la, preservando o histórico e dados",
    inputSchema: {
      type: "object",
      properties: { taskId: { type: "string" } },
      required: ["taskId"],
    },
  },
  {
    name: "unarchive_task",
    description: "Desarquiva a tarefa e a retorna para a visualização ativa do quadro",
    inputSchema: {
      type: "object",
      properties: { taskId: { type: "string" } },
      required: ["taskId"],
    },
  },
  {
    name: "delete_task",
    description: "Exclui permanentemente uma tarefa do workspace",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
      },
      required: ["taskId"],
    },
  },

  // 6. CHECKLISTS (P0 - ITEM 5)
  {
    name: "create_checklist",
    description: "Cria um novo checklist no card da tarefa",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        title: { type: "string" },
      },
      required: ["taskId", "title"],
    },
  },
  {
    name: "add_checklist_item",
    description: "Adiciona um item a um checklist da tarefa",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        checklistId: { type: "string" },
        title: { type: "string" },
      },
      required: ["taskId", "title"],
    },
  },
  {
    name: "delete_checklist_item",
    description: "Exclui um item de checklist da tarefa",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        checklistId: { type: "string" },
        itemId: { type: "string" },
      },
      required: ["taskId", "checklistId", "itemId"],
    },
  },
  {
    name: "toggle_checklist_item",
    description: "Alterna a conclusão de um item de checklist da tarefa",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        checklistId: { type: "string" },
        itemId: { type: "string" },
      },
      required: ["taskId", "checklistId", "itemId"],
    },
  },

  // 7. TAGS & ANEXOS (P1 - ITENS 10 & 11)
  {
    name: "add_tag",
    description: "Adiciona uma etiqueta ao card",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        tag: { type: "string" },
      },
      required: ["taskId", "tag"],
    },
  },
  {
    name: "remove_tag",
    description: "Remove uma etiqueta do card",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        tag: { type: "string" },
      },
      required: ["taskId", "tag"],
    },
  },
  {
    name: "add_attachment",
    description: "Adiciona um link/anexo ao card (pasta do Drive, PDF de currículo, comprovante do CPF)",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        title: { type: "string" },
        url: { type: "string" },
        type: { type: "string", description: "drive, pdf, image ou link" },
      },
      required: ["taskId", "title", "url"],
    },
  },
  {
    name: "add_comment",
    description: "Adiciona um comentário no card da tarefa",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        content: { type: "string" },
      },
      required: ["taskId", "content"],
    },
  },

  // 8. TOKENS DE SERVIÇO POR PROJETO (P0 - ITEM 6)
  {
    name: "create_service_token",
    description: "Gera um token de serviço seguro (mh_svc_...) com escopo restrito a um projeto para agentes ou Apps Script",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nome descritivo (ex: 'Apps Script Posgrado Currículos')" },
        projectId: { type: "string", description: "ID do projeto para restringir o acesso (opcional)" },
        expiresInDays: { type: "number", description: "Validade em dias (opcional)" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_service_tokens",
    description: "Lista todos os tokens de serviço ativos com seus escopos de projeto",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "revoke_service_token",
    description: "Revoga e exclui permanentemente um token de serviço",
    inputSchema: {
      type: "object",
      properties: {
        tokenId: { type: "string" },
      },
      required: ["tokenId"],
    },
  },

  // 9. WEBHOOKS DE SAÍDA (P1 - ITEM 9)
  {
    name: "register_webhook",
    description: "Cadastra uma URL externa de webhook para receber notificações sempre que um card mudar de coluna",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string" },
        projectId: { type: "string", description: "Filtrar por projeto (opcional)" },
        events: { type: "array", items: { type: "string" }, description: "card.moved, card.created, card.updated" },
      },
      required: ["url"],
    },
  },
  {
    name: "list_webhooks",
    description: "Lista webhooks de saída cadastrados",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "delete_webhook",
    description: "Remove um webhook cadastrado",
    inputSchema: {
      type: "object",
      properties: {
        webhookId: { type: "string" },
      },
      required: ["webhookId"],
    },
  },

  // 10. MEMBROS & GOVERNANÇA
  {
    name: "list_members",
    description: "Lista membros ativos e funções no workspace (higienizado, nunca expõe senhas ou tokens)",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_current_user",
    description: "Obtém dados do usuário autenticado no token ativo e a assinatura institucional Equipe MedHit I&A",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "update_member_role",
    description: "Atualiza o nível de acesso/permissão de um membro no workspace",
    inputSchema: {
      type: "object",
      properties: {
        memberId: { type: "string" },
        role: { type: "string", enum: ["owner", "admin", "member", "guest"] },
      },
      required: ["memberId", "role"],
    },
  },
  {
    name: "invite_member",
    description: "Convida um novo membro, gera token MCP seguro e dispara convite por e-mail com link de ativação",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        role: { type: "string", enum: ["owner", "admin", "member", "guest"] },
        sendEmail: { type: "boolean" },
      },
      required: ["name", "email", "role"],
    },
  },

  // 11. AGENTES DE IA & RUNS
  {
    name: "list_agents",
    description: "Lista os agentes autônomos configurados no workspace MedHit",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "claim_next_task",
    description: "Agente reivindica a próxima tarefa disponível em sua fila de trabalho",
    inputSchema: {
      type: "object",
      properties: { agentId: { type: "string" } },
      required: ["agentId"],
    },
  },
  {
    name: "report_progress",
    description: "Registra evento de raciocínio, ferramenta ou progresso na execução do agente",
    inputSchema: {
      type: "object",
      properties: {
        runId: { type: "string" },
        eventType: { type: "string", enum: ["thought", "tool_call", "tool_result", "message", "error"] },
        content: { type: "string" },
      },
      required: ["runId", "eventType", "content"],
    },
  },
  {
    name: "request_approval",
    description: "Solicita aprovação humana para uma ação sensível antes de continuar",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        agentId: { type: "string" },
        runId: { type: "string" },
        requestedAction: { type: "string" },
        payload: { type: "object" },
      },
      required: ["taskId", "agentId", "requestedAction"],
    },
  },
  {
    name: "complete_task",
    description: "Marca a execução da tarefa do agente como concluída com sucesso",
    inputSchema: {
      type: "object",
      properties: { runId: { type: "string" } },
      required: ["runId"],
    },
  },
];

interface AuthResult {
  user: Member | null;
  serviceToken?: { id: string; name: string; project_id?: string | null; permissions: string[] } | null;
}

async function authenticateRequest(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization") || request.headers.get("x-mcp-token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return { user: store.workspace.members[0], serviceToken: null };
  }

  // Tokens mestres de administração
  if (token === "mh_live_lucca_sec82910" || token === "medtask_live_9a7f3c21_sec82910") {
    const lucca = store.workspace.members.find(
      (m) => m.email === "lucca@medhit.com.br" || m.name.toLowerCase().includes("lucca")
    );
    return { user: lucca || store.workspace.members[0], serviceToken: null };
  }

  // Token de membro do time
  const member = store.workspace.members.find((m) => m.mcpToken && m.mcpToken === token);
  if (member) {
    return { user: member, serviceToken: null };
  }

  // Token de serviço com escopo restrito (mh_svc_...)
  if (token.startsWith("mh_svc_")) {
    const svc = await workspaceService.validateServiceToken(token);
    if (svc) {
      return {
        user: {
          id: `svc-${svc.id}`,
          workspaceId: "ws-medhit-001",
          name: `Service: ${svc.name}`,
          email: `${svc.token.slice(0, 12)}@service.medhit.internal`,
          role: "member",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=ServiceToken",
          status: "active",
        },
        serviceToken: svc,
      };
    }
  }

  return { user: store.workspace.members[0], serviceToken: null };
}

function sanitizeMember(m: Member) {
  const { password, mcpToken, ...safe } = m;
  return safe;
}

export async function POST(request: Request) {
  try {
    // Sincroniza estado inicial a partir do Supabase
    await workspaceService.getWorkspaceAsync();

    const auth = await authenticateRequest(request);
    const activeUser = auth.user;
    const serviceToken = auth.serviceToken;

    const body = await request.json();
    const { method, params, id = "mcp-req-1" } = body;

    // 1. Handshake do protocolo MCP
    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "medhit-tasks-mcp",
            version: "2.1.0",
            author: "Equipe MedHit I&A",
            authenticatedAs: activeUser ? { name: activeUser.name, email: activeUser.email, role: activeUser.role } : null,
            restrictedProjectScope: serviceToken?.project_id || null,
          },
          capabilities: { tools: {}, resources: {}, prompts: {} },
        },
      });
    }

    // 2. Listagem de Ferramentas MCP
    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: { tools: MCP_TOOLS },
      });
    }

    // 3. Execução de Ferramentas
    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};

      // Validação de escopo de projeto para tokens de serviço
      if (serviceToken?.project_id) {
        if (args.projectId && args.projectId !== serviceToken.project_id) {
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32600,
              message: `Acesso negado: Este token de serviço está restrito ao projeto '${serviceToken.project_id}'`,
            },
          });
        }
      }

      switch (toolName) {
        // --- 1. ÁREAS ---
        case "list_areas": {
          const list = store.workspace.areas.map((a) => ({
            id: a.id,
            name: a.name,
            slug: a.slug,
            description: a.description,
            color: a.color,
            projectsCount: a.projects.length,
            projects: a.projects.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              statusesCount: p.statuses.length,
            })),
          }));
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(list, null, 2) }] },
          });
        }

        case "create_area": {
          const newId = `area-${Date.now()}`;
          const newArea: Area = {
            id: newId,
            workspaceId: store.workspace.id,
            name: args.name,
            slug: args.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            description: args.description || "",
            icon: args.icon || "folder",
            color: args.color || "#0284c7",
            projects: [],
          };
          store.workspace.areas.push(newArea);
          await workspaceService.persistWorkspaceState();
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(newArea, null, 2) }] },
          });
        }

        case "delete_area": {
          const idx = store.workspace.areas.findIndex((a) => a.id === args.areaId);
          if (idx === -1) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Área não encontrada" },
            });
          }
          const [removed] = store.workspace.areas.splice(idx, 1);
          await workspaceService.persistWorkspaceState();
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ message: `Área "${removed.name}" excluída`, id: removed.id }, null, 2) }] },
          });
        }

        // --- 2. PROJETOS & QUADROS ---
        case "list_projects": {
          let projects: any[] = [];
          if (args.areaId) {
            const area = store.workspace.areas.find((a) => a.id === args.areaId || a.slug === args.areaId);
            projects = area ? area.projects : [];
          } else {
            projects = store.workspace.areas.flatMap((a) =>
              a.projects.map((p) => ({ ...p, areaName: a.name, areaSlug: a.slug }))
            );
          }

          // Se for service token restrito, filtra apenas o projeto autorizado
          if (serviceToken?.project_id) {
            projects = projects.filter((p) => p.id === serviceToken.project_id || p.slug === serviceToken.project_id);
          }

          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(projects, null, 2) }] },
          });
        }

        case "get_project": {
          const found = workspaceService.findProject(args.projectId);
          if (!found) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: `Projeto '${args.projectId}' não encontrado` },
            });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      ...found.project,
                      areaName: found.area.name,
                      areaSlug: found.area.slug,
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          });
        }

        case "create_project": {
          const area = store.workspace.areas.find((a) => a.id === args.areaId || a.slug === args.areaId);
          if (!area) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: `Área '${args.areaId}' não encontrada` },
            });
          }

          const newProjId = `proj-${Date.now()}`;
          const newProject: Project = {
            id: newProjId,
            workspaceId: store.workspace.id,
            areaId: area.id,
            name: args.name,
            slug: args.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            description: args.description || "",
            icon: "layout",
            color: args.color || "#0ea5e9",
            methodology: "kanban",
            groups: [{ id: `grp-${newProjId}-1`, projectId: newProjId, name: "Geral", color: "#0ea5e9", position: 1 }],
            statuses: [
              { id: `st-${newProjId}-1`, workspaceId: store.workspace.id, projectId: newProjId, name: "A Fazer", color: "#64748b", position: 1000, category: "todo" },
              { id: `st-${newProjId}-2`, workspaceId: store.workspace.id, projectId: newProjId, name: "Em Andamento", color: "#38bdf8", position: 2000, category: "in_progress" },
              { id: `st-${newProjId}-3`, workspaceId: store.workspace.id, projectId: newProjId, name: "Concluído", color: "#22c55e", position: 3000, category: "done" },
            ],
            sprints: [],
          };

          area.projects.push(newProject);
          await workspaceService.persistWorkspaceState();

          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(newProject, null, 2) }] },
          });
        }

        case "update_project": {
          const found = workspaceService.findProject(args.projectId);
          if (!found) {
            return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Projeto não encontrado" } });
          }
          if (args.name) found.project.name = args.name;
          if (args.description !== undefined) found.project.description = args.description;
          if (args.color) found.project.color = args.color;

          await workspaceService.persistWorkspaceState();
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(found.project, null, 2) }] },
          });
        }

        case "create_group": {
          const found = workspaceService.findProject(args.projectId);
          if (!found) {
            return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Projeto não encontrado" } });
          }
          if (!found.project.groups) found.project.groups = [];

          const newGroup = {
            id: `grp-${Date.now()}`,
            projectId: found.project.id,
            name: args.name,
            color: args.color || "#0ea5e9",
            position: found.project.groups.length + 1,
            collapsed: false,
          };
          found.project.groups.push(newGroup);
          await workspaceService.persistWorkspaceState();

          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(newGroup, null, 2) }] },
          });
        }

        case "delete_project": {
          let found = false;
          let deletedProject: Project | null = null;
          for (const area of store.workspace.areas) {
            const idx = area.projects.findIndex((p) => p.id === args.projectId);
            if (idx !== -1) {
              [deletedProject] = area.projects.splice(idx, 1);
              found = true;
              break;
            }
          }
          if (!found || !deletedProject) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Projeto não encontrado para exclusão" },
            });
          }
          store.tasks = store.tasks.filter((t) => t.projectId !== args.projectId);
          await workspaceService.persistWorkspaceState();
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ message: `Projeto "${deletedProject.name}" excluído`, id: deletedProject.id }, null, 2) }] },
          });
        }

        // --- 3. STATUS / COLUNAS (P0 - ITEM 1) ---
        case "create_status": {
          const status = await workspaceService.createStatus({
            projectId: args.projectId,
            name: args.name,
            color: args.color,
            position: args.position,
            category: args.category,
            slaDays: args.slaDays,
          });
          if (!status) {
            return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Projeto não encontrado para criar status" } });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(status, null, 2) }] },
          });
        }

        case "update_status": {
          const updated = await workspaceService.updateStatus({
            projectId: args.projectId,
            statusId: args.statusId,
            name: args.name,
            color: args.color,
            position: args.position,
            category: args.category,
            slaDays: args.slaDays,
          });
          if (!updated) {
            return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Status ou projeto não encontrado" } });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] },
          });
        }

        case "delete_status": {
          const res = await workspaceService.deleteStatus(
            args.projectId,
            args.statusId,
            args.targetStatusIdForTasks
          );
          if (!res.success) {
            return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Falha ao excluir status" } });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ message: "Status excluído com sucesso", reassignedCards: res.reassignedCount }, null, 2) }] },
          });
        }

        // --- 4. CAMPOS PERSONALIZADOS (P0 - ITEM 3) ---
        case "create_custom_field": {
          const field = await workspaceService.createCustomField(args.projectId, {
            name: args.name,
            key: args.key,
            type: args.type,
            options: args.options,
            description: args.description,
          });
          if (!field) {
            return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Projeto não encontrado" } });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(field, null, 2) }] },
          });
        }

        case "set_task_custom_fields": {
          const updated = tasksService.updateTask(args.taskId, { customFields: args.customFields });
          if (!updated) {
            return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Tarefa não encontrada" } });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] },
          });
        }

        // --- 5. TAREFAS / CARDS ---
        case "list_tasks": {
          let list = await tasksService.getAllTasksAsync(args.projectId, Boolean(args.includeArchived));
          if (args.statusId) {
            list = list.filter((t) => t.statusId === args.statusId);
          }
          if (args.priority) {
            list = list.filter((t) => t.priority === args.priority);
          }
          if (args.search) {
            const q = args.search.toLowerCase();
            list = list.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(list, null, 2) }] },
          });
        }

        case "get_task": {
          const task = await tasksService.getTaskByIdAsync(args.taskId);
          if (!task) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Tarefa não encontrada" },
            });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(task, null, 2) }] },
          });
        }

        case "get_task_by_external_id": {
          const task = await tasksService.getTaskByExternalId(args.externalId, args.projectId);
          if (!task) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              result: { content: [{ type: "text", text: JSON.stringify({ found: false, message: "Nenhum card com esse ID externo" }, null, 2) }] },
            });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ found: true, task }, null, 2) }] },
          });
        }

        case "create_task": {
          const created = tasksService.createTask(args);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(created, null, 2) }] },
          });
        }

        case "update_task": {
          const { taskId, ...updates } = args;
          const updated = tasksService.updateTask(taskId, updates);
          if (!updated) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Tarefa não encontrada para atualização" },
            });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] },
          });
        }

        case "move_task": {
          const moved = tasksService.moveTask(args.taskId, args.targetStatusId, args.position);
          if (!moved) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Falha ao mover tarefa" },
            });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(moved, null, 2) }] },
          });
        }

        case "archive_task": {
          const archived = tasksService.archiveTask(args.taskId);
          if (!archived) {
            return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Tarefa não encontrada" } });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ message: "Card arquivado com sucesso", task: archived }, null, 2) }] },
          });
        }

        case "unarchive_task": {
          const restored = tasksService.unarchiveTask(args.taskId);
          if (!restored) {
            return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Tarefa não encontrada" } });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ message: "Card desarquivado com sucesso", task: restored }, null, 2) }] },
          });
        }

        case "delete_task": {
          const success = tasksService.deleteTask(args.taskId);
          if (!success) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Tarefa não encontrada para exclusão" },
            });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ success: true, taskId: args.taskId }, null, 2) }] },
          });
        }

        // --- 6. CHECKLISTS (P0 - ITEM 5) ---
        case "create_checklist": {
          const chk = tasksService.createChecklist(args.taskId, args.title);
          if (!chk) {
            return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Tarefa não encontrada" } });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(chk, null, 2) }] },
          });
        }

        case "add_checklist_item": {
          const item = tasksService.addChecklistItem(args.taskId, args.checklistId, args.title);
          if (!item) {
            return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Tarefa não encontrada" } });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(item, null, 2) }] },
          });
        }

        case "delete_checklist_item": {
          const success = tasksService.deleteChecklistItem(args.taskId, args.checklistId, args.itemId);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ success }, null, 2) }] },
          });
        }

        case "toggle_checklist_item": {
          const res = tasksService.toggleChecklistItem(args.taskId, args.checklistId, args.itemId);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] },
          });
        }

        // --- 7. TAGS, ANEXOS & COMENTÁRIOS ---
        case "add_tag": {
          const updated = tasksService.addTag(args.taskId, args.tag);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] },
          });
        }

        case "remove_tag": {
          const updated = tasksService.removeTag(args.taskId, args.tag);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] },
          });
        }

        case "add_attachment": {
          const att = tasksService.addAttachment(args.taskId, {
            title: args.title,
            url: args.url,
            type: args.type,
          });
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(att, null, 2) }] },
          });
        }

        case "add_comment": {
          const comment = tasksService.addComment(
            args.taskId,
            args.content,
            "user",
            activeUser ? activeUser.name : "Equipe MedHit I&A"
          );
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(comment, null, 2) }] },
          });
        }

        // --- 8. SERVICE TOKENS (P0 - ITEM 6) ---
        case "create_service_token": {
          const tokenRecord = await workspaceService.createServiceToken({
            name: args.name,
            projectId: args.projectId,
            expiresInDays: args.expiresInDays,
            createdBy: activeUser?.name || "admin",
          });
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      message: "Token de serviço criado com sucesso",
                      token: tokenRecord.token,
                      id: tokenRecord.id,
                      name: tokenRecord.name,
                      projectId: tokenRecord.project_id,
                      expiresAt: tokenRecord.expires_at,
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          });
        }

        case "list_service_tokens": {
          const tokens = await workspaceService.listServiceTokens();
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(tokens, null, 2) }] },
          });
        }

        case "revoke_service_token": {
          const success = await workspaceService.revokeServiceToken(args.tokenId);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ success, message: "Token revogado" }, null, 2) }] },
          });
        }

        // --- 9. WEBHOOKS DE SAÍDA (P1 - ITEM 9) ---
        case "register_webhook": {
          const wh = await workspaceService.registerWebhook({
            url: args.url,
            projectId: args.projectId,
            events: args.events,
          });
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(wh, null, 2) }] },
          });
        }

        case "list_webhooks": {
          const whList = await workspaceService.listWebhooks();
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(whList, null, 2) }] },
          });
        }

        case "delete_webhook": {
          const success = await workspaceService.deleteWebhook(args.webhookId);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ success }, null, 2) }] },
          });
        }

        // --- 10. MEMBROS & GOVERNANÇA ---
        case "list_members": {
          const membersSafe = store.workspace.members.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: m.role,
            status: m.status,
            avatarUrl: m.avatarUrl,
            lastLoginAt: m.lastLoginAt,
          }));
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(membersSafe, null, 2) }] },
          });
        }

        case "get_current_user": {
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      user: activeUser ? sanitizeMember(activeUser) : null,
                      connectedTool: "Google Antigravity MCP Client",
                      signature: "Equipe MedHit I&A",
                      serviceTokenScope: serviceToken?.project_id || "full_workspace",
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          });
        }

        case "update_member_role": {
          const member = store.workspace.members.find((m) => m.id === args.memberId);
          if (!member) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Membro não encontrado" },
            });
          }
          member.role = args.role;
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(sanitizeMember(member), null, 2) }] },
          });
        }

        case "invite_member": {
          const newId = `user-${Date.now()}`;
          const cleanName = args.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          const randomSuffix = Math.random().toString(36).substring(2, 10);
          const generatedMcpToken = `mh_sec_${cleanName}_${randomSuffix}`;

          const newMember: Member = {
            id: newId,
            workspaceId: store.workspace.id,
            name: args.name,
            email: args.email,
            password: "",
            mcpToken: generatedMcpToken,
            role: args.role,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(args.name)}`,
            status: "active",
            lastLoginAt: new Date().toISOString(),
          };

          store.workspace.members.push(newMember);

          let emailStatus = null;
          if (args.sendEmail !== false) {
            emailStatus = await emailService.sendInviteEmail({
              to: newMember.email,
              name: newMember.name,
              invitedBy: activeUser ? activeUser.name : "Equipe MedHit I&A",
              role: newMember.role,
            });
          }

          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      message: `Convite enviado com sucesso para ${newMember.email}`,
                      member: sanitizeMember(newMember),
                      emailResult: emailStatus,
                    },
                    null,
                    2
                  ),
                },
              ],
            },
          });
        }

        // --- 11. AGENTES DE IA ---
        case "list_agents": {
          const agents = agentsService.listAgents();
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(agents, null, 2) }] },
          });
        }

        case "claim_next_task": {
          const run = agentsService.claimNextTask(args.agentId);
          if (!run) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              result: { content: [{ type: "text", text: JSON.stringify({ message: "Nenhuma tarefa elegível na fila do agente no momento" }, null, 2) }] },
            });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(run, null, 2) }] },
          });
        }

        case "report_progress": {
          const run = agentsService.reportProgress(args.runId, args.eventType, args.content);
          if (!run) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Execução (runId) não encontrada" },
            });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ success: true, event: run }, null, 2) }] },
          });
        }

        case "request_approval": {
          const approval = agentsService.requestHumanApproval({
            taskId: args.taskId,
            agentId: args.agentId,
            runId: args.runId,
            requestedAction: args.requestedAction,
            payload: args.payload || {},
          });
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(approval, null, 2) }] },
          });
        }

        case "complete_task": {
          const run = agentsService.completeTask(args.runId);
          if (!run) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Execução não encontrada para finalização" },
            });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ success: true, message: "Tarefa do agente concluída com êxito", run }, null, 2) }] },
          });
        }

        default:
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Ferramenta MCP desconhecida: "${toolName}"` },
          });
      }
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32600, message: "Método JSON-RPC inválido" },
    });
  } catch (error) {
    console.error("[MCP Route Error]", error);
    return NextResponse.json({
      jsonrpc: "2.0",
      id: "mcp-err",
      error: { code: -32603, message: "Erro interno no servidor MCP", data: String(error) },
    });
  }
}
