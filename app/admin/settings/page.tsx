import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import SettingsClient from "./SettingsClient";
import { getPricingConfig } from "@/lib/pricing-server";
import { getPrintConfig } from "@/lib/print-options-server";

export default async function AdminSettingsPage() {
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/admin");

  const [pricing, printConfig] = await Promise.all([
    getPricingConfig(),
    getPrintConfig(),
  ]);
  return (
    <SettingsClient
      initialMarkup={pricing.markup}
      initialPrintPrices={printConfig.prices}
    />
  );
}
