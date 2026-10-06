/**
 * MedHit Integrações & Automações
 * Serviço de Telemetria e Auditoria de Eventos para MedHit Tasks.
 * 
 * Registra eventos em memória e sincroniza com localStorage.
 * Fornece API reativa para visualizadores de logs e auditoria.
 * Assinado por: MedHit Integrações & Automações
 */

export type TelemetryLevel = "info" | "warn" | "error" | "success";

export type TelemetryEventType =
  | "project_created"
  | "project_updated"
  | "project_deleted"
  | "task_created"
  | "task_updated"
  | "task_deleted"
  | "task_moved"
  | "view_switched"
  | "team_created"
  | "team_deleted"
  | "client_error"
  | "context_menu_action"
  | "navigation"
  | "approval_decision"
  | "system_reset"
  | "member_action"
  | "rbac_role_switched"
  | "rbac_user_switched"
  | string;

export interface TelemetryLog {
  id: string;
  timestamp: string;
  type: TelemetryEventType;
  level: TelemetryLevel;
  message: string;
  payload?: Record<string, unknown>;
  source?: string;
}

const STORAGE_KEY = "medhit_telemetry_logs_v1";
const MAX_LOGS = 250;

class TelemetryService {
  private logs: TelemetryLog[] = [];
  private listeners: Set<(logs: TelemetryLog[]) => void> = new Set();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === "undefined" || this.initialized) return;
    this.initialized = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.logs = parsed.slice(-MAX_LOGS);
        }
      }
    } catch (err) {
      console.warn("[MedHit] Falha ao recuperar logs do localStorage", err);
    }

    // Registra inicialização de telemetria
    this.track(
      "system_init",
      "Sessão de Telemetria MedHit iniciada com sucesso",
      { userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "ssr" },
      "info",
      "system"
    );
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch (err) {
      console.warn("[MedHit] Erro ao persistir logs de telemetria", err);
    }
  }

  private notify() {
    const snapshot = [...this.logs];
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.error("[MedHit] Erro no listener de telemetria", err);
      }
    });
  }

  /**
   * Registra um evento de telemetria
   */
  public track(
    type: TelemetryEventType,
    message: string,
    payload?: Record<string, unknown>,
    level: TelemetryLevel = "info",
    source: string = "app"
  ): TelemetryLog {
    if (!this.initialized && typeof window !== "undefined") {
      this.init();
    }

    const log: TelemetryLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type,
      level,
      message,
      payload,
      source,
    };

    this.logs.unshift(log); // Mais recentes primeiro

    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS);
    }

    this.persist();
    this.notify();

    // Também emite para o console em desenvolvimento
    if (process.env.NODE_ENV !== "production") {
      const prefix = `[MedHit Telemetry][${level.toUpperCase()}][${type}]`;
      if (level === "error") {
        console.error(prefix, message, payload || "");
      } else if (level === "warn") {
        console.warn(prefix, message, payload || "");
      } else {
        console.log(prefix, message, payload || "");
      }
    }

    return log;
  }

  /**
   * Atalho para registrar erros e exceções não tratadas
   */
  public logError(
    error: unknown,
    context?: { source?: string; payload?: Record<string, unknown> }
  ): TelemetryLog {
    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : typeof error === "string"
        ? error
        : "Erro inesperado do cliente";

    const stack = error instanceof Error ? error.stack : undefined;

    return this.track(
      "client_error",
      errorMessage,
      {
        stack,
        ...(context?.payload || {}),
      },
      "error",
      context?.source || "error_boundary"
    );
  }

  /**
   * Retorna os logs atuais ordenados por data decrescente
   */
  public getLogs(): TelemetryLog[] {
    if (!this.initialized && typeof window !== "undefined") {
      this.init();
    }
    return [...this.logs];
  }

  /**
   * Limpa todos os logs
   */
  public clearLogs() {
    this.logs = [];
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.warn("[MedHit] Falha ao limpar storage", err);
      }
    }
    this.notify();
    this.track("system_reset", "Histórico de logs de auditoria foi redefinido", undefined, "info", "system");
  }

  /**
   * Exporta logs como JSON formatado
   */
  public exportAsJson(): string {
    return JSON.stringify(
      {
        project: "MedHit Tasks",
        architect: "MedHit Integrações & Automações",
        exportedAt: new Date().toISOString(),
        totalLogs: this.logs.length,
        logs: this.logs,
      },
      null,
      2
    );
  }

  /**
   * Assina atualizações de logs em tempo real
   */
  public subscribe(listener: (logs: TelemetryLog[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

// Singleton exportado
export const telemetry = new TelemetryService();
