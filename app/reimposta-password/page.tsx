import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

import { SITE } from "@/lib/site";

export const metadata = {
  title: `Reimposta password | ${SITE.name}`,
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordClient />
    </Suspense>
  );
}
