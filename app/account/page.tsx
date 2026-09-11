import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getProfile } from "./actions";
import AccountClient from "./AccountClient";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/login?redirect=/account");

  const data = await getProfile();
  if (!data) redirect("/login?redirect=/account");

  return <AccountClient data={data} email={user.email} />;
}
