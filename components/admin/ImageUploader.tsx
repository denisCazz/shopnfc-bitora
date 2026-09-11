"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  GripVertical,
  ImageIcon,
  FolderOpen,
  Check,
  Pencil,
  Search,
  ChevronDown,
  Plus,
  Eye,
} from "lucide-react";

interface ProductImage {
  id: number;
  image_url: string;
  sort_order: number;
  alt_text: string | null;
}

interface R2Image {
  key: string;
  url: string;
  filename: string;
  size: number;
}

interface CategoryInfo {
  id: number;
  name_it: string;
  slug: string;
}

// Mapping category slug → R2 folder
const CATEGORY_SLUG_MAP: Record<number, string> = {};

export default function ImageUploader({
  productId,
  categoryId,
  categories,
  initialImages = [],
}: {
  productId?: number;
  categoryId?: number;
  categories?: CategoryInfo[];
  initialImages?: ProductImage[];
}) {
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editingAlt, setEditingAlt] = useState<number | null>(null);
  const [editAltValue, setEditAltValue] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // R2 browser state
  const [showR2Browser, setShowR2Browser] = useState(false);
  const [r2Images, setR2Images] = useState<R2Image[]>([]);
  const [r2Loading, setR2Loading] = useState(false);
  const [r2Search, setR2Search] = useState("");
  const [r2Selected, setR2Selected] = useState<Set<string>>(new Set());
  const [r2Category, setR2Category] = useState<string>(
    categories?.find((c) => c.id === categoryId)?.slug || ""
  );
  const [r2Importing, setR2Importing] = useState(false);

  // Currently assigned URLs for filtering R2 browser
  const assignedUrls = new Set(images.map((img) => img.image_url));

  const loadR2Images = useCallback(async (slug: string) => {
    setR2Loading(true);
    setR2Selected(new Set());
    try {
      const res = await fetch(`/api/r2-images?category=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (data.images) {
        setR2Images(data.images);
      }
    } catch {
      console.error("Errore caricamento immagini R2");
    }
    setR2Loading(false);
  }, []);

  // Load R2 images when category changes
  useEffect(() => {
    if (showR2Browser && r2Category) {
      void loadR2Images(r2Category);
    }
  }, [showR2Browser, r2Category, loadR2Images]);

  // Auto-set R2 category when categoryId prop changes
  useEffect(() => {
    const slug = categories?.find((c) => c.id === categoryId)?.slug;
    if (slug) setR2Category(slug);
  }, [categoryId]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!productId) return;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("product_id", productId.toString());

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.image) {
        setImages((prev) => [...prev, data.image]);
      } else {
        alert(data.error || "Errore durante il caricamento");
      }
    },
    [productId]
  );

  async function handleFiles(files: FileList | File[]) {
    if (!productId) {
      alert("Salva prima il prodotto, poi potrai caricare le immagini.");
      return;
    }
    setUploading(true);
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
    setUploading(false);
  }

  async function handleDelete(imageId: number) {
    if (!confirm("Eliminare questa immagine?")) return;
    const res = await fetch("/api/upload/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });
    const data = await res.json();
    if (data.success) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    }
  }

  async function handleReorder(fromIndex: number, toIndex: number) {
    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    const reordered = updated.map((img, i) => ({ ...img, sort_order: i }));
    setImages(reordered);

    await fetch("/api/upload/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images: reordered.map((img) => ({ id: img.id, sort_order: img.sort_order })),
      }),
    });
  }

  async function handleSaveAlt(imageId: number) {
    const res = await fetch("/api/upload/update-alt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, altText: editAltValue }),
    });
    const data = await res.json();
    if (data.success) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, alt_text: editAltValue || null } : img
        )
      );
    }
    setEditingAlt(null);
  }

  async function handleImportR2() {
    if (!productId || r2Selected.size === 0) return;
    setR2Importing(true);

    const selectedImages = r2Images.filter((img) => r2Selected.has(img.url));
    const currentMax = images.length > 0 ? Math.max(...images.map((i) => i.sort_order)) : -1;

    for (let i = 0; i < selectedImages.length; i++) {
      const img = selectedImages[i];
      const res = await fetch("/api/upload/import-r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          imageUrl: img.url,
          altText: img.filename.replace(/\.[^.]+$/, "").replace(/-/g, " "),
          sortOrder: currentMax + 1 + i,
        }),
      });
      const data = await res.json();
      if (data.image) {
        setImages((prev) => [...prev, data.image]);
      }
    }

    setR2Selected(new Set());
    setR2Importing(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleDragOverItem(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      handleReorder(dragIndex, index);
      setDragIndex(index);
    }
  }

  function toggleR2Select(url: string) {
    setR2Selected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  const filteredR2 = r2Images.filter((img) => {
    if (r2Search) {
      return img.filename.toLowerCase().includes(r2Search.toLowerCase());
    }
    return true;
  });

  const availableR2 = filteredR2.filter((img) => !assignedUrls.has(img.url));
  const alreadyAssigned = filteredR2.filter((img) => assignedUrls.has(img.url));

  return (
    <div className="space-y-4">
      {/* Image grid with edit/preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((img, index) => (
              <div key={img.id} className="space-y-1">
                <div
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => handleDragOverItem(e, index)}
                  onDragEnd={() => setDragIndex(null)}
                  className={`relative group rounded-xl border-2 overflow-hidden aspect-square bg-stone-50 dark:bg-stone-900 ${
                    index === 0
                      ? "border-accent ring-2 ring-accent/20"
                      : "border-border"
                  } ${dragIndex === index ? "opacity-50" : ""}`}
                >
                  <Image
                    src={img.image_url}
                    alt={img.alt_text || ""}
                    fill
                    sizes="150px"
                    className="object-contain p-2"
                  />

                  {index === 0 && (
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-accent text-white text-[10px] font-bold uppercase">
                      Principale
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(img.image_url)}
                      className="p-1.5 rounded-lg bg-white/90 text-stone-700 hover:bg-white transition-colors"
                      title="Anteprima"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(img.id)}
                      className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      title="Elimina"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="p-1.5 rounded-lg bg-white/80 text-stone-700 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Alt text / name editing */}
                {editingAlt === img.id ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={editAltValue}
                      onChange={(e) => setEditAltValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveAlt(img.id);
                        if (e.key === "Escape") setEditingAlt(null);
                      }}
                      className="flex-1 min-w-0 px-2 py-1 text-xs rounded-lg border border-border bg-background focus:border-accent/50 focus:outline-none"
                      placeholder="Nome / alt text"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveAlt(img.id)}
                      className="p-1 rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingAlt(null)}
                      className="p-1 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAlt(img.id);
                      setEditAltValue(img.alt_text || "");
                    }}
                    className="w-full flex items-center gap-1 px-2 py-1 text-xs text-muted hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors truncate"
                    title="Modifica nome"
                  >
                    <Pencil className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {img.alt_text || "Aggiungi nome..."}
                    </span>
                  </button>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Upload drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-accent bg-accent/5"
            : "border-border hover:border-accent/50 hover:bg-accent/5"
        } ${!productId ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-muted">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Caricamento in corso...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted">
            {images.length === 0 ? (
              <ImageIcon className="w-10 h-10 text-muted/40" />
            ) : (
              <Upload className="w-8 h-8 text-muted/40" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {images.length === 0
                  ? "Trascina le immagini qui"
                  : "Aggiungi altre immagini"}
              </p>
              <p className="text-xs text-muted mt-1">
                JPG, PNG, WebP o GIF — max 5 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* R2 Browser toggle */}
      {productId && (
        <button
          type="button"
          onClick={() => setShowR2Browser(!showR2Browser)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          {showR2Browser ? "Chiudi archivio R2" : "Sfoglia archivio R2"}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showR2Browser ? "rotate-180" : ""}`}
          />
        </button>
      )}

      {/* R2 Browser Panel */}
      {showR2Browser && productId && (
        <div className="border border-border rounded-2xl overflow-hidden">
          {/* Header with category selector */}
          <div className="bg-surface p-4 border-b border-border space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted mb-1">
                  Categoria R2 *
                </label>
                <select
                  value={r2Category}
                  onChange={(e) => setR2Category(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                >
                  <option value="" disabled>
                    Seleziona categoria...
                  </option>
                  {categories ? (
                    categories.map((cat) => (
                      <option key={cat.id} value={CATEGORY_SLUG_MAP[cat.id] || cat.slug}>
                        {cat.name_it}
                      </option>
                    ))
                  ) : (
                    Object.entries(CATEGORY_SLUG_MAP).map(([id, slug]) => (
                      <option key={id} value={slug}>
                        {slug}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted mb-1">
                  Cerca immagine
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    value={r2Search}
                    onChange={(e) => setR2Search(e.target.value)}
                    placeholder="Filtra per nome..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-background border border-border text-sm placeholder:text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                  />
                </div>
              </div>
            </div>

            {/* Import button */}
            {r2Selected.size > 0 && (
              <button
                type="button"
                onClick={handleImportR2}
                disabled={r2Importing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {r2Importing
                  ? "Importazione..."
                  : `Associa ${r2Selected.size} immagin${r2Selected.size === 1 ? "e" : "i"} al prodotto`}
              </button>
            )}
          </div>

          {/* Image grid */}
          <div className="p-4 max-h-[500px] overflow-y-auto">
            {r2Loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !r2Category ? (
              <p className="text-center text-sm text-muted py-8">
                Seleziona una categoria per sfogliare le immagini R2.
              </p>
            ) : availableR2.length === 0 && alreadyAssigned.length === 0 ? (
              <p className="text-center text-sm text-muted py-8">
                Nessuna immagine trovata in questa categoria.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Available images */}
                {availableR2.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted mb-2 uppercase tracking-wide">
                      Disponibili ({availableR2.length})
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                      {availableR2.map((img) => (
                        <button
                          key={img.url}
                          type="button"
                          onClick={() => toggleR2Select(img.url)}
                          className={`relative rounded-xl border-2 overflow-hidden aspect-square bg-stone-50 dark:bg-stone-900 transition-all ${
                            r2Selected.has(img.url)
                              ? "border-accent ring-2 ring-accent/30 scale-[0.97]"
                              : "border-border hover:border-accent/40"
                          }`}
                        >
                          <Image
                            src={img.url}
                            alt={img.filename}
                            fill
                            sizes="120px"
                            className="object-contain p-1"
                          />
                          {r2Selected.has(img.url) && (
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                            <p className="text-[9px] text-white truncate">
                              {img.filename}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Already assigned */}
                {alreadyAssigned.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted mb-2 uppercase tracking-wide">
                      Già associate ({alreadyAssigned.length})
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                      {alreadyAssigned.map((img) => (
                        <div
                          key={img.url}
                          className="relative rounded-xl border-2 border-green-300 dark:border-green-700 overflow-hidden aspect-square bg-stone-50 dark:bg-stone-900 opacity-60"
                        >
                          <Image
                            src={img.url}
                            alt={img.filename}
                            fill
                            sizes="120px"
                            className="object-contain p-1"
                          />
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                            <p className="text-[9px] text-white truncate">
                              {img.filename}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!productId && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Salva prima il prodotto per poter caricare le immagini.
        </p>
      )}

      {/* Full-screen preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-4xl aspect-square">
            <Image
              src={previewUrl}
              alt="Anteprima"
              fill
              sizes="90vw"
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
