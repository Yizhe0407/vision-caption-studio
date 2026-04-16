import { redirect } from "next/navigation";
import { AdminUsersManagement } from "@/src/components/dashboard/admin-users-management";
import { requireAdminUser } from "@/src/infrastructure/auth/request-auth";

export default async function AdminUsersPage() {
  try {
    await requireAdminUser();
  } catch {
    redirect("/dashboard");
  }

  return <AdminUsersManagement />;
}
