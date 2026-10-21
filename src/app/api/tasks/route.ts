import { NextResponse } from "next/server";
import { tasksService } from "@/server/services/tasks.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    const tasks = await tasksService.getAllTasksAsync(projectId);
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao listar tarefas", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.projectId || !body.statusId) {
      return NextResponse.json(
        { error: "Os campos 'title', 'projectId' e 'statusId' são obrigatórios." },
        { status: 400 }
      );
    }

    const newTask = tasksService.createTask(body);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao criar tarefa", details: String(error) },
      { status: 500 }
    );
  }
}
