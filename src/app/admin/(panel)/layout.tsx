import { redirect } from "next/navigation";
import { isSessionAdmin } from "@/lib/admin-auth";
import { AdminShell } from "./admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isSessionAdmin())) {
    redirect("/admin/login");
  }
  return <AdminShell>{children}</AdminShell>;
}
