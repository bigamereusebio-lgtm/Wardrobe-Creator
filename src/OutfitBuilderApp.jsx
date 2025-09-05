import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  User,
  ShoppingBag,
  Scissors,
  Image as ImageIcon,
  Save,
  Edit2,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  Square,
} from "lucide-react";
import { ExternalLink } from "lucide-react";

// =============================
// CATEGORY + SIZING DEFINITIONS
// =============================
const CATEGORIES = [
  { id: 1, key: "head", label: "Head", icon: <User className="w-4 h-4" /> },
  { id: 2, key: "top", label: "Top", icon: <Square className="w-4 h-4" /> },
  { id: 3, key: "bottom", label: "Bottom", icon: <Layers className="w-4 h-4" /> },
  { id: 4, key: "shoes", label: "Shoes", icon: <Square className="w-4 h-4" /> },
  { id: 5, key: "jackets", label: "Jackets", icon: <Square className="w-4 h-4" /> },
  { id: 6, key: "bags", label: "Bag / Wallets", icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 7, key: "belts", label: "Belts", icon: <Scissors className="w-4 h-4 rotate-90" /> },
  { id: 8, key: "socks", label: "Socks", icon: <ImageIcon className="w-4 h-4" /> },
];

// Bigger sizes to remove empty space, following your spec
// 1: medium → xl, 2/3/5: big → 2xl, 4: medium-large → xl, 7: medium → lg, 6/8: small → lg (still compact but visible)
const SIZE_MAP = {
  head: "xl",
  top: "2xl",
  bottom: "2xl",
  shoes: "xl",
  jackets: "2xl",
  bags: "lg",
  belts: "lg",
  socks: "lg",
};

const SIZE_CLASSES = {
  sm: "w-20 h-20",
  md: "w-28 h-28",
  lg: "w-36 h-36",
  xl: "w-48 h-48",
  "2xl": "w-60 h-60",
};

// =============================
// STORAGE HELPERS (localStorage)
// =============================
const LS_KEYS = {
  inventory: "outfit.inventory.v1",
  fits: "outfit.fits.v1",
};

import { useState, useEffect } from "react";
import { saveInventory, loadInventory } from "./storage";

function OutfitBuilderApp() {
  const [inventory, setInventory] = useState([]);

  // Load from IndexedDB at startup
  useEffect(() => {
    loadInventory().then(setInventory);
  }, []);

  // Save whenever inventory changes
  useEffect(() => {
    saveInventory(inventory);
  }, [inventory]);

  return (
    <div>
      <h1>My Closet</h1>
      {/* your existing UI */}
    </div>
  );
}

export default OutfitBuilderApp;

// =============================
// UI PRIMITIVES
// =============================
const Card = ({ className = "", children }) => (
  <div className={`bg-white/70 dark:bg-neutral-900/70 rounded-2xl p-4 ${className}`}>{children}</div>
);

const Button = ({ className = "", variant = "default", children, ...props }) => {
  const base =
    "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition active:scale-[0.98]";
  const styles = {
    default: "bg-black text-white hover:bg-neutral-800",
    ghost:
      "bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    subtle:
      "bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-700",
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Modal = ({ open, onClose, title, children, actions }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 max-h-[60vh] overflow-auto">{children}</div>
        {actions && <div className="mt-4 flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
};

// =============================
// IMAGE HELPER
// =============================
async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =============================
// DEV SELF-TESTS (console)
// =============================
(function runSelfTests() {
  const assert = (cond, msg) => (cond ? console.log : console.error)(`TEST ${cond ? "PASS" : "FAIL"}: ${msg}`);
  const keys = new Set(CATEGORIES.map((c) => c.key));
  assert(CATEGORIES.length === 8, "Exactly 8 categories are defined");
  assert(keys.size === CATEGORIES.length, "Category keys are unique");
  CATEGORIES.forEach((c) => assert(!!SIZE_MAP[c.key], `SIZE_MAP has ${c.key}`));
  const okTokens = new Set(Object.keys(SIZE_CLASSES));
  CATEGORIES.forEach((c) => assert(okTokens.has(SIZE_MAP[c.key]), `${c.key} size token valid`));
})();

// =============================
// MAIN APP
// =============================
export default function OutfitBuilderApp() {
  const [tab, setTab] = useState("builder"); // builder | fits
  const [inventory, setInventory] = useState(() => loadLS(LS_KEYS.inventory, []));
  const [fits, setFits] = useState(() => loadLS(LS_KEYS.fits, []));
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState(null); // key
  const [currentFit, setCurrentFit] = useState(() => {
    const base = {};
    CATEGORIES.forEach((c) => (base[c.key] = null));
    return base;
  });
  // When editing, holds the fit id; null means creating a new fit
  const [editingFitId, setEditingFitId] = useState(null);

  // Persist
  useEffect(() => saveLS(LS_KEYS.inventory, inventory), [inventory]);
  useEffect(() => saveLS(LS_KEYS.fits, fits), [fits]);

  // ============ INVENTORY LOGIC ============
  const addItems = async (files, categoryKey, urlOpt = "") => {
    const arr = Array.from(files || []);
    const newItems = [];
    for (const f of arr) {
      const dataUrl = await fileToDataUrl(f);
      newItems.push({ id: uuid(), categoryKey, dataUrl, url: urlOpt || "", createdAt: Date.now() });
    }
    setInventory((prev) => [...newItems, ...prev]);
  };

  const deleteItem = (id) => {
    setInventory((prev) => prev.filter((it) => it.id !== id));
    // remove from current fit
    setCurrentFit((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) if (next[k] === id) next[k] = null;
      return next;
    });
    // remove from saved fits
    setFits((prev) =>
      prev.map((f) => ({
        ...f,
        slots: Object.fromEntries(
          Object.entries(f.slots).map(([k, v]) => [k, v === id ? null : v])
        ),
      }))
    );
  };

  const itemsByCategory = useMemo(() => {
    const m = {};
    CATEGORIES.forEach((c) => (m[c.key] = []));
    for (const it of inventory) m[it.categoryKey]?.push(it);
    return m;
  }, [inventory]);

  // ============ FITS LOGIC ============
  const saveCurrentFit = (name) => {
    const newFit = {
      id: uuid(),
      name: name || `Fit ${fits.length + 1}`,
      slots: { ...currentFit },
      createdAt: Date.now(),
    };
    setFits((prev) => [newFit, ...prev]);
  };

  const updateExistingFit = (id, name) => {
    setFits((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: name || f.name, slots: { ...currentFit } } : f))
    );
  };

  const deleteFit = (id) => setFits((prev) => prev.filter((f) => f.id !== id));

  const loadFitForEdit = (id) => {
    const f = fits.find((ff) => ff.id === id);
    if (!f) return;
    setCurrentFit({ ...f.slots });
    setEditingFitId(id);
    setTab("builder");
  };

  // ============ CATALOG MODAL ============
  const openCatalog = (categoryKey) => {
    setCatalogCategory(categoryKey);
    setCatalogOpen(true);
  };
  const closeCatalog = () => {
    setCatalogOpen(false);
    setCatalogCategory(null);
  };
  const chooseFromCatalog = (itemId) => {
    setCurrentFit((prev) => ({ ...prev, [catalogCategory]: itemId }));
    closeCatalog();
  };

  // ============ UI HELPERS ============
  const CategorySlot = ({ c }) => {
    const sizeKey = SIZE_MAP[c.key];
    const classes = SIZE_CLASSES[sizeKey] || SIZE_CLASSES.md;
    const selectedId = currentFit[c.key];
    const selectedItem = inventory.find((i) => i.id === selectedId);

    const openLink = () => {
      if (selectedItem?.url) window.open(selectedItem.url, "_blank", "noopener,noreferrer");
    };

    return (
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => openCatalog(c.key)}
          onDoubleClick={openLink}
          title={selectedItem?.url ? "Double-click to open product link" : "Click to choose"}
          className={`relative ${classes} rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center overflow-hidden hover:bg-neutral-50 dark:hover:bg-neutral-800 transition`}
        >
          {selectedItem ? (
            <>
              <img src={selectedItem.dataUrl} alt={c.label} className="object-contain w-full h-full" />
              {selectedItem.url && (
                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Link
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-neutral-500 flex flex-col items-center">
              <Plus className="w-5 h-5" /> {c.label}
            </span>
          )}
        </button>
      </div>
    );
  };

  const UploadPanel = () => {
    const [cat, setCat] = useState(CATEGORIES[0].key);
    const [uploadUrl, setUploadUrl] = useState("");
    const inputRef = useRef(null);

    return (
      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCat(c.key)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    cat === c.key ? "bg-black text-white" : "bg-neutral-200 dark:bg-neutral-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  await addItems(e.target.files, cat, uploadUrl.trim());
                  e.target.value = "";
                }}
              />
              <Button onClick={() => inputRef.current?.click()}>
                <Plus className="w-4 h-4" /> Upload to <b className="ml-1">{CATEGORIES.find((c) => c.key === cat)?.label}</b>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              placeholder="Optional: paste product link to apply to these uploaded images"
            />
          </div>
        </div>
      </Card>
    );
  };

  const BuilderGrid = () => (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-neutral-500">Tap a slot to pick from its catalogue</div>
        <div className="flex items-center gap-2">
          {editingFitId && (
            <Button
              variant="ghost"
              onClick={() => {
                setEditingFitId(null);
              }}
              title="Stop editing"
            >
              Cancel edit
            </Button>
          )}
          <Button
            variant="subtle"
            onClick={() =>
              setCurrentFit(Object.fromEntries(CATEGORIES.map((c) => [c.key, null])))
            }
          >
            Clear
          </Button>
          <SaveFitButton />
        </div>
      </div>
      {/* Layout: left accessories, center top->bottom, right jacket */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* LEFT ACCESSORIES */}
        <div className="flex flex-col items-center md:items-start gap-12">
          <CategorySlot c={CATEGORIES.find((c) => c.key === "bags")} />
          <CategorySlot c={CATEGORIES.find((c) => c.key === "belts")} />
          <CategorySlot c={CATEGORIES.find((c) => c.key === "socks")} />
        </div>
        {/* CENTER MAIN STACK */}
        <div className="flex flex-col items-center gap-12">
          <CategorySlot c={CATEGORIES.find((c) => c.key === "head")} />
          <CategorySlot c={CATEGORIES.find((c) => c.key === "top")} />
          <CategorySlot c={CATEGORIES.find((c) => c.key === "bottom")} />
          <CategorySlot c={CATEGORIES.find((c) => c.key === "shoes")} />
        </div>
        {/* RIGHT JACKET */}
        <div className="flex flex-col items-center md:items-end gap-12">
          <CategorySlot c={CATEGORIES.find((c) => c.key === "jackets")} />
        </div>
      </div>
    </Card>
  );

  const SaveFitButton = () => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const isEditing = !!editingFitId;
    return (
      <>
        <Button onClick={() => setOpen(true)}>
          <Save className="w-4 h-4" /> {isEditing ? "Update fit" : "Save the fit"}
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={isEditing ? "Update this fit" : "Save this fit"}
          actions={[
            <Button key="cancel" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>,
            <Button
              key="save"
              onClick={() => {
                if (isEditing) {
                  updateExistingFit(editingFitId, name.trim());
                  setEditingFitId(null);
                } else {
                  saveCurrentFit(name.trim());
                }
                setOpen(false);
                setTab("fits");
              }}
            >
              {isEditing ? "Update" : "Save"}
            </Button>,
          ]}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            placeholder={isEditing ? "New name (optional)" : "Fit name (optional)"}
          />
        </Modal>
      </>
    );
  };

  const FitSlot = ({ label, sizeKey, item }) => {
    const classes = SIZE_CLASSES[sizeKey] || SIZE_CLASSES.md;
    return (
      <div
        className={`relative ${classes} rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden flex items-center justify-center`}
      >
        {item ? (
          <img src={item.dataUrl} className="object-contain w-full h-full" />
        ) : (
          <span className="text-sm text-neutral-500 flex items-center gap-1">
            <Plus className="w-4 h-4" /> {label}
          </span>
        )}
      </div>
    );
  };

  const FitsPage = () => (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Saved Fits</h2>
        <Button variant="ghost" onClick={() => setTab("builder")}>
          <ChevronLeft className="w-4 h-4" /> Back to builder
        </Button>
      </div>
      {fits.length === 0 ? (
        <div className="text-sm text-neutral-500">No fits yet.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {fits.map((f) => {
            const getItem = (key) => inventory.find((x) => x.id === f.slots[key]);
            return (
              <div
                key={f.id}
                className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold truncate max-w-[70%]">
                    {f.name || "Untitled fit"}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      onClick={() => loadFitForEdit(f.id)}
                      title="Edit this fit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => deleteFit(f.id)}
                      title="Delete this fit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {/* Vertical preview: head → top → bottom → shoes */}
                <div className="flex flex-col items-center gap-8">
                  <FitSlot label="Head" sizeKey={SIZE_MAP.head} item={getItem("head")} />
                  <FitSlot label="Top" sizeKey={SIZE_MAP.top} item={getItem("top")} />
                  <FitSlot label="Bottom" sizeKey={SIZE_MAP.bottom} item={getItem("bottom")} />
                  <FitSlot label="Shoes" sizeKey={SIZE_MAP.shoes} item={getItem("shoes")} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Outfit Builder</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={tab === "builder" ? "default" : "ghost"}
              onClick={() => setTab("builder")}
            >
              Builder
            </Button>
            <Button
              variant={tab === "fits" ? "default" : "ghost"}
              onClick={() => setTab("fits")}
            >
              <ChevronRight className="w-4 h-4" /> Fits
            </Button>
          </div>
        </header>

        {tab === "builder" && (
          <div className="space-y-4">
            <UploadPanel />
            <BuilderGrid />
          </div>
        )}

        {tab === "fits" && <FitsPage />}
      </div>

      {/* CATALOG MODAL */}
      <Modal
        open={catalogOpen}
        onClose={closeCatalog}
        title={`Choose from ${
          CATEGORIES.find((c) => c.key === catalogCategory)?.label || "Catalogue"
        }`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {itemsByCategory[catalogCategory || "head"]?.map((it) => (
            <div key={it.id} className="relative group">
              <button
                onClick={() => chooseFromCatalog(it.id)}
                className="w-full h-40 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden flex items-center justify-center"
                title="Click to use in slot"
              >
                <img src={it.dataUrl} className="object-contain w-full h-full" />
              </button>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => {
                    const u = prompt("Set/Update product link (leave empty to clear):", it.url || "");
                    if (u !== null) {
                      setInventory((prev) => prev.map((x) => (x.id === it.id ? { ...x, url: u.trim() } : x)));
                    }
                  }}
                  className="p-1 rounded-lg bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-700"
                  title="Set link"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteItem(it.id)}
                  className="p-1 rounded-lg bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-700"
                  title="Delete from catalogue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {it.url && (
                <a
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-1 left-1 text-[11px] bg-black/70 text-white px-1.5 py-0.5 rounded-md"
                >
                  Open link
                </a>
              )}
            </div>
          ))}
          {itemsByCategory[catalogCategory || "head"]?.length === 0 && (
            <div className="col-span-full text-sm text-neutral-500">
              No items yet in this category.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
