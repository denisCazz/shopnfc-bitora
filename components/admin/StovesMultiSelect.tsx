"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, Search } from "lucide-react";

interface Stove {
  id: number;
  nameIt: string;
}

export default function StovesMultiSelect({
  stoves,
  selectedStoveIds = [],
}: {
  stoves: Stove[];
  selectedStoveIds?: number[];
}) {
  const [selected, setSelected] = useState<number[]>(selectedStoveIds);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = stoves.filter(
    (s) =>
      !selected.includes(s.id) &&
      s.nameIt.toLowerCase().includes(query.toLowerCase())
  );

  const selectedStoves = stoves.filter((s) => selected.includes(s.id));

  const add = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setQuery("");
  };

  const remove = (id: number) => {
    setSelected((prev) => prev.filter((x) => x !== id));
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden inputs for form submission */}
      {selected.map((id) => (
        <input key={id} type="hidden" name="compatible_stove_ids" value={id} />
      ))}

      {/* Trigger box */}
      <div
        className="min-h-[42px] w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20 transition-all cursor-text flex flex-wrap gap-1.5 items-center"
        onClick={() => setOpen(true)}
      >
        {selectedStoves.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-medium"
          >
            {s.nameIt}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(s.id);
              }}
              className="hover:text-sky-900 dark:hover:text-sky-100 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
          <Search className="w-3.5 h-3.5 text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? "Cerca chip NFC..." : "Aggiungi altro..."}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted"
          />
          <ChevronDown
            className={`w-4 h-4 text-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted text-center">
              {query
                ? `Nessun risultato per "${query}"`
                : selected.length === stoves.length
                ? "Tutti i modelli sono già selezionati"
                : "Nessun chip disponibile"}
            </div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => add(s.id)}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-surface transition-colors border-b border-border last:border-0"
              >
                {s.nameIt}
              </button>
            ))
          )}
        </div>
      )}

      {selected.length > 0 && (
        <p className="mt-1.5 text-xs text-muted">
          {selected.length} modello{selected.length !== 1 ? "i" : ""} selezionato{selected.length !== 1 ? "i" : ""}
        </p>
      )}
    </div>
  );
}
