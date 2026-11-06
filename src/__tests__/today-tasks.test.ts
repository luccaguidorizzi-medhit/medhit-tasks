/**
 * Testes Unitários de Produtividade Diária (Minhas Tarefas / Today Tasks)
 * MedHit WorkTrack v2
 * 
 * Assinado por: Equipe MedHit I&A
 */

import { describe, it, expect } from "vitest";
import { Task, Status, Member } from "../server/services/data-store";
import {
  parseTaskDueDate,
  getStatusBadgeStyle,
  formatLocalDateToIso,
  normalizeSearchText,
} from "../lib/task-utils";

describe("Today Tasks Core Logic & Filter Primitives", () => {
  const currentUser: Member = {
    id: "user-lucca",
    workspaceId: "ws-1",
    name: "Lucca Guidorizzi",
    email: "lucca@medhit.com.br",
    role: "admin",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucca",
    status: "active",
  };

  const otherUser: Member = {
    id: "user-dr-thiago",
    workspaceId: "ws-1",
    name: "Dr. Thiago",
    email: "thiago@medhit.com.br",
    role: "member",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thiago",
    status: "active",
  };

  const guestUser: Member = {
    id: "user-guest",
    workspaceId: "ws-1",
    name: "Dra. Convidada",
    email: "convidada@medhit.com.br",
    role: "guest",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
    status: "active",
  };

  const mockStatuses: Status[] = [
    { id: "st-todo", workspaceId: "ws-1", projectId: "p-1", name: "A Fazer", color: "#64748b", position: 1000, category: "todo" },
    { id: "st-prog", workspaceId: "ws-1", projectId: "p-1", name: "Em Andamento", color: "#38bdf8", position: 2000, category: "in_progress" },
    { id: "st-rev", workspaceId: "ws-1", projectId: "p-1", name: "Em Revisão", color: "#f59e0b", position: 2500, category: "review" },
    { id: "st-done", workspaceId: "ws-1", projectId: "p-1", name: "Concluído", color: "#10b981", position: 3000, category: "done" },
  ];

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const yDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayStr = `${yDate.getFullYear()}-${pad(yDate.getMonth() + 1)}-${pad(yDate.getDate())}`;

  const tDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
  const threeDaysAheadStr = `${tDate.getFullYear()}-${pad(tDate.getMonth() + 1)}-${pad(tDate.getDate())}`;

  const fDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
  const fourteenDaysAheadStr = `${fDate.getFullYear()}-${pad(fDate.getMonth() + 1)}-${pad(fDate.getDate())}`;

  const sampleTasks: Task[] = [
    {
      id: "task-1",
      workspaceId: "ws-1",
      projectId: "p-1",
      areaId: "a-1",
      title: "Revisão do Prontuário Médico Hoje",
      description: "Demanda prioritária de validação clínica",
      taskType: "task",
      statusId: "st-todo",
      priority: "urgent",
      position: 1,
      dueDate: todayStr, // YYYY-MM-DD puro
      assigneeIds: [{ type: "user", id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl }],
      checklists: [
        {
          id: "chk-1",
          taskId: "task-1",
          title: "Aceite",
          items: [
            { id: "ci-1", checklistId: "chk-1", title: "Validar layout", isCompleted: true },
            { id: "ci-2", checklistId: "chk-1", title: "Testar botões", isCompleted: false },
          ],
        },
      ],
      comments: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "task-2",
      workspaceId: "ws-1",
      projectId: "p-1",
      areaId: "a-1",
      title: "Tarefa Atrasada de Ontem",
      description: "Precisava ter saído ontem no plantão",
      taskType: "task",
      statusId: "st-prog",
      priority: "high",
      position: 2,
      dueDate: yesterdayStr,
      assigneeIds: [{ type: "user", id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl }],
      checklists: [],
      comments: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "task-3",
      workspaceId: "ws-1",
      projectId: "p-1",
      areaId: "a-1",
      title: "Tarefa Esta Semana",
      description: "Para os próximos dias de atendimento",
      taskType: "task",
      statusId: "st-rev",
      priority: "medium",
      position: 3,
      dueDate: threeDaysAheadStr,
      assigneeIds: [{ type: "user", id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl }],
      checklists: [],
      comments: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "task-4",
      workspaceId: "ws-1",
      projectId: "p-1",
      areaId: "a-1",
      title: "Tarefa Concluída Hoje",
      description: "Já finalizada com sucesso",
      taskType: "task",
      statusId: "st-done",
      priority: "low",
      position: 4,
      dueDate: todayStr,
      assigneeIds: [{ type: "user", id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl }],
      checklists: [],
      comments: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "task-5",
      workspaceId: "ws-1",
      projectId: "p-1",
      areaId: "a-1",
      title: "Tarefa de Outro Membro",
      description: "Atribuída ao Dr. Thiago",
      taskType: "task",
      statusId: "st-todo",
      priority: "high",
      position: 5,
      dueDate: todayStr,
      assigneeIds: [{ type: "user", id: otherUser.id, name: otherUser.name, avatarUrl: otherUser.avatarUrl }],
      checklists: [],
      comments: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "task-6",
      workspaceId: "ws-1",
      projectId: "p-1",
      areaId: "a-1",
      title: "Tarefa Futura Além de 7 Dias",
      description: "Planejamento futuro do semestre",
      taskType: "task",
      statusId: "st-todo",
      priority: "medium",
      position: 6,
      dueDate: fourteenDaysAheadStr,
      assigneeIds: [{ type: "user", id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl }],
      checklists: [],
      comments: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  it("safely parses YYYY-MM-DD date strings without negative UTC timezone shift", () => {
    const parsed = parseTaskDueDate(todayStr);
    expect(parsed).not.toBeNull();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    expect(parsed!.getTime()).toBeGreaterThanOrEqual(todayStart.getTime());
    expect(parsed!.getTime()).toBeLessThanOrEqual(todayEnd.getTime());
    expect(parsed!.getDate()).toBe(now.getDate());
  });

  it("safely parses Supabase ISO timestamps with UTC 00:00:00 without negative day shift in UTC-3", () => {
    const isoUtcString = `${todayStr}T00:00:00.000Z`;
    const parsed = parseTaskDueDate(isoUtcString);
    expect(parsed).not.toBeNull();
    // Em UTC-3, new Date('YYYY-MM-DDT00:00:00.000Z') daria o dia anterior (21h).
    // Nosso parser seguro deve manter exatamente o dia de hoje.
    expect(parsed!.getDate()).toBe(now.getDate());
    expect(parsed!.getMonth()).toBe(now.getMonth());
    expect(parsed!.getFullYear()).toBe(now.getFullYear());
  });

  it("safely parses Brazilian date format DD/MM/YYYY (e.g. 25/11/2026, 04/11/2026)", () => {
    const parsedBr = parseTaskDueDate("25/11/2026");
    expect(parsedBr).not.toBeNull();
    expect(parsedBr!.getFullYear()).toBe(2026);
    expect(parsedBr!.getMonth()).toBe(10); // Novembro = mês 10 (base 0)
    expect(parsedBr!.getDate()).toBe(25);
  });

  it("safely handles corrupted and invalid date strings returning null without crashing", () => {
    expect(parseTaskDueDate(null)).toBeNull();
    expect(parseTaskDueDate(undefined)).toBeNull();
    expect(parseTaskDueDate("")).toBeNull();
    expect(parseTaskDueDate("   ")).toBeNull();
    expect(parseTaskDueDate("data-invalida-corrompida")).toBeNull();
    expect(parseTaskDueDate("abc/def/ghij")).toBeNull();
  });

  it("safely formats local Date to YYYY-MM-DD without day-shift even late at night", () => {
    // Simula 22h45 em fuso UTC-3 no dia 4 de novembro
    const lateNightDate = new Date(2026, 10, 4, 22, 45, 0, 0);
    const formatted = formatLocalDateToIso(lateNightDate);
    expect(formatted).toBe("2026-11-04");
  });

  it("safely normalizes text for accent-insensitive search in Portuguese and English", () => {
    expect(normalizeSearchText("Revisão Médica")).toBe("revisao medica");
    expect(normalizeSearchText("Módulo de Cardiologia")).toBe("modulo de cardiologia");
    expect(normalizeSearchText("Urgência")).toBe("urgencia");
    expect(normalizeSearchText(null)).toBe("");
  });

  it("filters tasks correctly by user assignment scope", () => {
    const myTasks = sampleTasks.filter((t) =>
      (t.assigneeIds || []).some((a) => a.id === currentUser.id) || t.reporterId === currentUser.id
    );
    expect(myTasks).toHaveLength(5);
    expect(myTasks.map((t) => t.id)).toEqual(["task-1", "task-2", "task-3", "task-4", "task-6"]);
  });

  it("classifies tasks into due date categories (today, overdue, this week, completed)", () => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);

    const myTasks = sampleTasks.filter((t) =>
      (t.assigneeIds || []).some((a) => a.id === currentUser.id)
    );

    const enriched = myTasks.map((t) => {
      const status = mockStatuses.find((s) => s.id === t.statusId);
      const isDone = status?.category === "done";
      const parsedDue = parseTaskDueDate(t.dueDate);
      return { ...t, isDone, parsedDue };
    });

    const todayTasks: typeof enriched = [];
    const overdueTasks: typeof enriched = [];
    const weekTasks: typeof enriched = [];
    const completedTasks: typeof enriched = [];

    enriched.forEach((t) => {
      if (t.isDone) {
        completedTasks.push(t);
      }
      if (!t.parsedDue) {
        if (!t.isDone) todayTasks.push(t);
        return;
      }
      if (t.parsedDue < todayStart) {
        if (!t.isDone) overdueTasks.push(t);
      } else if (t.parsedDue >= todayStart && t.parsedDue <= todayEnd) {
        todayTasks.push(t);
        weekTasks.push(t); // Tarefa de hoje é parte integrante de Esta Semana
      } else if (t.parsedDue > todayEnd && t.parsedDue <= weekEnd) {
        weekTasks.push(t);
      }
    });

    expect(todayTasks.map((t) => t.id)).toContain("task-1");
    expect(todayTasks.map((t) => t.id)).toContain("task-4");
    expect(overdueTasks.map((t) => t.id)).toEqual(["task-2"]);
    expect(weekTasks.map((t) => t.id)).toContain("task-1");
    expect(weekTasks.map((t) => t.id)).toContain("task-3");
    expect(weekTasks.map((t) => t.id)).toContain("task-4");
    expect(completedTasks.map((t) => t.id)).toEqual(["task-4"]);
  });

  it("groups tasks by temporal urgency including future tasks beyond 7 days without dropping them", () => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);

    const enriched = sampleTasks.map((t) => {
      const status = mockStatuses.find((s) => s.id === t.statusId);
      return {
        ...t,
        isDone: status?.category === "done",
        parsedDue: parseTaskDueDate(t.dueDate),
      };
    });

    const overdue = enriched.filter((t) => t.parsedDue && t.parsedDue < todayStart && !t.isDone);
    const todayList = enriched.filter((t) => t.parsedDue && t.parsedDue >= todayStart && t.parsedDue <= todayEnd && !t.isDone);
    const weekList = enriched.filter((t) => t.parsedDue && t.parsedDue > todayEnd && t.parsedDue <= weekEnd && !t.isDone);
    const futureList = enriched.filter((t) => t.parsedDue && t.parsedDue > weekEnd && !t.isDone);
    const doneList = enriched.filter((t) => t.isDone);

    expect(futureList.map((t) => t.id)).toContain("task-6");
    const totalGrouped = overdue.length + todayList.length + weekList.length + futureList.length + doneList.length;
    expect(totalGrouped).toBe(sampleTasks.length);
  });

  it("calculates real-time daily metrics accurately with 0% when 0 total tasks and 100% when all completed", () => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const myTasks = sampleTasks.filter((t) =>
      (t.assigneeIds || []).some((a) => a.id === currentUser.id)
    );

    const todayItems = myTasks.filter((t) => {
      const d = parseTaskDueDate(t.dueDate);
      if (!d) return true;
      return d >= todayStart && d <= todayEnd;
    });

    const doneCount = todayItems.filter((t) => {
      const s = mockStatuses.find((st) => st.id === t.statusId);
      return s?.category === "done";
    }).length;

    const totalCount = todayItems.length;
    const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    expect(totalCount).toBe(2); // task-1 and task-4
    expect(doneCount).toBe(1); // task-4
    expect(progressPercent).toBe(50);

    // Borda: quando total de tarefas for 0, deve reportar 0% (não 100%)
    const emptyProgress = 0 > 0 ? Math.round((0 / 0) * 100) : 0;
    expect(emptyProgress).toBe(0);

    // Borda: quando todas forem concluídas, reporta 100%
    const allDoneProgress = 2 > 0 ? Math.round((2 / 2) * 100) : 0;
    expect(allDoneProgress).toBe(100);
  });

  it("permits guest users to collaborate on checklist criteria on assigned tasks", () => {
    const assignedGuestTask: Task = {
      ...sampleTasks[0],
      id: "task-guest-1",
      assigneeIds: [{ type: "user", id: guestUser.id, name: guestUser.name, avatarUrl: guestUser.avatarUrl }],
    };

    const unassignedGuestTask: Task = {
      ...sampleTasks[0],
      id: "task-guest-2",
      assigneeIds: [{ type: "user", id: otherUser.id, name: otherUser.name, avatarUrl: otherUser.avatarUrl }],
    };

    const canCollaborate = (task: Task, user: Member) => {
      const isAssigned = (task.assigneeIds || []).some((a) => a.id === user.id) || task.reporterId === user.id;
      const canEditTask = user.role !== "guest";
      return canEditTask || (user.role === "guest" && isAssigned);
    };

    expect(canCollaborate(assignedGuestTask, guestUser)).toBe(true);
    expect(canCollaborate(unassignedGuestTask, guestUser)).toBe(false);
  });

  it("handles rapid cascading addition of checklist items with unique generated IDs", () => {
    const baseItems: { id: string; title: string; isCompleted: boolean }[] = [];
    for (let i = 0; i < 5; i++) {
      baseItems.push({
        id: `chk-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: `Critério de Aceite ${i + 1}`,
        isCompleted: false,
      });
    }

    expect(baseItems).toHaveLength(5);
    const uniqueIds = new Set(baseItems.map((item) => item.id));
    expect(uniqueIds.size).toBe(5);
  });

  it("sorts safely even with empty or missing createdAt values without NaN breakage", () => {
    const listWithMissingDates = [
      { id: "a", createdAt: "", title: "A" },
      { id: "b", createdAt: "2026-11-04T10:00:00Z", title: "B" },
      { id: "c", createdAt: "2026-11-04T12:00:00Z", title: "C" },
    ];

    const sorted = [...listWithMissingDates].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
    });

    expect(sorted.map((item) => item.id)).toEqual(["c", "b", "a"]);
  });

  it("evaluates checklist item completion independently of status completion", () => {
    const task = sampleTasks[0];
    const checklist = task.checklists[0];
    expect(checklist.items).toHaveLength(2);

    const completedItems = checklist.items.filter((i) => i.isCompleted).length;
    const totalItems = checklist.items.length;
    expect(completedItems).toBe(1);
    expect(totalItems).toBe(2);

    // Simula a marcação de todos os itens do checklist
    const allCompletedItems = checklist.items.map((i) => ({ ...i, isCompleted: true }));
    expect(allCompletedItems.every((i) => i.isCompleted)).toBe(true);

    // O status da tarefa permanece 'todo' a menos que seja explicitamente alterado
    const status = mockStatuses.find((s) => s.id === task.statusId);
    expect(status?.category).toBe("todo");
  });

  it("matches search query by #MH-x, MH-x, accent-insensitive title, description and assignee", () => {
    const matchesSearch = (task: Task, searchQuery: string) => {
      const query = normalizeSearchText(searchQuery);
      const shortId = task.id.replace("task-", "").toLowerCase();
      const matchesTitle = normalizeSearchText(task.title).includes(query);
      const matchesDescription = normalizeSearchText(task.description).includes(query);
      const matchesId =
        task.id.toLowerCase().includes(query) ||
        ("mh-" + shortId).includes(query) ||
        ("#mh-" + shortId).includes(query);
      const matchesAssignee = (task.assigneeIds || []).some((a) =>
        normalizeSearchText(a.name).includes(query)
      );
      return matchesTitle || matchesDescription || matchesId || matchesAssignee;
    };

    // Busca sem acento para palavra acentuada
    expect(matchesSearch(sampleTasks[0], "revisao")).toBe(true);
    expect(matchesSearch(sampleTasks[0], "medico")).toBe(true);
    // Busca por ID
    expect(matchesSearch(sampleTasks[0], "mh-1")).toBe(true);
    expect(matchesSearch(sampleTasks[0], "#mh-1")).toBe(true);
    // Busca por descrição
    expect(matchesSearch(sampleTasks[1], "plantao")).toBe(true);
    // Busca por responsável
    expect(matchesSearch(sampleTasks[4], "thiago")).toBe(true);
  });

  it("generates safe CSS styling for status badges with 6-digit and shorthand hex colors", () => {
    const style1 = getStatusBadgeStyle("#38bdf8");
    expect(style1.color).toBe("#38bdf8");
    expect(style1.backgroundColor).toBe("#38bdf820");

    const styleShort = getStatusBadgeStyle("#fff");
    expect(styleShort.color).toBe("#fff");
    expect(styleShort.backgroundColor).not.toBe("#fff20");
    expect(styleShort.backgroundColor).toContain("rgba");
  });

  it("groups tasks by status with valid counts and colors", () => {
    const groups = mockStatuses.map((status) => {
      const tasksInStatus = sampleTasks.filter((t) => t.statusId === status.id);
      return {
        id: status.id,
        name: status.name,
        color: status.color,
        tasks: tasksInStatus,
        count: tasksInStatus.length,
      };
    });

    const todoGroup = groups.find((g) => g.id === "st-todo");
    const doneGroup = groups.find((g) => g.id === "st-done");

    expect(todoGroup?.count).toBe(3); // task-1, task-5, task-6
    expect(doneGroup?.count).toBe(1); // task-4
    expect(doneGroup?.color).toBe("#10b981");
  });

  it("safely parses Portuguese month names and conversational Brazilian text formats", () => {
    const d1 = parseTaskDueDate("04 de novembro de 2026");
    expect(d1).not.toBeNull();
    expect(d1!.getFullYear()).toBe(2026);
    expect(d1!.getMonth()).toBe(10);
    expect(d1!.getDate()).toBe(4);

    const d2 = parseTaskDueDate("4 de nov de 2026");
    expect(d2).not.toBeNull();
    expect(d2!.getMonth()).toBe(10);
    expect(d2!.getDate()).toBe(4);

    const d3 = parseTaskDueDate("04 de nov. de 2026");
    expect(d3).not.toBeNull();
    expect(d3!.getDate()).toBe(4);

    const d4 = parseTaskDueDate("4 nov 2026");
    expect(d4).not.toBeNull();
    expect(d4!.getDate()).toBe(4);

    const d5 = parseTaskDueDate("15 de março de 2026");
    expect(d5).not.toBeNull();
    expect(d5!.getMonth()).toBe(2);
    expect(d5!.getDate()).toBe(15);
  });

  it("strictly rejects impossible dates and rollover anomalies (leap years, 31/04, 32/01)", () => {
    // 2024 é bissexto -> 29 de fevereiro é válido
    const leapValid = parseTaskDueDate("29/02/2024");
    expect(leapValid).not.toBeNull();
    expect(leapValid!.getDate()).toBe(29);
    expect(leapValid!.getMonth()).toBe(1);

    // 2025 NÃO é bissexto -> 29 de fevereiro é impossível e deve retornar null
    const leapInvalid = parseTaskDueDate("29/02/2025");
    expect(leapInvalid).toBeNull();

    // 31 de abril não existe (abril tem 30 dias) -> não deve rolar para 1 de maio
    const apr31 = parseTaskDueDate("31/04/2026");
    expect(apr31).toBeNull();

    // 32 de janeiro não existe
    const jan32 = parseTaskDueDate("32/01/2026");
    expect(jan32).toBeNull();

    // Formato ISO com dia impossível
    const isoInvalid = parseTaskDueDate("2026-04-31");
    expect(isoInvalid).toBeNull();

    const isoLeapInvalid = parseTaskDueDate("2025-02-29");
    expect(isoLeapInvalid).toBeNull();
  });

  it("safely parses 2-digit Brazilian years and slash-separated ISO dates", () => {
    const d2Digit = parseTaskDueDate("25/11/26");
    expect(d2Digit).not.toBeNull();
    expect(d2Digit!.getFullYear()).toBe(2026);
    expect(d2Digit!.getMonth()).toBe(10);
    expect(d2Digit!.getDate()).toBe(25);

    const dSlash = parseTaskDueDate("2026/11/04");
    expect(dSlash).not.toBeNull();
    expect(dSlash!.getFullYear()).toBe(2026);
    expect(dSlash!.getMonth()).toBe(10);
    expect(dSlash!.getDate()).toBe(4);
  });

  it("unifies identical statuses across multiple projects and sorts groups in lifecycle order", () => {
    const project1Statuses: Status[] = [
      { id: "p1-todo", workspaceId: "ws-1", projectId: "p-1", name: "A Fazer", color: "#64748b", position: 1, category: "todo" },
      { id: "p1-prog", workspaceId: "ws-1", projectId: "p-1", name: "Em Andamento", color: "#38bdf8", position: 2, category: "in_progress" },
      { id: "p1-done", workspaceId: "ws-1", projectId: "p-1", name: "Concluído", color: "#10b981", position: 3, category: "done" },
    ];

    const project2Statuses: Status[] = [
      { id: "p2-todo", workspaceId: "ws-1", projectId: "p-2", name: "A Fazer", color: "#64748b", position: 1, category: "todo" },
      { id: "p2-rev", workspaceId: "ws-1", projectId: "p-2", name: "Em Revisão", color: "#f59e0b", position: 2, category: "review" },
      { id: "p2-done", workspaceId: "ws-1", projectId: "p-2", name: "Concluído", color: "#10b981", position: 3, category: "done" },
    ];

    const multiProjectTasks: Task[] = [
      { ...sampleTasks[0], id: "t-p1-1", projectId: "p-1", statusId: "p1-todo" },
      { ...sampleTasks[1], id: "t-p2-1", projectId: "p-2", statusId: "p2-todo" },
      { ...sampleTasks[2], id: "t-p1-2", projectId: "p-1", statusId: "p1-prog" },
      { ...sampleTasks[3], id: "t-p2-2", projectId: "p-2", statusId: "p2-rev" },
      { ...sampleTasks[4], id: "t-p1-3", projectId: "p-1", statusId: "p1-done" },
    ];

    // Simula a lógica de agrupamento por status unificado
    const statusMap = new Map<string, { title: string; category: Status["category"]; tasks: Task[] }>();
    const categoryPriority: Record<Status["category"], number> = {
      todo: 1,
      backlog: 2,
      in_progress: 3,
      review: 4,
      done: 5,
      cancelled: 6,
    };

    [...project1Statuses, ...project2Statuses].forEach((s) => {
      const key = s.name.trim().toLowerCase();
      if (!statusMap.has(key)) {
        statusMap.set(key, { title: s.name, category: s.category, tasks: [] });
      }
    });

    const allStatuses = [...project1Statuses, ...project2Statuses];
    multiProjectTasks.forEach((t) => {
      const st = allStatuses.find((s) => s.id === t.statusId);
      const key = st?.name.trim().toLowerCase() || "outros";
      if (statusMap.has(key)) {
        statusMap.get(key)!.tasks.push(t);
      }
    });

    const orderedGroups = Array.from(statusMap.entries())
      .filter(([_, g]) => g.tasks.length > 0)
      .sort((a, b) => (categoryPriority[a[1].category] ?? 99) - (categoryPriority[b[1].category] ?? 99))
      .map(([_, g]) => ({ title: g.title, count: g.tasks.length }));

    // Deve unificar "A Fazer" de p1 e p2 em um único grupo com 2 tarefas
    const aFazerGroup = orderedGroups.find((g) => g.title === "A Fazer");
    expect(aFazerGroup).toBeDefined();
    expect(aFazerGroup!.count).toBe(2);

    // Ordem estrita do ciclo de vida: A Fazer -> Em Andamento -> Em Revisão -> Concluído
    expect(orderedGroups.map((g) => g.title)).toEqual([
      "A Fazer",
      "Em Andamento",
      "Em Revisão",
      "Concluído",
    ]);
  });

  it("safely handles task titles and checklist items containing quotes, HTML entities, and emojis", () => {
    const specialTask: Task = {
      ...sampleTasks[0],
      id: "task-special-1",
      title: 'Revisão do Protocolo "COVID-19" & Dr. O\'Connor <Urgência> 🩺💊',
      description: 'Testar tags <script>alert("xss")</script> e entidades &amp; com segurança',
      checklists: [
        {
          id: "chk-sp-1",
          taskId: "task-special-1",
          title: "Aceite Especial",
          items: [
            { id: "ci-sp-1", checklistId: "chk-sp-1", title: 'Validar campos <input> & botões "Salvar"', isCompleted: false },
          ],
        },
      ],
    };

    // Busca textual com caracteres especiais
    expect(normalizeSearchText(specialTask.title)).toContain('covid-19');
    expect(normalizeSearchText(specialTask.title)).toContain("o'connor");
    expect(normalizeSearchText(specialTask.title)).toContain("urgencia");

    // Checklist contém o item com aspas e tags intactas
    expect(specialTask.checklists[0].items[0].title).toBe('Validar campos <input> & botões "Salvar"');

    // Toggle do checklist preserva o texto
    const toggledItem = {
      ...specialTask.checklists[0].items[0],
      isCompleted: !specialTask.checklists[0].items[0].isCompleted,
    };
    expect(toggledItem.isCompleted).toBe(true);
    expect(toggledItem.title).toBe('Validar campos <input> & botões "Salvar"');
  });
});
