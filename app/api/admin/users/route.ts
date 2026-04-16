import { NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { requireAdminUser } from "@/src/infrastructure/auth/request-auth";

export const runtime = "nodejs";

function toStatus(error: unknown) {
  if (!(error instanceof Error)) return 400;
  if (error.message === "Unauthorized") return 401;
  if (error.message === "Forbidden") return 403;
  if (error.message === "User not found.") return 404;
  return 400;
}

export async function GET() {
  try {
    await requireAdminUser();
    const users = await container.adminUserController.list();
    return NextResponse.json({ ok: true, users });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: toStatus(error) },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdminUser();
    const payload = await req.json();
    const user = await container.adminUserController.updateRole(payload);
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: toStatus(error) },
    );
  }
}
