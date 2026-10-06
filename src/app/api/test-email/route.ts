import { NextResponse } from "next/server";
import { emailService } from "@/server/services/email.service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const to = body.to || "lektrozz@gmail.com";
    const name = body.name || "Lektrozz";

    const result = await emailService.sendWelcomeEmail({
      to,
      name,
      loginUrl: "https://medhit-tasks.vercel.app/medhit",
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      recipient: to,
      result,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to") || "lektrozz@gmail.com";
  const name = searchParams.get("name") || "Lektrozz";

  const result = await emailService.sendWelcomeEmail({
    to,
    name,
    loginUrl: "https://medhit-tasks.vercel.app/medhit",
  });

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    recipient: to,
    result,
  });
}
