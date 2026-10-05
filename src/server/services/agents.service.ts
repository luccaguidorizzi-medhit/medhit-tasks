import { store, AgentRun, Approval } from "./data-store";

export const agentsService = {
  listAgents() {
    return store.workspace.agents;
  },

  getAgentRuns(agentId?: string): AgentRun[] {
    if (agentId) {
      return store.agentRuns.filter((r) => r.agentId === agentId);
    }
    return store.agentRuns;
  },

  getApprovals(status?: "pending" | "approved" | "rejected"): Approval[] {
    if (status) {
      return store.approvals.filter((a) => a.status === status);
    }
    return store.approvals;
  },

  reviewApproval(approvalId: string, status: "approved" | "rejected", comment?: string) {
    const appr = store.approvals.find((a) => a.id === approvalId);
    if (!appr) return null;

    appr.status = status;
    appr.reviewedBy = "Lucca Lagana";
    appr.reviewedAt = new Date().toISOString();
    appr.reviewComment = comment;

    const run = store.agentRuns.find((r) => r.id === appr.runId);
    if (run) {
      run.status = status === "approved" ? "running" : "cancelled";
      run.events.push({
        id: `ev-${Date.now()}`,
        type: status === "approved" ? "message" : "error",
        content: `Aprovação humana ${status === "approved" ? "CONCEDIDA" : "REJEITADA"} por Lucca Lagana${comment ? `: "${comment}"` : ""}`,
        createdAt: new Date().toISOString(),
      });
    }

    store.activities.unshift({
      id: `act-${Date.now()}`,
      taskId: appr.taskId,
      actorType: "user",
      actorName: "Lucca Lagana",
      action: `${status === "approved" ? "aprovou" : "rejeitou"} solicitação do agente ${appr.agentName}`,
      createdAt: new Date().toISOString(),
    });

    return appr;
  },

  claimNextTask(agentId: string) {
    const agent = store.workspace.agents.find((a) => a.id === agentId);
    if (!agent) return null;

    // Busca tarefa de agente ainda não concluída
    const targetTask = store.tasks.find(
      (t) =>
        t.taskType === "agent_task" &&
        t.assigneeIds.some((ass) => ass.id === agentId)
    );

    if (!targetTask) return null;

    const newRun: AgentRun = {
      id: `run-${Date.now()}`,
      workspaceId: store.workspace.id,
      agentId,
      agentName: agent.name,
      taskId: targetTask.id,
      taskTitle: targetTask.title,
      status: "running",
      startedAt: new Date().toISOString(),
      tokenUsage: { prompt: 1200, completion: 450, total: 1650 },
      costEstimate: 0.0028,
      events: [
        {
          id: `ev-${Date.now()}`,
          type: "thought",
          content: `Iniciando análise da tarefa ${targetTask.title}`,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    store.agentRuns.unshift(newRun);
    return newRun;
  },

  reportProgress(runId: string, eventType: "thought" | "tool_call" | "tool_result" | "message" | "error", content: string) {
    const run = store.agentRuns.find((r) => r.id === runId);
    if (!run) return null;

    const newEvent = {
      id: `ev-${Date.now()}`,
      type: eventType,
      content,
      createdAt: new Date().toISOString(),
    };

    run.events.push(newEvent);
    return newEvent;
  },

  completeTask(runId: string) {
    const run = store.agentRuns.find((r) => r.id === runId);
    if (!run) return null;

    run.status = "completed";
    run.completedAt = new Date().toISOString();

    const task = store.tasks.find((t) => t.id === run.taskId);
    if (task) {
      // Move tarefa para Done/Concluído no projeto correspondente
      const project = store.workspace.areas
        .flatMap((a) => a.projects)
        .find((p) => p.id === task.projectId);
      const doneStatus = project?.statuses.find((s) => s.category === "done");
      if (doneStatus) {
        task.statusId = doneStatus.id;
      }
      task.updatedAt = new Date().toISOString();
    }

    return run;
  },
};
