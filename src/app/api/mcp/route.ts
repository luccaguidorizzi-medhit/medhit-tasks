import { NextResponse } from "next/server";
import { tasksService } from "@/server/services/tasks.service";
import { agentsService } from "@/server/services/agents.service";
import { store } from "@/server/services/data-store";

// Definição das MCP Tools disponíveis
const MCP_TOOLS = [
  {
    name: "list_areas",
    description: "Lista todas as áreas do workspace MedHit",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_projects",
    description: "Lista projetos de uma área ou de todo o workspace",
    inputSchema: {
      type: "object",
      properties: { areaId: { type: "string" } },
    },
  },
  {
    name: "list_tasks",
    description: "Lista tarefas com filtros opcionais (projectId, status, assignee, priority)",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        statusId: { type: "string" },
        priority: { type: "string" },
      },
    },
  },
  {
    name: "get_task",
    description: "Obtém detalhes completos de uma tarefa específica por ID",
    inputSchema: {
      type: "object",
      properties: { taskId: { type: "string" } },
      required: ["taskId"],
    },
  },
  {
    name: "create_task",
    description: "Cria uma nova tarefa ou tarefa para agente",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        statusId: { type: "string" },
        priority: { type: "string" },
        taskType: { type: "string" },
        aiContext: { type: "string" },
        storyPoints: { type: "number" },
      },
      required: ["projectId", "title", "statusId"],
    },
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, params, id = "mcp-req-1" } = body;

    // 1. Inicialização do protocolo MCP
    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "medhit-tasks-mcp",
            version: "1.0.0",
            author: "Lagana Flow",
          },
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
        },
      });
    }

    // 2. Listagem de Tools
    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: { tools: MCP_TOOLS },
      });
    }

    // 3. Execução de Tools
    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};

      switch (toolName) {
        case "list_areas": {
          const areas = store.workspace.areas.map((a) => ({
            id: a.id,
            name: a.name,
            slug: a.slug,
            projectCount: a.projects.length,
          }));
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(areas, null, 2) }] },
          });
        }

        case "list_projects": {
          const allProjects = store.workspace.areas.flatMap((a) => a.projects);
          const filtered = args.areaId
            ? allProjects.filter((p) => p.areaId === args.areaId)
            : allProjects;
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] },
          });
        }

        case "list_tasks": {
          const tasks = tasksService.getAllTasks(args.projectId);
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }] },
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
