"use client";

import { useTransition } from "react";
import { verifyUserEmail } from "../actions/users";
import { CheckCircle, Loader2 } from "lucide-react";

export default function VerifyEmailButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => { await verifyUserEmail(userId); })
      }
      disabled={isPending}
      title="Verifica email manualmente"
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <CheckCircle className="w-3 h-3" />
      )}
      Verifica
    </button>
  );
}
