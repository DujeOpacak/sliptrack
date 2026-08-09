import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "../components/AdminLayout";
import { Modal } from "../components/Modal";
import { categoryApi } from "../api/categoryApi";
import { extractErrorMessage } from "../api/errors";
import { ChevronIcon, DeleteIcon, EditIcon, PlusIcon } from "../components/icons";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import type { Category, SubCategory } from "../types/category";
import styles from "./CategoriesPage.module.css";

type ModalState =
  | { type: "category-create" }
  | { type: "category-edit"; category: Category }
  | { type: "subcategory-create"; categoryId: number }
  | { type: "subcategory-edit"; subCategory: SubCategory }
  | null;

export function CategoriesPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategoriesByCategory, setSubCategoriesByCategory] = useState<
    Record<number, SubCategory[]>
  >({});
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [query, setQuery] = useState("");
  // Fetched once (unfiltered) purely so search can match subcategory names too,
  // without forcing every category open just to be searchable.
  const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([]);

  useEffect(() => {
    loadCategories();
    // Unlike refreshAllSubCategories() (called after CRUD, where stale-for-a-beat is fine
    // since another mutation will retry it), a failure here has no other trigger to retry —
    // silently swallowing it would leave subcategory-name search broken for the whole session.
    categoryApi
      .getSubCategories()
      .then(setAllSubCategories)
      .catch((err) => showToast(extractErrorMessage(err, "Pretraga potkategorija nije dostupna")));
  }, []);

  async function loadCategories() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Kategorije se nisu mogle učitati"));
    } finally {
      setIsLoading(false);
    }
  }

  const q = query.trim().toLowerCase();
  const filteredCategories = useMemo(() => {
    if (!q) return categories;
    return categories.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      return allSubCategories.some((s) => s.categoryId === c.id && s.name.toLowerCase().includes(q));
    });
  }, [categories, allSubCategories, q]);

  // While searching, auto-expand matches and seed their subcategory list from
  // the already-fetched full set — no per-category fetch needed to show results.
  useEffect(() => {
    if (!q) {
      setExpandedIds(new Set());
      return;
    }
    const matchedIds = filteredCategories.map((c) => c.id);
    setExpandedIds(new Set(matchedIds));
    setSubCategoriesByCategory((prev) => {
      const next = { ...prev };
      for (const id of matchedIds) {
        next[id] = allSubCategories.filter((s) => s.categoryId === id);
      }
      return next;
    });
  }, [q, filteredCategories, allSubCategories]);

  async function loadSubCategories(categoryId: number) {
    const data = await categoryApi.getSubCategories(categoryId);
    setSubCategoriesByCategory((prev) => ({ ...prev, [categoryId]: data }));
  }

  async function refreshAllSubCategories() {
    try {
      setAllSubCategories(await categoryApi.getSubCategories());
    } catch {
      // Search index staying stale for a beat isn't worth surfacing an error for.
    }
  }

  async function toggleExpand(categoryId: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
    if (!subCategoriesByCategory[categoryId]) {
      try {
        await loadSubCategories(categoryId);
      } catch (err) {
        showToast(extractErrorMessage(err, "Potkategorije se nisu mogle učitati"));
      }
    }
  }

  async function handleDeleteCategory(category: Category) {
    const ok = await confirm(`Obrisati kategoriju "${category.name}"?`, {
      title: "Obriši kategoriju",
      confirmLabel: "Obriši",
      danger: true,
    });
    if (!ok) return;
    try {
      await categoryApi.delete(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      showToast(`Kategorija "${category.name}" obrisana.`, "success");
    } catch (err) {
      showToast(extractErrorMessage(err));
    }
  }

  async function handleDeleteSubCategory(subCategory: SubCategory) {
    const ok = await confirm(`Obrisati potkategoriju "${subCategory.name}"?`, {
      title: "Obriši potkategoriju",
      confirmLabel: "Obriši",
      danger: true,
    });
    if (!ok) return;
    try {
      await categoryApi.deleteSubCategory(subCategory.id);
      await loadSubCategories(subCategory.categoryId);
      await refreshAllSubCategories();
      showToast(`Potkategorija "${subCategory.name}" obrisana.`, "success");
    } catch (err) {
      showToast(extractErrorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Kategorije"
        subtitle="Kategorije i potkategorije koje korisnici biraju pri unosu uplatnice."
        actions={
          <button className="btn btn-primary" onClick={() => setModal({ type: "category-create" })}>
            <PlusIcon width={13} height={13} style={{ marginRight: 6, verticalAlign: -2 }} />
            Nova kategorija
          </button>
        }
      />

      {isLoading && <p style={{ color: "var(--text-muted)" }}>Učitavanje...</p>}
      {error && <p className="error-text">{error}</p>}

      {!isLoading && !error && categories.length > 0 && (
        <div className="toolbar">
          <input
            type="search"
            placeholder="Pretraži kategorije i potkategorije..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="resultCount">
            {filteredCategories.length} / {categories.length}
          </span>
        </div>
      )}

      {!isLoading && !error && categories.length === 0 && (
        <div className={styles.emptyState}>Nema kategorija.</div>
      )}

      {!isLoading && categories.length > 0 && filteredCategories.length === 0 && (
        <div className={styles.emptyState}>Nema rezultata za "{query}".</div>
      )}

      {!isLoading && filteredCategories.length > 0 && (
        <div className={styles.list}>
          {filteredCategories.map((category) => {
            const isOpen = expandedIds.has(category.id);
            const subs = subCategoriesByCategory[category.id];
            return (
              <div key={category.id}>
                <div className={styles.categoryRow}>
                  <button
                    className={`${styles.toggleBtn} ${isOpen ? styles.open : ""}`}
                    onClick={() => toggleExpand(category.id)}
                    aria-label="Prikaži potkategorije"
                  >
                    <ChevronIcon width={12} height={12} />
                  </button>
                  <span className={styles.categoryName}>{category.name}</span>
                  {subs && <span className={styles.count}>{subs.length}</span>}
                  <div className={styles.rowActions}>
                    <button
                      className={styles.iconBtn}
                      onClick={() => setModal({ type: "category-edit", category })}
                      aria-label="Uredi kategoriju"
                    >
                      <EditIcon width={14} height={14} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.danger}`}
                      onClick={() => handleDeleteCategory(category)}
                      aria-label="Obriši kategoriju"
                    >
                      <DeleteIcon width={14} height={14} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className={styles.subList}>
                    {subs === undefined && <div className={styles.empty}>Učitavanje...</div>}
                    {subs?.length === 0 && <div className={styles.empty}>Nema potkategorija.</div>}
                    {subs?.map((sub) => (
                      <div key={sub.id} className={styles.subRow}>
                        <span className={styles.subName}>{sub.name}</span>
                        <span className={`${styles.badge} ${sub.allowsProperty ? styles.badgeOn : ""}`}>
                          {sub.allowsProperty ? "Nekretnina" : "Bez nekretnine"}
                        </span>
                        <div className={styles.rowActions}>
                          <button
                            className={styles.iconBtn}
                            onClick={() => setModal({ type: "subcategory-edit", subCategory: sub })}
                            aria-label="Uredi potkategoriju"
                          >
                            <EditIcon width={14} height={14} />
                          </button>
                          <button
                            className={`${styles.iconBtn} ${styles.danger}`}
                            onClick={() => handleDeleteSubCategory(sub)}
                            aria-label="Obriši potkategoriju"
                          >
                            <DeleteIcon width={14} height={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      className={styles.addSubRow}
                      onClick={() => setModal({ type: "subcategory-create", categoryId: category.id })}
                    >
                      + Nova potkategorija
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal?.type === "category-create" && (
        <CategoryFormModal
          onClose={() => setModal(null)}
          onSaved={(created) => {
            setCategories((prev) => [...prev, created]);
            setModal(null);
          }}
        />
      )}
      {modal?.type === "category-edit" && (
        <CategoryFormModal
          category={modal.category}
          onClose={() => setModal(null)}
          onSaved={(updated) => {
            setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setModal(null);
          }}
        />
      )}
      {modal?.type === "subcategory-create" && (
        <SubCategoryFormModal
          categories={categories}
          defaultCategoryId={modal.categoryId}
          onClose={() => setModal(null)}
          onSaved={async (created) => {
            await loadSubCategories(created.categoryId);
            await refreshAllSubCategories();
            setExpandedIds((prev) => new Set(prev).add(created.categoryId));
            setModal(null);
          }}
        />
      )}
      {modal?.type === "subcategory-edit" && (
        <SubCategoryFormModal
          categories={categories}
          subCategory={modal.subCategory}
          onClose={() => setModal(null)}
          onSaved={async (updated, previousCategoryId) => {
            await loadSubCategories(updated.categoryId);
            await refreshAllSubCategories();
            if (previousCategoryId !== updated.categoryId) {
              await loadSubCategories(previousCategoryId);
            }
            setExpandedIds((prev) => new Set(prev).add(updated.categoryId));
            setModal(null);
          }}
        />
      )}
    </>
  );
}

function CategoryFormModal({
  category,
  onClose,
  onSaved,
}: {
  category?: Category;
  onClose: () => void;
  onSaved: (category: Category) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const saved = category
        ? await categoryApi.update(category.id, { name })
        : await categoryApi.create({ name });
      onSaved(saved);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={category ? "Uredi kategoriju" : "Nova kategorija"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="category-name">Naziv</label>
          <input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" className="btn" onClick={onClose}>
            Odustani
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Spremanje..." : "Spremi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SubCategoryFormModal({
  categories,
  subCategory,
  defaultCategoryId,
  onClose,
  onSaved,
}: {
  categories: Category[];
  subCategory?: SubCategory;
  defaultCategoryId?: number;
  onClose: () => void;
  onSaved: (subCategory: SubCategory, previousCategoryId: number) => void;
}) {
  const [name, setName] = useState(subCategory?.name ?? "");
  const [allowsProperty, setAllowsProperty] = useState(subCategory?.allowsProperty ?? false);
  const [categoryId, setCategoryId] = useState<number>(
    subCategory?.categoryId ?? defaultCategoryId ?? categories[0]?.id,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const request = { name, allowsProperty, categoryId };
      const saved = subCategory
        ? await categoryApi.updateSubCategory(subCategory.id, request)
        : await categoryApi.createSubCategory(request);
      onSaved(saved, subCategory?.categoryId ?? categoryId);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={subCategory ? "Uredi potkategoriju" : "Nova potkategorija"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="subcategory-name">Naziv</label>
          <input
            id="subcategory-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="subcategory-category">Kategorija</label>
          <select
            id="subcategory-category"
            className={styles.select}
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.checkboxField}>
          <input
            id="subcategory-allows-property"
            type="checkbox"
            checked={allowsProperty}
            onChange={(e) => setAllowsProperty(e.target.checked)}
          />
          <label htmlFor="subcategory-allows-property">Dopušta vezivanje uz nekretninu</label>
        </div>
        {error && <p className="error-text">{error}</p>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" className="btn" onClick={onClose}>
            Odustani
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Spremanje..." : "Spremi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
