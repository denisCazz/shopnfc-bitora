"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  ChevronDown,
  ChevronUp,
  Truck,
  ExternalLink,
} from "lucide-react";
import ReceiptUploader from "@/components/ReceiptUploader";
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
  total: number;
  shipping_address: Record<string, string>;
  tracking_number: string | null;
  bank_transfer_receipt_url: string | null;
  order_items: OrderItem[];
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "In attesa",
    color: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800",
  },
  confirmed: {
    label: "Confermato",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
  },
  processing: {
    label: "In lavorazione",
    color: "text-indigo-700 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
  },
  shipped: {
    label: "Spedito",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
  },
  delivered: {
    label: "Consegnato",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800",
  },
  cancelled: {
    label: "Annullato",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
  },
};

const paymentLabels: Record<string, string> = {
  stripe: "Carta di credito",
  paypal: "PayPal",
  satispay: "Satispay",
  bank_transfer: "Bonifico bancario",
  cod: "Contrassegno",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEur(amount: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export default function OrdersListClient({ orders }: { orders: Order[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-foreground)]/60 hover:text-[var(--color-accent)] transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Il mio account
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-[var(--color-accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              I miei ordini
            </h1>
            <p className="text-sm text-[var(--color-foreground)]/60">
              {orders.length} ordin{orders.length === 1 ? "e" : "i"}
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-[var(--color-foreground)]/10 mb-4" />
            <p className="text-[var(--color-foreground)]/50 text-sm">
              Non hai ancora effettuato ordini
            </p>
            <Link
              href="/"
              className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent)]/90 transition"
            >
              Inizia ad acquistare
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const isExpanded = expandedId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-surface rounded-2xl border border-[var(--color-muted)]/30 overflow-hidden"
                >
                  {/* Header - always visible */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : order.id)
                    }
                    className="w-full p-4 flex items-center gap-4 hover:bg-[var(--color-accent)]/5 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[var(--color-foreground)]">
                          Ordine #{formatOrderNumber(order.id)}
                        </span>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${status.bg} ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-foreground)]/50 mt-1">
                        {formatDate(order.created_at)} —{" "}
                        {paymentLabels[order.payment_method || ""] ||
                          order.payment_method}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-[var(--color-accent)] tabular-nums whitespace-nowrap">
                      {formatEur(order.total)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[var(--color-foreground)]/30 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[var(--color-foreground)]/30 shrink-0" />
                    )}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[var(--color-muted)]/20">
                      {/* Tracking */}
                      {order.tracking_number && (
                        <div className="mt-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="text-sm text-purple-700 dark:text-purple-300">
                            Tracking:{" "}
                            <strong>{order.tracking_number}</strong>
                          </span>
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(order.tracking_number)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-purple-600 hover:text-purple-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}

                      {/* Items */}
                      <div className="mt-3">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-[var(--color-foreground)]/50 uppercase">
                              <th className="text-left py-2 font-medium">
                                Prodotto
                              </th>
                              <th className="text-center py-2 font-medium">
                                Qtà
                              </th>
                              <th className="text-right py-2 font-medium">
                                Prezzo
                              </th>
                              <th className="text-right py-2 font-medium">
                                Totale
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.order_items.map((item) => (
                              <tr
                                key={item.id}
                                className="border-t border-[var(--color-muted)]/15"
                              >
                                <td className="py-2 text-[var(--color-foreground)]">
                                  {item.product_name}
                                  {item.product_sku && (
                                    <span className="text-xs text-[var(--color-foreground)]/40 ml-1">
                                      ({item.product_sku})
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 text-center text-[var(--color-foreground)]/70">
                                  {item.quantity}
                                </td>
                                <td className="py-2 text-right text-[var(--color-foreground)]/70 tabular-nums">
                                  {formatEur(item.unit_price)}
                                </td>
                                <td className="py-2 text-right font-medium text-[var(--color-foreground)] tabular-nums">
                                  {formatEur(item.line_total)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Totals */}
                      <div className="mt-3 pt-3 border-t border-[var(--color-muted)]/20 space-y-1 text-sm">
                        <div className="flex justify-between text-[var(--color-foreground)]/60">
                          <span>Subtotale</span>
                          <span className="tabular-nums">
                            {formatEur(order.subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[var(--color-foreground)]/60">
                          <span>Spedizione</span>
                          <span className="tabular-nums">
                            {formatEur(order.shipping_cost)}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-[var(--color-foreground)] pt-1 border-t border-[var(--color-muted)]/20">
                          <span>Totale</span>
                          <span className="tabular-nums text-[var(--color-accent)]">
                            {formatEur(order.total)}
                          </span>
                        </div>
                      </div>

                      {/* Shipping address */}
                      {order.shipping_address?.address && (
                        <div className="mt-3 pt-3 border-t border-[var(--color-muted)]/20">
                          <p className="text-xs font-medium text-[var(--color-foreground)]/50 uppercase mb-1">
                            Indirizzo di spedizione
                          </p>
                          <p className="text-sm text-[var(--color-foreground)]/70">
                            {order.shipping_address.name && (
                              <>
                                {order.shipping_address.name}
                                <br />
                              </>
                            )}
                            {order.shipping_address.address}
                            <br />
                            {order.shipping_address.zip}{" "}
                            {order.shipping_address.city}{" "}
                            {order.shipping_address.province}{" "}
                            {order.shipping_address.country}
                          </p>
                        </div>
                      )}

                      {/* Bank transfer receipt upload */}
                      {order.payment_method === "bank_transfer" && (
                        <div className="mt-3 pt-3 border-t border-[var(--color-muted)]/20">
                          <p className="text-xs font-medium text-[var(--color-foreground)]/50 uppercase mb-2">
                            Contabile bonifico
                          </p>
                          {!order.bank_transfer_receipt_url && (
                            <p className="text-sm text-[var(--color-foreground)]/60 mb-2">
                              Carica la contabile del bonifico per consentire
                              una verifica anticipata del pagamento e ridurre i
                              tempi di attesa.
                            </p>
                          )}
                          <ReceiptUploader
                            orderId={order.id}
                            existingUrl={order.bank_transfer_receipt_url}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
