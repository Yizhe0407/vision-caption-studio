import { cookies } from "next/headers";
import { verifyAccessToken } from "@/src/infrastructure/auth/jwt";

export async function requireAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) {
    throw new Error("Unauthorized");
  }
  return verifyAccessToken(token);
}

export async function requireAdminUser() {
  const user = await requireAuthUser();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}
