import Link from "next/link";
import Image from "next/image";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDb } from "@/db";
import { products, categories } from "@/db/schema";
import { Plus, Search } from "lucide-react";
import ProductActions from "./ProductActions";
import ExportExcelButton from "@/components/admin/ExportExcelButton";

const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const search = params.q || "";
  const categoryFilter = params.category || "";
  const offset = (page - 1) * PAGE_SIZE;

  const db = getDb();
  const catRows = await db
    .select({ id: categories.id, nameIt: categories.nameIt })
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  const conds: SQL[] = [];
  if (search) {
    const t = `%${search}%`;
    conds.push(
      or(
        ilike(products.nameIt, t),
        ilike(products.sku, t)
      )!
    );
  }
  if (categoryFilter) {
    conds.push(eq(products.categoryId, parseInt(categoryFilter, 10)));
  }
  const whereClause = conds.length ? and(...conds) : undefined;

  const countQuery = db.select({ n: count() }).from(products);
  const [countRes] = whereClause
    ? await countQuery.where(whereClause)
    : await countQuery;

  const productRows = whereClause
    ? await db
        .select({
          id: products.id,
          nameIt: products.nameIt,
          slug: products.slug,
          price: products.price,
          stockQuantity: products.stockQuantity,
          active: products.active,
          imageUrl: products.imageUrl,
          firstImageUrl: sql<string | null>`(SELECT image_url FROM product_images WHERE product_id = products.id ORDER BY sort_order ASC, id ASC LIMIT 1)`,
          sku: products.sku,
          categoryId: products.categoryId,
          catName: categories.nameIt,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause)
        .orderBy(desc(products.id))
        .limit(PAGE_SIZE)
        .offset(offset)
    : await db
        .select({
          id: products.id,
          nameIt: products.nameIt,
          slug: products.slug,
          price: products.price,
          stockQuantity: products.stockQuantity,
          active: products.active,
          imageUrl: products.imageUrl,
          firstImageUrl: sql<string | null>`(SELECT image_url FROM product_images WHERE product_id = products.id ORDER BY sort_order ASC, id ASC LIMIT 1)`,
          sku: products.sku,
          categoryId: products.categoryId,
          catName: categories.nameIt,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .orderBy(desc(products.id))
        .limit(PAGE_SIZE)
        .offset(offset);

  const totalCount = Number(countRes.n);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    if (categoryFilter) p.set("category", categoryFilter);
    p.set("page", "1");
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    return `/admin/products?${p.toString()}`;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prodotti</h1>
          <p className="text-sm text-muted mt-1">{totalCount} prodotti totali</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ExportExcelButton
            href={`/api/admin/export/products${search || categoryFilter ? `?q=${encodeURIComponent(search)}&category=${encodeURIComponent(categoryFilter)}` : ""}`}
            label="Scarica Excel"
          />
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-200 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nuovo Prodotto
          </Link>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Cerca per nome o SKU..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-sm placeholder:text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            />
          </div>
          <select
            name="category"
            defaultValue={categoryFilter}
            className="py-2 px-3 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          >
            <option value="">Tutte le categorie</option>
            {catRows.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nameIt}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-foreground text-white text-sm font-medium hover:bg-foreground/90 transition-colors shrink-0"
          >
            Filtra
          </button>
        </form>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-stone-50/50 dark:bg-stone-800/30">
                <th className="text-left py-3 px-4 font-medium text-muted">Immagine</th>
                <th className="text-left py-3 px-4 font-medium text-muted">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-muted hidden md:table-cell">Categoria</th>
                <th className="text-left py-3 px-4 font-medium text-muted">Prezzo</th>
                <th className="text-left py-3 px-4 font-medium text-muted hidden sm:table-cell">Stock</th>
                <th className="text-left py-3 px-4 font-medium text-muted hidden sm:table-cell">Stato</th>
                <th className="text-right py-3 px-4 font-medium text-muted">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {productRows.map((product) => {
                const priceNum = Number(product.price);
                return (
                  <tr
                    key={product.id}
                    className="border-b border-border last:border-0 hover:bg-stone-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 border border-border overflow-hidden relative">
                        {(product.firstImageUrl || product.imageUrl) ? (
                          <Image
                            src={(product.firstImageUrl || product.imageUrl)!}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted/30">
                            {product.nameIt.charAt(0)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium text-foreground hover:text-accent transition-colors line-clamp-1"
                      >
                        {product.nameIt}
                      </Link>
                      {product.sku && (
                        <div className="text-xs text-muted mt-0.5">SKU: {product.sku}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted hidden md:table-cell">
                      {product.catName}
                    </td>
                    <td className="py-3 px-4 font-medium tabular-nums">
                      €{priceNum.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 tabular-nums hidden sm:table-cell">
                      <span
                        className={
                          product.stockQuantity <= 0
                            ? "text-red-600"
                            : product.stockQuantity <= 5
                            ? "text-sky-600"
                            : "text-foreground"
                        }
                      >
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          product.active
                            ? "bg-green-50 dark:bg-green-950/40 text-green-700"
                            : "bg-stone-100 dark:bg-stone-800 text-muted"
                        }`}
                      >
                        {product.active ? "Attivo" : "Disattivo"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ProductActions
                        productId={product.id}
                        active={product.active}
                        productName={product.nameIt}
                        currentPage={page}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {productRows.length === 0 && (
          <div className="py-12 text-center text-muted">
            Nessun prodotto trovato.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={buildUrl({ page: String(page - 1) })}
              className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-surface-hover transition-colors"
            >
              ← Precedente
            </Link>
          )}
          <span className="text-sm text-muted px-3">
            Pagina {page} di {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildUrl({ page: String(page + 1) })}
              className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-surface-hover transition-colors"
            >
              Successiva →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
