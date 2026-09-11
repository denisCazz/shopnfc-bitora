"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "../actions/users";
import type { UserRole } from "@/lib/types";
import PromoteDealerModal from "./PromoteDealerModal";

const roleColors: Record<UserRole, string> = {
  customer: "bg-stone-100 dark:bg-stone-800 text-muted border-border",
  dealer: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 border-blue-200 dark:border-blue-800",
  admin: "bg-sky-50 dark:bg-sky-950/40 text-accent border-sky-200 dark:border-sky-800",
};

const roleLabels: Record<UserRole, string> = {
  customer: "Cliente",
  dealer: "Rivenditore",
  admin: "Admin",
};

export default function UserRoleSelect({
  userId,
  currentRole,
  email,
  company,
  vatNumber,
  dealerProfileMissing,
}: {
  userId: string;
  currentRole: UserRole;
  email: string;
  company?: string | null;
  vatNumber?: string | null;
  dealerProfileMissing?: boolean;
}) {
  const [role, setRole] = useState(currentRole);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    if (newRole === role) return;

    if (newRole === "dealer") {
      e.target.value = role;
      setShowPromoteModal(true);
      return;
    }

    const label = roleLabels[newRole];
    if (!confirm(`Cambiare il ruolo di questo utente a "${label}"?`)) {
      e.target.value = role;
      return;
    }

    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result?.error) {
        alert(result.error);
        e.target.value = role;
        return;
      }
      setRole(newRole);
    });
  };

  return (
    <>
      <div className="flex flex-col gap-1">
        <select
          value={role}
          onChange={handleChange}
          disabled={isPending || currentRole === "admin"}
          className={`text-xs font-medium px-2 py-1 rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${roleColors[role]}`}
        >
          <option value="customer">Cliente</option>
          <option value="dealer">Rivenditore</option>
          {currentRole === "admin" && <option value="admin">Admin</option>}
        </select>
        {dealerProfileMissing && (
          <button
            type="button"
            onClick={() => setShowPromoteModal(true)}
            className="text-left text-xs text-amber-700 dark:text-amber-400 underline hover:no-underline"
          >
            Completa profilo rivenditore
          </button>
        )}
      </div>

      {showPromoteModal && (
        <PromoteDealerModal
          userId={userId}
          email={email}
          initialCompany={company || ""}
          initialVat={vatNumber || ""}
          onClose={() => setShowPromoteModal(false)}
          onSuccess={() => setRole("dealer")}
        />
      )}
    </>
  );
}
