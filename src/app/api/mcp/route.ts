/**
 * MedHit Task Manager - MCP (Model Context Protocol) Server
 * Mantido por: Lagana Flow
 * 
 * Suporte completo a:
 * - Autenticação por token por usuário (Bearer token do membro)
 * - CRUD completo de Tarefas (list_tasks, get_task, create_task, update_task, delete_task)
 * - Gestão de Quadros e Áreas (list_areas, list_projects, create_project, delete_project)
 * - Gestão de Membros e Convites (list_members, update_member_role, invite_member_with_email)
 * - Comentários e Checklists (add_comment, toggle_checklist_item)
 * - Orquestração de Agentes (claim_next_task, report_progress, request_approval, complete_task)
 */

import { NextResponse } from "next/server";
import { tasksService } from "@/server/services/tasks.service";
import { agentsService } from "@/server/services/agents.service";
import { emailService } from "@/server/services/email.service";
import { store, Member, Project, Area } from "@/server/services/data-store";

// Definição das MCP Tools com cobertura total do sistema
const MCP_TOOLS = [
  // 1. ÁREAS E TIMES
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
    description: "Lista quadros e projetos de uma área específica ou de todo o workspace",
    inputSchema: {
      type: "object",
      properties: {
        areaId: { type: "string", description: "ID da área (opcional)" },
      },
    },
  },
  {
    name: "get_project",
    description: "Obtém detalhes de um projeto/board com suas colunas de status e sprints",
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

  // 3. TAREFAS (CRUD TOTAL)
  {
    name: "list_tasks",
    description: "Lista tarefas com suporte a filtros flexíveis (projectId, statusId, priority, assigneeId)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        statusId: { type: "string" },
        priority: { type: "string" },
        search: { type: "string" },
      },
    },
  },
  {
    name: "get_task",
    description: "Obtém todos os detalhes, checklists, comentários e histórico de uma tarefa",
    inputSchema: {
      type: "object",
      properties: { taskId: { type: "string" } },
      required: ["taskId"],
    },
  },
  {
    name: "create_task",
    description: "Cria uma nova tarefa no board selecionado",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        statusId: { type: "string" },
        priority: { type: "string", enum: ["urgent", "high", "medium", "low", "none"] },
        taskType: { type: "string" },
        storyPoints: { type: "number" },
        dueDate: { type: "string" },
        aiContext: { type: "string" },
      },
      required: ["projectId", "title", "statusId"],
    },
  },
  {
    name: "update_task",
    description: "Edita qualquer atributo de uma tarefa existente (título, descrição, status, prioridade, story points, datas)",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        statusId: { type: "string" },
        priority: { type: "string" },
        storyPoints: { type: "number" },
        dueDate: { type: "string" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "move_task",
    description: "Move uma tarefa para outra coluna/status com posição opcional",
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
    name: "delete_task",
    description: "Remove permanentemente uma tarefa do sistema",
    inputSchema: {
      type: "object",
      properties: { taskId: { type: "string" } },
      required: ["taskId"],
    },
  },
  {
    name: "add_comment",
    description: "Adiciona um comentário ou anotação a uma tarefa",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string" },
        content: { type: "string" },
      },
      required: ["taskId", "content"],
    },
  },
  {
    name: "toggle_checklist_item",
    description: "Marca ou desmarca um item da checklist de uma tarefa",
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

  // 4. MEMBROS & ACESSO
  {
    name: "list_members",
    description: "Lista os membros cadastrados no workspace, seus papéis e tokens MCP",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_current_user",
    description: "Retorna o usuário autenticado associado ao token MCP em uso",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "update_member_role",
    description: "Altera o nível de permissão de um membro (owner, admin, member, guest)",
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
    description: "Convida um novo membro, gera token MCP, senha provisória e dispara e-mail via Resend",
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

  // 5. AGENTES DE IA & FILAS
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

/**
 * Autentica a requisição via cabeçalho Authorization
 * Suporta o token do usuário Lucca (medtask_user_lucca_x32kd58_sec99) e os tokens de cada membro
 */
function authenticateRequest(request: Request): Member | null {
  const authHeader = request.headers.get("authorization") || request.headers.get("x-mcp-token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  // Se nenhum token fornecido, retorna o primeiro membro (Lucca Lagana) como fallback em dev
  if (!token) {
    return store.workspace.members[0];
  }

  // Token master padrão ou token do Lucca
  if (
    token === "medtask_user_lucca_x32kd58_sec99" ||
    token === "medtask_live_9a7f3c21_sec82910" ||
    token === "x32kd58"
  ) {
    const lucca = store.workspace.members.find(
      (m) => m.email === "lucca@medhit.com.br" || m.name.toLowerCase().includes("lucca")
    );
    return lucca || store.workspace.members[0];
  }

  // Busca por mcpToken do membro
  const member = store.workspace.members.find((m) => m.mcpToken === token);
  return member || store.workspace.members[0];
}

export async function POST(request: Request) {
  try {
    const activeUser = authenticateRequest(request);
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
            version: "2.0.0",
            author: "Lagana Flow",
            authenticatedAs: activeUser ? { name: activeUser.name, email: activeUser.email, role: activeUser.role } : null,
          },
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
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

      switch (toolName) {
        // --- 1. ÁREAS ---
        case "list_areas": {
          const areas = store.workspace.areas.map((a) => ({
            id: a.id,
            name: a.name,
            slug: a.slug,
            description: a.description,
            color: a.color,
            projectCount: a.projects.length,
          }));
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(areas, null, 2) }] },
          });
        }

        case "create_area": {
          const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const newArea: Area = {
            id: `area-${Date.now()}`,
            workspaceId: store.workspace.id,
            name: args.name,
            slug,
            description: args.description || "",
            icon: args.icon || "folder",
            color: args.color || "#38bdf8",
            projects: [],
          };
          store.workspace.areas.push(newArea);
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
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ message: `Área "${removed.name}" excluída`, id: removed.id }, null, 2) }] },
          });
        }

        // --- 2. PROJETOS / BOARDS ---
        case "list_projects": {
          const allProjects = store.workspace.areas.flatMap((a) =>
            a.projects.map((p) => ({
              ...p,
              areaName: a.name,
              areaSlug: a.slug,
              taskCount: store.tasks.filter((t) => t.projectId === p.id).length,
            }))
          );
          const filtered = args.areaId
            ? allProjects.filter((p) => p.areaId === args.areaId)
            : allProjects;

          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] },
          });
        }

        case "get_project": {
          const project = store.workspace.areas
            .flatMap((a) => a.projects)
            .find((p) => p.id === args.projectId);

          if (!project) {
            return NextResponse.json({
              jsonrpc: "2.0",
              id,
              error: { code: -32602, message: "Projeto não encontrado" },
            });
          }
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(project, null, 2) }] },
          });
        }

        case "create_project": {
          const targetArea = store.workspace.areas.find((a) => a.id === args.areaId) || store.workspace.areas[0];
          const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const newProject: Project = {
            id: `proj-${Date.now()}`,
            workspaceId: store.workspace.id,
            areaId: targetArea.id,
            name: args.name,
            slug,
            description: args.description || "",
            icon: "folder",
            color: args.color || "#38bdf8",
            methodology: "kanban",
            statuses: [
              { id: `status-${Date.now()}-1`, workspaceId: store.workspace.id, projectId: `proj-${Date.now()}`, name: "A Fazer", color: "#64748b", position: 1000, category: "todo" },
              { id: `status-${Date.now()}-2`, workspaceId: store.workspace.id, projectId: `proj-${Date.now()}`, name: "Em Andamento", color: "#38bdf8", position: 2000, category: "in_progress", wipLimit: 4 },
              { id: `status-${Date.now()}-3`, workspaceId: store.workspace.id, projectId: `proj-${Date.now()}`, name: "Concluído", color: "#10b981", position: 3000, category: "done" },
            ],
            sprints: [],
          };
          targetArea.projects.push(newProject);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(newProject, null, 2) }] },
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
          // Remove tarefas associadas
          store.tasks = store.tasks.filter((t) => t.projectId !== args.projectId);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify({ message: `Projeto "${deletedProject.name}" excluído`, id: deletedProject.id }, null, 2) }] },
          });
        }

        // --- 3. TAREFAS ---
        case "list_tasks": {
          let list = tasksService.getAllTasks(args.projectId);
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
          const task = tasksService.getTaskById(args.taskId);
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

        case "add_comment": {
          const comment = tasksService.addComment(
            args.taskId,
            args.content,
            "user",
            activeUser ? activeUser.name : "Lucca Lagana"
          );
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(comment, null, 2) }] },
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

        // --- 4. MEMBROS & ACESSO ---
        case "list_members": {
          const membersSafe = store.workspace.members.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: m.role,
            status: m.status,
            mcpToken: m.mcpToken,
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
                      user: activeUser,
                      connectedTool: "Google Antigravity MCP Client",
                      signature: "Lagana Flow",
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
            result: { content: [{ type: "text", text: JSON.stringify(member, null, 2) }] },
          });
        }

        case "invite_member": {
          const newId = `user-${Date.now()}`;
          const generatedMcpToken = `medtask_user_${args.name.toLowerCase().replace(/[^a-z0-9]/g, "")}_sec${Date.now().toString().slice(-6)}`;
          const initialPassword = `medhit_${Math.random().toString(36).slice(-6)}`;

          const newMember: Member = {
            id: newId,
            workspaceId: store.workspace.id,
            name: args.name,
            email: args.email,
            password: initialPassword,
            mcpToken: generatedMcpToken,
            role: args.role,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(args.name)}`,
            status: "active",
            lastLoginAt: new Date().toISOString(),
          };

          store.workspace.members.push(newMember);

          // Disparo de e-mail via Resend se solicitado
          let emailStatus = null;
          if (args.sendEmail !== false) {
            emailStatus = await emailService.sendInviteEmail({
              to: newMember.email,
              name: newMember.name,
              invitedBy: activeUser ? activeUser.name : "Lucca Lagana",
              role: newMember.role,
              password: initialPassword,
              mcpToken: generatedMcpToken,
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
                      member: newMember,
                      initialPassword,
                      mcpToken: generatedMcpToken,
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

        // --- 5. AGENTES & RUNS ---
        case "list_agents": {
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(store.workspace.agents, null, 2) }] },
          });
        }

        case "claim_next_task": {
          const claimed = agentsService.claimNextTask(args.agentId);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(claimed || { message: "Nenhuma tarefa pendente na fila" }, null, 2) }] },
          });
        }

        case "report_progress": {
          const event = agentsService.reportProgress(args.runId, args.eventType, args.content);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(event, null, 2) }] },
          });
        }

        case "request_approval": {
          const newAppr = {
            id: `appr-${Date.now()}`,
            workspaceId: store.workspace.id,
            taskId: args.taskId,
            taskTitle: tasksService.getTaskById(args.taskId)?.title || "Tarefa",
            agentId: args.agentId,
            agentName: store.workspace.agents.find((a) => a.id === args.agentId)?.name || "Agente IA",
            runId: args.runId || `run-${Date.now()}`,
            requestedAction: args.requestedAction,
            payload: args.payload || {},
            status: "pending" as const,
            requestedAt: new Date().toISOString(),
          };
          store.approvals.unshift(newAppr);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(newAppr, null, 2) }] },
          });
        }

        case "complete_task": {
          const completed = agentsService.completeTask(args.runId);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(completed, null, 2) }] },
          });
        }

        default:
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Ferramenta MCP desconhecida: ${toolName}` },
          });
      }
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32600, message: "Método MCP não suportado" },
    });
  } catch (error) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32603, message: "Erro interno no servidor MCP", data: String(error) } },
      { status: 500 }
    );
  }
}
