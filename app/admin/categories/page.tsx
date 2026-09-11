import { LayoutList } from "lucide-react";
import { getCategories } from "@/app/admin/actions/categories";
import CategoriesClient from "./CategoriesClient";

export default async function AdminCategoriesPage() {
  const cats = await getCategories();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
          <LayoutList className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorie</h1>
          <p className="text-sm text-muted mt-0.5">
            {cats.length} categorie · gestisci nomi, slug e ordinamento
          </p>
        </div>
      </div>

      <CategoriesClient initialCategories={cats} />
    </div>
  );
}
