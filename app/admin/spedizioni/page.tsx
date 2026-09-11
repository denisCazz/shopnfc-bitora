import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getShippingSettings } from "@/app/admin/actions/shipping";
import ShippingAdminClient from "./ShippingAdminClient";

export const metadata = { title: "Tariffe Spedizione | Admin" };

export default async function AdminSpedizioniPage() {
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/admin");

  const config = await getShippingSettings();

  return <ShippingAdminClient initialConfig={config} />;
}
