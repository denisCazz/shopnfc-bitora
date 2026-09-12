"use client";

import { useActionState, useMemo, useState } from "react";
import { Save } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import ChipsMultiSelect from "@/components/admin/ChipsMultiSelect";
import { DEFAULT_MARKUP, retailFromCatalog } from "@/lib/pricing";
import { isKitProduct } from "@/lib/min-quantity";

interface Category {
  id: number;
  name_it: string;
  slug: string;
}

interface ChipOption {
  id: number;
  nameIt: string;
}

interface ProductImage {
  id: number;
  image_url: string;
  sort_order: number;
  alt_text: string | null;
}

interface ProductData {
  id?: number;
  name_it: string;
  name_en: string | null;
  name_fr: string | null;
  name_es: string | null;
  category_id: number;
  catalog_price?: number;
  price: number;
  stock_quantity: number;
  min_quantity: number;
  sku: string | null;
  ean13: string | null;
  brand: string | null;
  weight: number | null;
  width: number | null;
  height: number | null;
  depth: number | null;
  description_it: string | null;
  description_en: string | null;
  description_fr: string | null;
  description_es: string | null;
  description_short_it: string | null;
  description_short_en: string | null;
  description_short_fr: string | null;
  description_short_es: string | null;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  active: boolean;
  fragile_shipping: boolean;
  fragile_shipping_cost: number | null;
}

const emptyProduct: ProductData = {
  name_it: "",
  name_en: null,
  name_fr: null,
  name_es: null,
  category_id: 0,
  catalog_price: 0,
  price: 0,
  stock_quantity: 0,
  min_quantity: 10,
  sku: null,
  ean13: null,
  brand: null,
  weight: null,
  width: null,
  height: null,
  depth: null,
  description_it: null,
  description_en: null,
  description_fr: null,
  description_es: null,
  description_short_it: null,
  description_short_en: null,
  description_short_fr: null,
  description_short_es: null,
  image_url: null,
  meta_title: null,
  meta_description: null,
  active: true,
  fragile_shipping: false,
  fragile_shipping_cost: null,
};

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground mb-1.5">
      {children}
    </label>
  );
}

function Input({
  name,
  defaultValue,
  type = "text",
  placeholder,
  required,
  step,
  min,
}: {
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  min?: number;
}) {
  return (
    <input
      name={name}
      type={type}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      required={required}
      step={step}
      min={min}
      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm placeholder:text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
    />
  );
}

function Textarea({
  name,
  defaultValue,
  rows = 4,
  placeholder,
}: {
  name: string;
  defaultValue?: string | null;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      name={name}
      defaultValue={defaultValue ?? ""}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm placeholder:text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-y"
    />
  );
}

export default function ProductForm({
  product,
  categories,
  chips = [],
  selectedChipIds = [],
  action,
  submitLabel,
  productImages = [],
  returnPage,
  markup = DEFAULT_MARKUP,
}: {
  product?: ProductData;
  categories: Category[];
  chips?: ChipOption[];
  selectedChipIds?: number[];
  action: (prevState: { error?: string } | null, formData: FormData) => Promise<{ error?: string } | null>;
  submitLabel: string;
  productImages?: ProductImage[];
  returnPage?: string;
  markup?: number;
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const p = product || emptyProduct;
  const kit = isKitProduct({ sku: p.sku, nameIt: p.name_it, nameEn: p.name_en });
  const [catalogInput, setCatalogInput] = useState(
    String(p.catalog_price ?? p.price ?? 0)
  );
  const sellingPreview = useMemo(() => {
    const catalog = parseFloat(catalogInput) || 0;
    return retailFromCatalog(catalog, markup);
  }, [catalogInput, markup]);

  return (
    <form action={formAction} className="space-y-8">
      {returnPage && (
        <input type="hidden" name="return_page" value={returnPage} />
      )}
      {state?.error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      {/* Names */}
      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Nome prodotto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name_it">Nome (IT) *</Label>
            <Input name="name_it" defaultValue={p.name_it} required placeholder="Nome del prodotto" />
          </div>
          <div>
            <Label htmlFor="name_en">Nome (EN)</Label>
            <Input name="name_en" defaultValue={p.name_en} placeholder="Product name" />
          </div>
          <div>
            <Label htmlFor="name_fr">Nome (FR)</Label>
            <Input name="name_fr" defaultValue={p.name_fr} placeholder="Nom du produit" />
          </div>
          <div>
            <Label htmlFor="name_es">Nome (ES)</Label>
            <Input name="name_es" defaultValue={p.name_es} placeholder="Nombre del producto" />
          </div>
        </div>
      </section>

      {/* Category, Price, Stock */}
      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Dettagli</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="category_id">Categoria *</Label>
            <select
              name="category_id"
              defaultValue={p.category_id || ""}
              required
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            >
              <option value="" disabled>Seleziona...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name_it}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="catalog_price">Prezzo listino catalogo (€) *</Label>
            <input
              id="catalog_price"
              name="catalog_price"
              type="number"
              step="0.01"
              required
              value={catalogInput}
              onChange={(e) => setCatalogInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm placeholder:text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            />
            <p className="mt-1.5 text-xs text-muted">
              Listino fornitore. In vetrina: €{sellingPreview.toFixed(2)} (×{markup.toFixed(2)}). Il ricarico si cambia in Impostazioni.
            </p>
          </div>
          <div>
            <Label htmlFor="stock_quantity">Quantità in stock *</Label>
            <Input name="stock_quantity" type="number" defaultValue={p.stock_quantity} required />
          </div>
          <div>
            <Label htmlFor="min_quantity">Ordine minimo (pz) *</Label>
            <Input
              name="min_quantity"
              type="number"
              defaultValue={kit ? 1 : (p.min_quantity ?? 10)}
              required
              min={1}
            />
            <p className="mt-1.5 text-xs text-muted">
              {kit
                ? "I kit non hanno quantità minima: viene sempre salvato 1 pezzo."
                : "Quantità minima per ordine, in pezzi. Default 10. I kit restano a 1."}
            </p>
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input name="sku" defaultValue={p.sku} placeholder="Codice SKU" />
          </div>
          <div>
            <Label htmlFor="ean13">EAN13</Label>
            <Input name="ean13" defaultValue={p.ean13} placeholder="Codice a barre" />
          </div>
          <div>
            <Label htmlFor="brand">Marca</Label>
            <Input name="brand" defaultValue={p.brand} placeholder="Es. EBM, Cadel..." />
          </div>
        </div>
      </section>

      {/* Dimensions */}
      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Dimensioni e peso</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input name="weight" type="number" step="0.01" defaultValue={p.weight} />
          </div>
          <div>
            <Label htmlFor="width">Largh. (cm)</Label>
            <Input name="width" type="number" step="0.01" defaultValue={p.width} />
          </div>
          <div>
            <Label htmlFor="height">Alt. (cm)</Label>
            <Input name="height" type="number" step="0.01" defaultValue={p.height} />
          </div>
          <div>
            <Label htmlFor="depth">Prof. (cm)</Label>
            <Input name="depth" type="number" step="0.01" defaultValue={p.depth} />
          </div>
        </div>
      </section>

      {/* Compatible Stoves */}
      {chips.length > 0 && (
        <section className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-foreground mb-1">Chip compatibili</h2>
          <p className="text-sm text-muted mb-4">Associa i chip NFC (NTAG, MIFARE, DESFire…) a questo prodotto</p>
          <ChipsMultiSelect chips={chips} selectedChipIds={selectedChipIds} />
        </section>
      )}

      {/* Descriptions */}
      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Descrizioni</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="description_short_it">Descrizione breve (IT)</Label>
            <Textarea name="description_short_it" defaultValue={p.description_short_it} rows={2} placeholder="Breve descrizione per anteprime" />
          </div>
          <div>
            <Label htmlFor="description_it">Descrizione completa (IT)</Label>
            <Textarea name="description_it" defaultValue={p.description_it} rows={5} placeholder="Descrizione dettagliata del prodotto" />
          </div>
          <div>
            <Label htmlFor="description_short_en">Short description (EN)</Label>
            <Textarea name="description_short_en" defaultValue={p.description_short_en} rows={2} placeholder="Short description for previews" />
          </div>
          <div>
            <Label htmlFor="description_en">Full description (EN)</Label>
            <Textarea name="description_en" defaultValue={p.description_en} rows={5} placeholder="Detailed product description" />
          </div>
          <div>
            <Label htmlFor="description_short_fr">Description courte (FR)</Label>
            <Textarea name="description_short_fr" defaultValue={p.description_short_fr} rows={2} placeholder="Courte description pour les aperçus" />
          </div>
          <div>
            <Label htmlFor="description_fr">Description complète (FR)</Label>
            <Textarea name="description_fr" defaultValue={p.description_fr} rows={5} placeholder="Description détaillée du produit" />
          </div>
          <div>
            <Label htmlFor="description_short_es">Descripción corta (ES)</Label>
            <Textarea name="description_short_es" defaultValue={p.description_short_es} rows={2} placeholder="Descripción corta para vistas previas" />
          </div>
          <div>
            <Label htmlFor="description_es">Descripción completa (ES)</Label>
            <Textarea name="description_es" defaultValue={p.description_es} rows={5} placeholder="Descripción detallada del producto" />
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Immagini</h2>
        <ImageUploader
          productId={product?.id}
          categoryId={p.category_id || undefined}
          categories={categories.map((c) => ({ id: c.id, name_it: c.name_it, slug: c.slug }))}
          initialImages={productImages}
        />
      </section>

      {/* SEO */}
      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">SEO</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="meta_title">Meta title</Label>
            <Input name="meta_title" defaultValue={p.meta_title} />
          </div>
          <div>
            <Label htmlFor="meta_description">Meta description</Label>
            <Input name="meta_description" defaultValue={p.meta_description} />
          </div>
        </div>
      </section>

      {/* Spedizioni per collo fragile */}
      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-foreground mb-1">Spedizioni per collo fragile</h2>
        <p className="text-sm text-muted mb-4">Attiva se il prodotto richiede spedizione speciale DHL per colli fragili (es. vetri).</p>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="fragile_shipping"
              defaultChecked={p.fragile_shipping}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20"
            />
            <span className="text-sm font-medium text-foreground">Spedizione per collo fragile (DHL)</span>
          </label>
          <div className="max-w-xs">
            <Label htmlFor="fragile_shipping_cost">Costo netto spedizione fragile (€)</Label>
            <Input
              name="fragile_shipping_cost"
              type="number"
              step="0.01"
              defaultValue={p.fragile_shipping_cost}
              placeholder="Es. 30.00"
            />
            <p className="text-xs text-muted mt-1">L&apos;IVA verrà applicata automaticamente al checkout. Lascia vuoto per disabilitare.</p>
          </div>
        </div>
      </section>

      {/* Active toggle + Submit */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface border border-border rounded-2xl p-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="active"
            defaultChecked={p.active}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20"
          />
          <span className="text-sm font-medium text-foreground">Prodotto attivo (visibile nel catalogo)</span>
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shrink-0"
        >
          <Save className="w-4 h-4" />
          {isPending ? "Salvataggio..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
