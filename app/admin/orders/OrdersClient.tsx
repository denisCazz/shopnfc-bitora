"use client";

import { useState, useTransition } from "react";
import {
  Package,
  ChevronDown,
  ChevronUp,
  Truck,
  XCircle,
  FileText,
  ImageIcon,
} from "lucide-react";
import ExportExcelButton from "@/components/admin/ExportExcelButton";
import {
  updateOrderStatus,
  updateTrackingNumber,
  deleteOrder,
} from "@/app/admin/actions/orders";
import { formatOrderNumber } from "@/lib/order-number";

interface OrderItem {
  id: number;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
}

interface Order {
  id: number;
  created_at: string;
  status: string;
  payment_method: string | null;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  discount_code: string | null;
  discount_amount: number;
  total: number;
  shipping_address: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    zip?: string;
    province?: string;
    country?: string;
  } | null;
  billing_address: { email?: string } | null;
  guest_email: string | null;
  user_id: string | null;
  notes: string | null;
  tracking_number: string | null;
  bank_transfer_receipt_url: string | null;
  custom_graphic_url: string | null;
  custom_graphic_original_name: string | null;
  order_items: OrderItem[];
}

interface ProfileInfo {
  email: string;
  first_name: string | null;
  last_name: string | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "In attesa", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  confirmed: { label: "Confermato", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  processing: { label: "In lavorazione", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
  shipped: { label: "Spedito", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  delivered: { label: "Consegnato", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Annullato", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const paymentMethodLabels: Record<string, string> = {
  stripe: "Carta di credito",
  paypal: "PayPal",
  bank_transfer: "Bonifico bancario",
  cod: "Contrassegno",
  satispay: "Satispay",
};

export default function OrdersClient({
  initialOrders,
  profileMap,
}: {
  initialOrders: Order[];
  profileMap: Record<string, ProfileInfo>;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filtered = orders.filter((o) => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    return true;
  });

  function handleStatusChange(orderId: number, newStatus: string) {
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    });
  }

  function handleCancelOrder(orderId: number) {
    startTransition(async () => {
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    });
  }

  function handleTrackingSave(orderId: number, tracking: string) {
    startTransition(async () => {
      await updateTrackingNumber(orderId, tracking);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, tracking_number: tracking } : o
        )
      );
    });
  }

  function getCustomerInfo(order: Order) {
    if (order.user_id && profileMap[order.user_id]) {
      const p = profileMap[order.user_id];
      return {
        name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email,
        email: p.email,
      };
    }
    return {
      name: order.shipping_address?.name || "Ospite",
      email:
        order.guest_email || order.billing_address?.email || "N/A",
    };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ordini</h1>
          <p className="text-sm text-muted mt-1">
            {filtered.length} ordini trovati
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportExcelButton
            href={`/api/admin/export/orders${filterStatus !== "all" ? `?status=${filterStatus}` : ""}`}
            label="Scarica Excel"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="all">Tutti gli stati</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]?.label || s}
            </option>
          ))}
        </select>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted">
            Nessun ordine trovato
          </div>
        )}

        {filtered.map((order) => {
          const customer = getCustomerInfo(order);
          const isExpanded = expandedId === order.id;
          const st = statusLabels[order.status] || {
            label: order.status,
            color: "bg-gray-100 text-gray-800",
          };

          return (
            <div
              key={order.id}
              className="border border-border rounded-xl bg-surface overflow-hidden"
            >
              {/* Summary row */}
              <div className="flex items-center">
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : order.id)
                  }
                  className="flex-1 flex items-center gap-4 px-4 py-3 text-left hover:bg-surface-hover transition-colors min-w-0"
                >
                  <Package className="w-5 h-5 text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 items-center text-sm">
                    <span className="font-semibold">#{formatOrderNumber(order.id)}</span>
                    <span className="truncate">{customer.name}</span>
                    <span className="hidden sm:block text-muted">
                      {new Date(order.created_at).toLocaleDateString("it-IT")}
                    </span>
                    <span className="font-medium">
                      €{order.total.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${st.color}`}
                      >
                        {st.label}
                      </span>
                      {order.custom_graphic_url && (
                        <span
                          title="Grafica allegata"
                          className="inline-flex items-center text-accent"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted" />
                  )}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Annullare l'ordine #${formatOrderNumber(order.id)}? L'operazione ripristinerà le scorte dei prodotti.`)) {
                      handleCancelOrder(order.id);
                    }
                  }}
                  disabled={isPending}
                  title="Annulla ordine"
                  className="flex-shrink-0 px-3 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 transition-colors disabled:opacity-50 border-l border-border"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-border px-4 py-4 space-y-4">
                  {/* Customer + shipping info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-1">Cliente</h4>
                      <p>{customer.name}</p>
                      <p className="text-muted">{customer.email}</p>
                      {order.shipping_address?.phone && (
                        <p className="text-muted">
                          Tel: {order.shipping_address.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">
                        Indirizzo spedizione
                      </h4>
                      {order.shipping_address ? (
                        <>
                          <p>{order.shipping_address.address}</p>
                          <p>
                            {order.shipping_address.zip}{" "}
                            {order.shipping_address.city}{" "}
                            {order.shipping_address.province}
                          </p>
                          <p>{order.shipping_address.country}</p>
                        </>
                      ) : (
                        <p className="text-muted">N/A</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Pagamento</h4>
                      <p>
                        {order.payment_method
                          ? paymentMethodLabels[order.payment_method] ||
                            order.payment_method
                          : order.payment_status.startsWith("stripe:")
                            ? "Stripe"
                            : order.payment_status.startsWith("satispay:")
                              ? "Satispay"
                              : order.payment_status.startsWith("satispay_pending")
                                ? "Satispay (in attesa)"
                                : order.payment_status.startsWith("paypal:")
                                  ? "PayPal"
                                  : order.payment_status}
                      </p>
                      {order.payment_method === "bank_transfer" &&
                        !order.bank_transfer_receipt_url && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Contabile non ancora caricata
                          </p>
                        )}
                      <p className="text-muted">
                        Ordine del{" "}
                        {new Date(order.created_at).toLocaleString("it-IT")}
                      </p>
                      {order.notes && (
                        <p className="mt-1 text-muted italic">
                          Note: {order.notes}
                        </p>
                      )}
                      {order.bank_transfer_receipt_url && (
                        <p className="mt-1">
                          <a
                            href={order.bank_transfer_receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                            Contabile bonifico
                          </a>
                        </p>
                      )}
                      {order.custom_graphic_url ? (
                        <p className="mt-1">
                          <a
                            href={order.custom_graphic_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={order.custom_graphic_original_name || undefined}
                            className="inline-flex items-center gap-1.5 text-accent font-medium hover:underline"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Grafica
                            {order.custom_graphic_original_name
                              ? `: ${order.custom_graphic_original_name}`
                              : ""}
                          </a>
                        </p>
                      ) : (
                        <p className="text-xs text-muted mt-1">Nessuna grafica allegata</p>
                      )}
                    </div>
                  </div>

                  {/* Order items */}
                  {order.order_items.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Articoli
                      </h4>
                      <div className="border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-surface-hover">
                            <tr>
                              <th className="text-left px-3 py-2">SKU</th>
                              <th className="text-left px-3 py-2">
                                Prodotto
                              </th>
                              <th className="text-center px-3 py-2">Qtà</th>
                              <th className="text-right px-3 py-2">
                                Prezzo
                              </th>
                              <th className="text-right px-3 py-2">
                                Sconto
                              </th>
                              <th className="text-right px-3 py-2">
                                Totale
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.order_items.map((item) => (
                              <tr
                                key={item.id}
                                className="border-t border-border"
                              >
                                <td className="px-3 py-2 text-muted">
                                  {item.product_sku || "-"}
                                </td>
                                <td className="px-3 py-2">
                                  {item.product_name}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {item.quantity}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  €{item.unit_price.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {item.discount_percent > 0
                                    ? `${item.discount_percent}%`
                                    : "-"}
                                </td>
                                <td className="px-3 py-2 text-right font-medium">
                                  €{item.line_total.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {(order.discount_amount > 0 || order.discount_code) && (
                        <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                          Sconto{order.discount_code ? ` ${order.discount_code}` : ""}: −€
                          {order.discount_amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {/* Status change */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted">Stato:</label>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        disabled={isPending}
                        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {statusLabels[s]?.label || s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tracking number */}
                    <TrackingInput
                      initial={order.tracking_number || ""}
                      onSave={(t) => handleTrackingSave(order.id, t)}
                      disabled={isPending}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrackingInput({
  initial,
  onSave,
  disabled,
}: {
  initial: string;
  onSave: (val: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
      >
        <Truck className="w-4 h-4" />
        {initial ? `Tracking: ${initial}` : "Aggiungi tracking"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Truck className="w-4 h-4 text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Numero tracking"
        className="rounded-lg border border-border bg-surface px-2 py-1 text-sm w-40"
        autoFocus
      />
      <button
        onClick={() => {
          onSave(value);
          setEditing(false);
        }}
        disabled={disabled}
        className="text-sm text-accent hover:underline"
      >
        Salva
      </button>
      <button
        onClick={() => {
          setValue(initial);
          setEditing(false);
        }}
        className="text-sm text-muted hover:underline"
      >
        Annulla
      </button>
    </div>
  );
}
