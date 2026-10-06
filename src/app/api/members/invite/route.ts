import { NextResponse } from "next/server";
import { emailService } from "@/server/services/email.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, name, role, password, mcpToken, invitedBy = "Lucca Lagana" } = body;

    if (!to || !name) {
      return NextResponse.json({ error: "E-mail e nome são obrigatórios" }, { status: 400 });
    }

    const result = await emailService.sendInviteEmail({
      to,
      name,
      role: role || "member",
      password,
      mcpToken,
      invitedBy,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
