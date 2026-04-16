import { cookies } from "next/headers";
import { verifyAccessToken } from "@/src/infrastructure/auth/jwt";
import { prisma } from "@/src/infrastructure/orm/prisma";

export async function requireAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) {
    throw new Error("Unauthorized");
  }
  const payload = await verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true },
  });
  if (!user) {
    throw new Error("Unauthorized");
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

export async function requireAdminUser() {
  const user = await requireAuthUser();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}
