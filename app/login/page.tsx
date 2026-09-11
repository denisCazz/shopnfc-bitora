import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getUser();
  if (user) {
    redirect("/");
  }
  return <LoginClient />;
}
