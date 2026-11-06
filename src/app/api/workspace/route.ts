import { NextResponse } from "next/server";
import { workspaceService } from "@/server/services/workspace.service";
import { store } from "@/server/services/data-store";

export async function GET() {
  try {
    const ws = await workspaceService.getWorkspaceAsync();
    return NextResponse.json({
      success: true,
      workspace: ws,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.areas && Array.isArray(body.areas)) {
      store.workspace.areas = body.areas;
      await workspaceService.persistWorkspaceState();
      return NextResponse.json({ success: true, message: "Workspace sincronizado com sucesso no Supabase" });
    }
    return NextResponse.json({ error: "Campo 'areas' obrigatório" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
