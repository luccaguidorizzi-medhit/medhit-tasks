/**
 * MedHit WorkTrack - Workspace, Status & Service Token Service
 * Mantido por: Equipe MedHit I&A
 *
 * Gerencia o estado persistente do workspace no Supabase (medtask_workspaces,
 * medtask_service_tokens, medtask_webhooks), eliminando divergências entre UI e MCP.
 */

import { supabase } from "@/lib/supabase";
import { store, Area, Project, Status, BoardGroup, CustomFieldDefinition } from "./data-store";

export interface CreateStatusInput {
  projectId: string;
  name: string;
  color?: string;
  position?: number;
  category?: Status["category"];
  slaDays?: number;
}

export interface UpdateStatusInput {
  projectId: string;
  statusId: string;
  name?: string;
  color?: string;
  position?: number;
  category?: Status["category"];
  slaDays?: number;
}

export interface CreateServiceTokenInput {
  name: string;
  projectId?: string;
  permissions?: string[];
  createdBy?: string;
  expiresInDays?: number;
}

export interface RegisterWebhookInput {
  url: string;
  projectId?: string;
  events?: string[];
  secret?: string;
}

export const workspaceService = {
  /**
   * Sincroniza e hidrata o workspace a partir do Supabase
   */
  async getWorkspaceAsync() {
    try {
      const { data, error } = await supabase
        .from("medtask_workspaces")
        .select("*")
        .eq("id", "ws-medhit-001")
        .single();

      if (!error && data && Array.isArray(data.areas) && data.areas.length > 0) {
        store.workspace.areas = data.areas;
        if (data.name) store.workspace.name = data.name;
        if (data.settings) store.workspace.settings = data.settings;
        return store.workspace;
      }

      // Se a tabela estiver vazia, persiste o seed inicial no Supabase
      await this.persistWorkspaceState();
    } catch (e) {
      console.error("[workspaceService] Erro ao sincronizar workspace do Supabase:", e);
    }
    return store.workspace;
  },

  /**
   * Persiste as áreas e projetos atuais do workspace no Supabase
   */
  async persistWorkspaceState() {
    try {
      const payload = {
        id: "ws-medhit-001",
        name: store.workspace.name || "MedHit",
        slug: store.workspace.slug || "medhit",
        settings: store.workspace.settings || {},
        areas: store.workspace.areas,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("medtask_workspaces")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        console.error("[workspaceService] Falha ao persistir medtask_workspaces:", error);
      }
    } catch (err) {
      console.error("[workspaceService] Exceção ao persistir no Supabase:", err);
    }
  },

  /**
   * Localiza um projeto em qualquer área do workspace
   */
  findProject(projectId: string): { project: Project; area: Area } | null {
    for (const area of store.workspace.areas) {
      const project = area.projects.find((p) => p.id === projectId || p.slug === projectId);
      if (project) {
        return { project, area };
      }
    }
    return null;
  },

  /**
   * P0: Cria uma nova coluna/status em um projeto
   */
  async createStatus(input: CreateStatusInput): Promise<Status | null> {
    const found = this.findProject(input.projectId);
    if (!found) return null;

    const { project } = found;
    const newStatusId = `st-${project.id}-${Date.now().toString().slice(-6)}`;
    const position = input.position ?? (project.statuses.length + 1) * 1000;

    const newStatus: Status = {
      id: newStatusId,
      workspaceId: store.workspace.id,
      projectId: project.id,
      name: input.name,
      color: input.color || "#38bdf8",
      position,
      category: input.category || "in_progress",
      slaDays: input.slaDays,
    };

    project.statuses.push(newStatus);
    project.statuses.sort((a, b) => a.position - b.position);

    await this.persistWorkspaceState();
    return newStatus;
  },

  /**
   * P0: Atualiza ou renomeia/reordena um status existente
   */
  async updateStatus(input: UpdateStatusInput): Promise<Status | null> {
    const found = this.findProject(input.projectId);
    if (!found) return null;

    const { project } = found;
    const status = project.statuses.find((s) => s.id === input.statusId);
    if (!status) return null;

    if (input.name !== undefined) status.name = input.name;
    if (input.color !== undefined) status.color = input.color;
    if (input.position !== undefined) status.position = input.position;
    if (input.category !== undefined) status.category = input.category;
    if (input.slaDays !== undefined) status.slaDays = input.slaDays;

    project.statuses.sort((a, b) => a.position - b.position);

    await this.persistWorkspaceState();
    return status;
  },

  /**
   * P0: Exclui um status e opcionalmente reatribui cards para outra coluna
   */
  async deleteStatus(
    projectId: string,
    statusId: string,
    targetStatusIdForTasks?: string
  ): Promise<{ success: boolean; reassignedCount: number }> {
    const found = this.findProject(projectId);
    if (!found) return { success: false, reassignedCount: 0 };

    const { project } = found;
    const idx = project.statuses.findIndex((s) => s.id === statusId);
    if (idx === -1) return { success: false, reassignedCount: 0 };

    project.statuses.splice(idx, 1);
    await this.persistWorkspaceState();

    let reassignedCount = 0;
    if (targetStatusIdForTasks) {
      // Reatribui cards em memória
      for (const t of store.tasks) {
        if (t.projectId === project.id && t.statusId === statusId) {
          t.statusId = targetStatusIdForTasks;
          t.statusChangedAt = new Date().toISOString();
          reassignedCount++;
        }
      }
      // Reatribui cards no Supabase
      await supabase
        .from("medtask_tasks")
        .update({ status_id: targetStatusIdForTasks, status_changed_at: new Date().toISOString() })
        .eq("project_id", project.id)
        .eq("status_id", statusId);
    }

    return { success: true, reassignedCount };
  },

  /**
   * P0: Cria um campo personalizado no projeto
   */
  async createCustomField(
    projectId: string,
    field: { name: string; key: string; type: CustomFieldDefinition["type"]; options?: string[]; description?: string }
  ): Promise<CustomFieldDefinition | null> {
    const found = this.findProject(projectId);
    if (!found) return null;

    const { project } = found;
    if (!project.customFieldDefinitions) {
      project.customFieldDefinitions = [];
    }

    const newField: CustomFieldDefinition = {
      id: `cf-${project.id}-${field.key}`,
      projectId: project.id,
      name: field.name,
      key: field.key,
      type: field.type,
      options: field.options,
      description: field.description,
    };

    project.customFieldDefinitions = project.customFieldDefinitions.filter((f) => f.key !== field.key);
    project.customFieldDefinitions.push(newField);

    await this.persistWorkspaceState();
    return newField;
  },

  /**
   * P0: Criação e gestão de tokens de serviço com escopo restrito
   */
  async createServiceToken(input: CreateServiceTokenInput) {
    const cleanName = input.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const randomHex = Math.random().toString(36).substring(2, 12);
    const token = `mh_svc_${cleanName}_${randomHex}`;
    const id = `tok-${Date.now()}`;

    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 86400000).toISOString()
      : null;

    const record = {
      id,
      token,
      name: input.name,
      project_id: input.projectId || null,
      permissions: input.permissions || ["read", "write"],
      created_by: input.createdBy || "system",
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    };

    try {
      await supabase.from("medtask_service_tokens").insert(record);
    } catch (e) {
      console.error("[workspaceService] Erro ao gravar service token:", e);
    }

    return record;
  },

  async listServiceTokens() {
    try {
      const { data, error } = await supabase
        .from("medtask_service_tokens")
        .select("id, name, project_id, permissions, created_by, created_at, expires_at")
        .order("created_at", { ascending: false });

      if (!error && data) return data;
    } catch (e) {
      console.error("[workspaceService] Erro ao listar tokens:", e);
    }
    return [];
  },

  async revokeServiceToken(tokenId: string) {
    try {
      const { error } = await supabase.from("medtask_service_tokens").delete().eq("id", tokenId);
      return !error;
    } catch {
      return false;
    }
  },

  async validateServiceToken(token: string) {
    try {
      const { data, error } = await supabase
        .from("medtask_service_tokens")
        .select("*")
        .eq("token", token)
        .single();

      if (!error && data) {
        if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
          return null; // Expirado
        }
        return data;
      }
    } catch {
      return null;
    }
    return null;
  },

  /**
   * P1: Webhooks de Saída (Outbound Webhooks)
   */
  async registerWebhook(input: RegisterWebhookInput) {
    const id = `wh-${Date.now()}`;
    const record = {
      id,
      workspace_id: "ws-medhit-001",
      project_id: input.projectId || null,
      url: input.url,
      events: input.events || ["card.moved", "card.created", "card.updated"],
      secret: input.secret || `whsec_${Math.random().toString(36).slice(2, 14)}`,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from("medtask_webhooks").insert(record);
    } catch (e) {
      console.error("[workspaceService] Erro ao cadastrar webhook:", e);
    }
    return record;
  },

  async listWebhooks() {
    try {
      const { data, error } = await supabase
        .from("medtask_webhooks")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) return data;
    } catch {
      return [];
    }
    return [];
  },

  async deleteWebhook(webhookId: string) {
    try {
      const { error } = await supabase.from("medtask_webhooks").delete().eq("id", webhookId);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Dispara webhooks de saída assincronamente quando um card é alterado ou movido
   */
  async dispatchOutboundWebhooks(event: string, card: any, extraData: Record<string, any> = {}) {
    try {
      const { data: webhooks } = await supabase
        .from("medtask_webhooks")
        .select("*")
        .eq("is_active", true);

      if (!webhooks || webhooks.length === 0) return;

      const payload = {
        event,
        timestamp: new Date().toISOString(),
        card: {
          id: card.id,
          title: card.title,
          projectId: card.projectId,
          statusId: card.statusId,
          statusChangedAt: card.statusChangedAt,
          externalId: card.externalId,
          customFields: card.customFields,
          priority: card.priority,
          assigneeIds: card.assigneeIds,
          ...extraData,
        },
      };

      for (const wh of webhooks) {
        // Se o webhook é restrito a um projeto e o card é de outro, ignora
        if (wh.project_id && wh.project_id !== card.projectId) continue;
        // Se o webhook não escuta este evento, ignora
        if (Array.isArray(wh.events) && !wh.events.includes(event) && !wh.events.includes("*")) continue;

        fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-MedHit-Event": event,
            "X-MedHit-Secret": wh.secret || "",
          },
          body: JSON.stringify(payload),
        }).catch((err) => console.warn(`[Webhook] Falha ao enviar para ${wh.url}:`, err.message));
      }
    } catch (err) {
      console.warn("[Webhook] Falha no despachante:", err);
    }
  },
};
