"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { toggleProductActive, deleteProduct } from "../actions/products";

export default function ProductActions({
  productId,
  active,
  productName,
  currentPage = 1,
}: {
  productId: number;
  active: boolean;
  productName: string;
  currentPage?: number;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleProductActive(productId, !active);
    });
  };

  const handleDelete = () => {
    if (!confirm(`Eliminare "${productName}"? Questa azione è irreversibile.`)) {
      return;
    }
    startTransition(async () => {
      await deleteProduct(productId);
    });
  };

  return (
    <div className={`flex items-center justify-end gap-1 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      <Link
        href={`/admin/products/${productId}?returnPage=${currentPage}`}
        className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
        title="Modifica"
      >
        <Pencil className="w-4 h-4 text-muted" />
      </Link>
      <button
        onClick={handleToggle}
        className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
        title={active ? "Disattiva" : "Attiva"}
      >
        {active ? (
          <ToggleRight className="w-4 h-4 text-green-600" />
        ) : (
          <ToggleLeft className="w-4 h-4 text-muted" />
        )}
      </button>
      <button
        onClick={handleDelete}
        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        title="Elimina"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>
    </div>
  );
}
