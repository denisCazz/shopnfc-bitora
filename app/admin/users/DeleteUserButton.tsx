"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteUser } from "../actions/users";

export default function DeleteUserButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        title="Elimina utente"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        Elimina
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-red-600">Eliminare {email}?</span>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteUser(userId);
            if (result?.error) {
              alert(result.error);
              setConfirming(false);
            }
          })
        }
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
      >
        {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        Sì
      </button>
      <button
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="px-2 py-1 rounded-lg text-xs border border-border hover:bg-stone-50 dark:hover:bg-stone-800/50"
      >
        No
      </button>
    </div>
  );
}
