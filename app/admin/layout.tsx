import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AdminShell from "./AdminShell";

export const metadata = {
  title: {
    absolute: "Admin | Shop NFC",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
