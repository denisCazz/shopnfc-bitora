import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { verifyPayload } from "@/lib/signed-payload";
import ReceiptUploader from "@/components/ReceiptUploader";

export const metadata = {
  title: "Carica contabile bonifico | Shop NFC",
};

interface ReceiptToken {
  orderId: number;
  scope: "receipt";
}

function formatEur(amount: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export default async function ReceiptUploadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t: token } = await searchParams;
  const orderId = parseInt(id, 10);

  const payload = token ? verifyPayload<ReceiptToken>(token) : null;
  const tokenValid =
    !!payload && payload.scope === "receipt" && payload.orderId === orderId;

  let order: typeof orders.$inferSelect | undefined;
  if (tokenValid && Number.isInteger(orderId)) {
    const db = getDb();
    [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
  }

  const valid =
    tokenValid && order && order.paymentMethod === "bank_transfer";

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {!valid ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Link non valido
            </h1>
            <p className="text-muted">
              Il link per caricare la contabile non è valido o è scaduto.
              Accedi al tuo account per gestire i tuoi ordini.
            </p>
            <Link
              href="/account/orders"
              className="mt-6 inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white font-semibold"
            >
              I miei ordini
            </Link>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Carica contabile bonifico
            </h1>
            <p className="text-muted mb-1">
              Ordine #{order!.id} — {formatEur(Number(order!.total))}
            </p>
            <p className="text-sm text-muted mb-6">
              Carica la contabile del bonifico per consentire una verifica
              anticipata del pagamento e ridurre i tempi di attesa.
            </p>
            <ReceiptUploader
              orderId={order!.id}
              token={token}
              existingUrl={order!.bankTransferReceiptUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
}
