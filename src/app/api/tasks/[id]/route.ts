import { NextResponse } from "next/server";
import { tasksService } from "@/server/services/tasks.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = tasksService.getTaskById(id);
  if (!task) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }
  return NextResponse.json(task);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = tasksService.updateTask(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar tarefa", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = tasksService.deleteTask(id);
  if (!deleted) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
