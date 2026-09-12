import ForgotPasswordClient from "./ForgotPasswordClient";

import { SITE } from "@/lib/site";

export const metadata = {
  title: `Recupera password | ${SITE.name}`,
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
