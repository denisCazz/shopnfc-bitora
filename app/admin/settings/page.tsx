import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import SettingsClient from "./SettingsClient";
import { getPricingConfig } from "@/lib/pricing-server";

export default async function AdminSettingsPage() {
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/admin");

  const pricing = await getPricingConfig();
  return <SettingsClient initialMarkup={pricing.markup} />;
}
