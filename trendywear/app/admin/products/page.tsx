"use client";

import { FiPlus, FiX, FiEdit2, FiTrash2, FiSearch, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { IoMdRemoveCircleOutline } from "react-icons/io";
import { LuList } from "react-icons/lu";
import Image from "next/image";
import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { createItem } from "@/app/actions/admin/CreateItem";
import { updateItem } from "@/app/actions/admin/UpdateItem";
import { deleteItem } from "@/app/actions/admin/DeleteItem";
import { addSpecialPrice } from "@/app/actions/admin/addSpecialPrice";
import { createClient } from "@/utils/supabase/client";
import Dropzone from "react-dropzone";
import { ProductImageCropModal } from "./ProductImageCropModal";

const BUCKET_NAME = "images";

const GLOBAL_STYLES = `
  .products-title { font-weight: 700; letter-spacing: -0.02em; }
  @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rowIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes spinIn { from { transform: rotate(-180deg) scale(0.4); opacity: 0; } to { transform: rotate(0deg) scale(1); opacity: 1; } }
  @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(193,18,31,0.2); } 50% { box-shadow: 0 0 0 7px rgba(193,18,31,0); } }
  @keyframes shimmer { 0% { background-position: -500px 0; } 100% { background-position: 500px 0; } }
  .fade-slide-in { animation: fadeSlideIn 0.35s ease both; }
  .row-in { animation: rowIn 0.3s ease both; }
  .spin-in { animation: spinIn 0.22s cubic-bezier(.34,1.56,.64,1) both; }
  .pulse-glow { animation: pulseGlow 2s ease infinite; }
  .shimmer-line { background: linear-gradient(90deg, #f3f3f3 25%, #e8e8e8 50%, #f3f3f3 75%); background-size: 500px 100%; animation: shimmer 1.5s ease infinite; border-radius: 6px; }
  .sort-btn { transition: color 0.18s, background 0.2s, transform 0.15s; }
  .sort-btn:hover { transform: translateY(-1px); }
  .product-row { transition: box-shadow 0.22s, background 0.18s; }
  .product-row:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.06); background: #ffffff !important; }
  .tag-pill { transition: box-shadow 0.15s; cursor: default; }
  .tag-pill:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .action-btn { transition: background 0.15s, color 0.15s, opacity 0.15s; }
  .action-btn:hover { opacity: 0.85; }
  .modal-overlay { animation: fadeSlideIn 0.18s ease both; }
  .modal-card { animation: fadeSlideIn 0.26s cubic-bezier(.34,1.2,.64,1) both; }
  .search-input:focus { box-shadow: 0 0 0 3px rgba(193,18,31,0.1); }
  .page-btn { transition: background 0.14s, color 0.14s, transform 0.12s; }
  .page-btn:hover:not(:disabled) { transform: scale(1.1); }
`;

type Product = {
  id: number;
  name: string;
  description: string;
  tags: string[];
  image_id: string[];
  is_active: boolean;
  created_at: string;
  currentPrice?: number;
  image_url: string;
  sales: number;
  quantity: number;
  rating: string;
};

type Variant = {
  id: number;
  item_id: number;
  size: string;
  color: string;
  quantity: number;
};

type SortKey = "price" | "name" | "tags" | null;
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return (<span className="flex flex-col gap-px opacity-25"><FiChevronUp className="w-3 h-3 -mb-1" /><FiChevronDown className="w-3 h-3" /></span>);
  return dir === "asc" ? <FiChevronUp className="w-4 h-4 spin-in text-[#C1121F]" /> : <FiChevronDown className="w-4 h-4 spin-in text-[#C1121F]" />;
}

function SortHeader({ label, sortKey, current, dir, onSort, disabled = false }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void; disabled?: boolean;
}) {
  const active = !disabled && current === sortKey;
  return (
    <button onClick={() => !disabled && onSort(sortKey)} disabled={disabled}
      className={`sort-btn flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg ${disabled ? "text-gray-300 cursor-default" : active ? "text-[#C1121F] bg-red-50" : "text-[#8181A5] hover:text-[#1C1D21] hover:bg-gray-100"}`}
    >
      {!disabled && <SortIcon active={active} dir={dir} />}
      {label}
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 items-center bg-[#F9FAFB] rounded-2xl px-6 py-4">
      <div className="col-span-4 flex items-center gap-4">
        <div className="w-4 h-4 shimmer-line rounded" />
        <div className="w-12 h-12 shimmer-line rounded-xl shrink-0" />
        <div className="h-4 w-36 shimmer-line" />
      </div>
      {[1, 1, 2, 2, 1].map((span, i) => (
        <div key={i} className={`col-span-${span} flex flex-col items-center gap-1.5`}>
          <div className="h-4 w-10 shimmer-line" />
          <div className="h-3 w-7 shimmer-line" />
        </div>
      ))}
      <div className="col-span-1 flex justify-end"><div className="w-8 h-8 shimmer-line rounded-full" /></div>
    </div>
  );
}

function ModalWrapper({ onClose, title, children, wide }: { onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs">
      <div className={`modal-card bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} mx-4 p-6 border border-gray-100 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="products-title text-xl text-[#1C1D21]">{title}</h2>
          <button onClick={onClose} className="action-btn p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><FiX className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, textarea, type }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; textarea?: boolean; type?: string;
}) {
  const cls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-gray-50 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#C1121F] transition";
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
      {textarea ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} /> : <input type={type ?? "text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />}
    </div>
  );
}

const MAX_PRODUCT_IMAGES = 8;
type ProductImageEntry = { id: string; file: File; preview: string };
const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL"];
const AVAILABLE_COLORS = ["Red", "Blue", "White", "Beige", "Black", "Yellow", "Green"];

function AddItemModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [images, setImages] = useState<ProductImageEntry[]>([]);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", tags: "", basePrice: "", initialQuantity: "0", sizes: [] as string[], colors: [] as string[] });
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => { return () => { imagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview)); }; }, []);

  const handleSubmit = () => {
    setError("");
    if (!form.name || !form.description || !form.basePrice) { setError("Name, description and price are required."); return; }
    startTransition(async () => {
      try {
        const tagsArray = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
        const slug = form.name.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 48) || "item";
        let image_paths: string[] | null = null;
        if (images.length > 0) {
          const sb = createClient();
          const { data: { user }, error: authErr } = await sb.auth.getUser();
          if (authErr || !user) throw new Error("[Upload] You are not signed in. Open /login in this browser, sign in, then try again.");
          image_paths = [];
          const t0 = Date.now();
          for (let i = 0; i < images.length; i++) {
            const file = images[i].file;
            const rawExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
            const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(rawExt) ? rawExt : "jpg";
            const filePath = `Uploaded/${t0}-${i}-${slug}.${ext}`;
            const { data: up, error: upErr } = await sb.storage.from(BUCKET_NAME).upload(filePath, file, { contentType: file.type || "image/jpeg", upsert: false });
            if (upErr || !up) throw new Error(`[Upload] ${upErr?.message ?? "Failed to upload image"}`);
            image_paths.push(up.path);
          }
        }
        await createItem({
          name: form.name,
          description: form.description,
          tags: JSON.stringify(tagsArray),
          image_paths,
          basePrice: parseFloat(form.basePrice),
          sizes: JSON.stringify(form.sizes),
          colors: JSON.stringify(form.colors),
          initialQuantity: parseInt(form.initialQuantity) || 0,
        });
        onSuccess(); onClose();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to create item";
        setError(msg.startsWith("[") ? msg : `[Save] ${msg}`);
      }
    });
  };

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const room = MAX_PRODUCT_IMAGES - images.length;
    const next = acceptedFiles.slice(0, Math.max(0, room));
    setImages((prev) => [...prev, ...next.map((f) => ({ id: crypto.randomUUID(), file: f, preview: URL.createObjectURL(f) }))]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => { const row = prev.find((i) => i.id === id); if (row) URL.revokeObjectURL(row.preview); return prev.filter((i) => i.id !== id); });
  };

  const replaceFromCrop = (index: number, file: File) => {
    setImages((prev) => prev.map((row, i) => { if (i !== index) return row; URL.revokeObjectURL(row.preview); return { ...row, file, preview: URL.createObjectURL(file) }; }));
    setCropIndex(null);
  };

  const toggleSelection = (field: "sizes" | "colors", value: string) => {
    setForm((prev) => { const currentList = prev[field]; return currentList.includes(value) ? { ...prev, [field]: currentList.filter((item) => item !== value) } : { ...prev, [field]: [...currentList, value] }; });
  };

  const totalVariants = form.sizes.length * form.colors.length;

  return (
    <>
      {cropIndex !== null && images[cropIndex] && (
        <ProductImageCropModal imageSrc={images[cropIndex].preview} fileName={images[cropIndex].file.name} onClose={() => setCropIndex(null)} onApply={(file) => replaceFromCrop(cropIndex, file)} />
      )}
      <ModalWrapper onClose={onClose} title="Add New Item">
        <div className="space-y-4">
          <Field label="Product Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Knitted Sweater" />
          <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Product description..." textarea />
          <Field label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} placeholder="e.g. Women, Tops" />
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Available Sizes</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SIZES.map((size) => (
                <label key={size} className={`flex items-center gap-2 cursor-pointer border px-3 py-1.5 rounded-lg transition ${form.sizes.includes(size) ? "bg-red-50 border-[#C1121F]/30" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}>
                  <input type="checkbox" checked={form.sizes.includes(size)} onChange={() => toggleSelection("sizes", size)} className="accent-[#C1121F] w-3.5 h-3.5 cursor-pointer" />
                  <span className="text-sm font-medium text-gray-700">{size}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Available Colors</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map((color) => (
                <label key={color} className={`flex items-center gap-2 cursor-pointer border px-3 py-1.5 rounded-lg transition ${form.colors.includes(color) ? "bg-red-50 border-[#C1121F]/30" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}>
                  <input type="checkbox" checked={form.colors.includes(color)} onChange={() => toggleSelection("colors", color)} className="accent-[#C1121F] w-3.5 h-3.5 cursor-pointer" />
                  <span className="text-sm font-medium text-gray-700">{color}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Initial Stock per Variant</label>
            <input
              type="number"
              min="0"
              value={form.initialQuantity}
              onChange={e => setForm({ ...form, initialQuantity: e.target.value })}
              placeholder="0"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-gray-50 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#C1121F] transition"
            />
            {totalVariants > 0 && (
              <p className="text-[11px] text-gray-400 mt-1.5">
                {totalVariants} variants × {form.initialQuantity || 0} units = <span className="font-bold text-gray-600">{totalVariants * (parseInt(form.initialQuantity) || 0)} total stock</span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Images (up to {MAX_PRODUCT_IMAGES})</label>
            <Dropzone onDrop={handleDrop} accept={{ "image/*": [] }} multiple disabled={images.length >= MAX_PRODUCT_IMAGES}>
              {({ getRootProps, getInputProps }) => (
                <section className="w-full border border-dashed border-gray-200 rounded-xl px-4 py-6 text-sm bg-gray-50 cursor-pointer hover:border-[#C1121F]/40 transition">
                  <div {...getRootProps()} className="text-center">
                    <input {...getInputProps()} />
                    <p className="text-gray-500">{images.length >= MAX_PRODUCT_IMAGES ? "Maximum images reached" : "Drag images here, or click to select (multiple allowed)"}</p>
                    <p className="text-[11px] text-gray-400 mt-1">Crop &amp; rotate each image after adding if needed</p>
                  </div>
                </section>
              )}
            </Dropzone>
            {images.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {images.map((img, index) => (
                  <li key={img.id} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0">
                    <Image src={img.preview} alt="" width={80} height={80} className="object-cover w-full h-full" unoptimized />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      <button type="button" onClick={() => setCropIndex(index)} className="text-[10px] font-bold text-white bg-[#C1121F] px-1.5 py-0.5 rounded">Crop</button>
                      <button type="button" onClick={() => removeImage(img.id)} className="text-[10px] font-bold text-white bg-gray-800 px-1.5 py-0.5 rounded">×</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Field label="Base Price (₱)" value={form.basePrice} onChange={(v) => setForm({ ...form, basePrice: v })} placeholder="e.g. 999" type="number" />
          {error && <p className="text-red-500 text-xs font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="action-btn px-5 py-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-sm font-medium">Cancel</button>
            <button onClick={handleSubmit} disabled={isPending} className="action-btn px-5 py-2 rounded-xl bg-[#C1121F] text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 pulse-glow">{isPending ? "Creating..." : "Create Item"}</button>
          </div>
        </div>
      </ModalWrapper>
    </>
  );
}

function EditItemModal({ product, onClose, onSuccess }: { product: Product; onClose: () => void; onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: product.name, description: product.description, tags: product.tags?.join(", ") ?? "" });

  const handleSubmit = () => {
    setError("");
    if (!form.name || !form.description) { setError("Name and description are required."); return; }
    startTransition(async () => {
      try {
        const tagsArray = form.tags.split(",").map(t => t.trim()).filter(Boolean);
        await updateItem({ itemId: product.id, name: form.name, description: form.description, tags: JSON.stringify(tagsArray) });
        onSuccess(); onClose();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to update item");
      }
    });
  };

  return (
    <ModalWrapper onClose={onClose} title="Edit Item">
      <div className="space-y-4">
        <Field label="Product Name" value={form.name} onChange={v => setForm({ ...form, name: v })} />
        <Field label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} textarea />
        <Field label="Tags (comma separated)" value={form.tags} onChange={v => setForm({ ...form, tags: v })} />
        {error && <p className="text-red-500 text-xs font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="action-btn px-5 py-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-sm font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending} className="action-btn px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">{isPending ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function EditQuantityModal({ product, onClose, onSuccess }: { product: Product; onClose: () => void; onSuccess: () => void }) {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchVariants = async () => {
      setLoading(true);
      const { data: variantData } = await supabase
        .from("item_variants")
        .select("id, item_id, size, color")
        .eq("item_id", product.id)
        .order("size");

      if (variantData) {
        const variantIds = variantData.map(v => v.id);
        const { data: invData } = await supabase
          .from("inventory")
          .select("variant_id, quantity")
          .in("variant_id", variantIds);

        const invMap: Record<number, number> = {};
        (invData ?? []).forEach(i => { invMap[i.variant_id] = i.quantity; });

        const withQty = variantData.map(v => ({ ...v, quantity: invMap[v.id] ?? 0 }));
        setVariants(withQty);
        const qtyMap: Record<number, number> = {};
        withQty.forEach(v => { qtyMap[v.id] = v.quantity; });
        setQuantities(qtyMap);
      }
      setLoading(false);
    };
    fetchVariants();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await Promise.all(
          variants.map(v =>
            supabase.from("inventory").update({ quantity: quantities[v.id] ?? 0 }).eq("variant_id", v.id)
          )
        );
        onSuccess();
        onClose();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to save stock");
      }
    });
  };

  const colors = [...new Set(variants.map(v => v.color))];
  const sizes = [...new Set(variants.map(v => v.size))];

  return (
    <ModalWrapper onClose={onClose} title={`Edit Stock — ${product.name}`} wide>
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 shimmer-line rounded-xl" />)}</div>
        ) : variants.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No variants found for this product.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-3 pr-4">Size / Color</th>
                  {colors.map(color => (
                    <th key={color} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-3 px-2">{color}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizes.map(size => (
                  <tr key={size} className="border-t border-gray-100">
                    <td className="py-2.5 pr-4">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">{size}</span>
                    </td>
                    {colors.map(color => {
                      const variant = variants.find(v => v.size === size && v.color === color);
                      return (
                        <td key={color} className="py-2.5 px-2 text-center">
                          {variant ? (
                            <input
                              type="number"
                              min="0"
                              value={quantities[variant.id] ?? 0}
                              onChange={e => setQuantities(prev => ({ ...prev, [variant.id]: parseInt(e.target.value) || 0 }))}
                              className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                            />
                          ) : (
                            <span className="text-gray-200 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Total stock: <span className="font-bold text-gray-600">{Object.values(quantities).reduce((a, b) => a + b, 0)}</span></p>
            </div>
          </div>
        )}
        {error && <p className="text-red-500 text-xs font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="action-btn px-5 py-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-sm font-medium">Cancel</button>
          <button onClick={handleSave} disabled={isPending || loading || variants.length === 0} className="action-btn px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">{isPending ? "Saving..." : "Save Stock"}</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function DeleteConfirmModal({ product, onClose, onSuccess }: { product: Product; onClose: () => void; onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleDelete = () => {
    startTransition(async () => {
      try { await deleteItem(product.id); onSuccess(); onClose(); }
      catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to delete item"); }
    });
  };

  return (
    <ModalWrapper onClose={onClose} title="Remove Item">
      <div className="space-y-4">
        <p className="text-gray-500 text-sm leading-relaxed">
          Are you sure you want to remove <span className="font-bold text-[#1C1D21]">&ldquo;{product.name}&rdquo;</span>?<br />
          <span className="text-xs text-gray-400 mt-1 block">This will permanently delete the item and all its variants.</span>
        </p>
        {error && <p className="text-red-500 text-xs font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="action-btn px-5 py-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-sm font-medium">Cancel</button>
          <button onClick={handleDelete} disabled={isPending} className="action-btn px-5 py-2 rounded-xl bg-[#A52A2A] text-white text-sm font-semibold hover:bg-red-900 disabled:opacity-60">{isPending ? "Removing..." : "Yes, Remove"}</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function SpecialPriceModal({ product, onClose, onSuccess }: { product: Product; onClose: () => void; onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ specialPrice: "", validTo: "" });

  const basePrice = product.currentPrice ?? 0;
  const specialPrice = form.specialPrice ? parseFloat(form.specialPrice) : null;
  const discount = basePrice && specialPrice ? basePrice - specialPrice : 0;
  const discountPercent = basePrice && basePrice > 0 ? ((discount / basePrice) * 100).toFixed(1) : 0;
  const isInvalid = specialPrice !== null && specialPrice > basePrice;

  const handleSubmit = () => {
    setError("");
    if (!form.specialPrice || !form.validTo) { setError("Special price and valid date are required."); return; }
    if (isInvalid) { setError("Special price cannot be higher than base price."); return; }
    startTransition(async () => {
      try {
        await addSpecialPrice({ itemId: product.id, specialPrice: parseFloat(form.specialPrice), validTo: form.validTo });
        onSuccess(); onClose();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to add special price");
      }
    });
  };

  return (
    <ModalWrapper onClose={onClose} title="Add Special Price">
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Product</label>
          <p className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-gray-50">{product.name}</p>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Base Price (₱)</label>
          <p className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-gray-50 font-semibold">₱{basePrice.toLocaleString()}</p>
        </div>
        <div className="space-y-4">
          <Field label="Special Price (₱)" value={form.specialPrice} onChange={v => setForm({ ...form, specialPrice: v })} placeholder="e.g. 799" type="number" />
          <Field label="Valid Until" value={form.validTo} onChange={v => setForm({ ...form, validTo: v })} type="date" />
          {form.specialPrice && (
            <div className={`${isInvalid ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"} border rounded-lg px-3 py-2.5 mt-3`}>
              <p className={`text-xs ${isInvalid ? "text-red-500" : "text-gray-500"} uppercase tracking-widest font-bold`}>{isInvalid ? "Invalid Price" : "Discount"}</p>
              <p className={`text-lg font-bold ${isInvalid ? "text-red-600" : "text-blue-600"}`}>{isInvalid ? "Price must be lower than base price" : `₱${discount.toLocaleString()} (${discountPercent}%)`}</p>
            </div>
          )}
        </div>
        {error && <p className="text-red-500 text-xs font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="action-btn px-5 py-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-sm font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending || isInvalid} className="action-btn px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">{isPending ? "Adding..." : "Add Special Price"}</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function RowMenu({ product, onEdit, onDelete, onAddSpecialPrice, onEditQuantity }: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onAddSpecialPrice: (p: Product) => void;
  onEditQuantity: (p: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (btnRef.current && btnRef.current.contains(e.target as Node)) return; setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleClick = () => {
    if (btnRef.current) { const rect = btnRef.current.getBoundingClientRect(); setCoords({ top: rect.bottom + window.scrollY + 6, left: rect.right - 180 }); }
    setOpen(p => !p);
  };

  const menu = open ? (
    <div onMouseDown={e => e.stopPropagation()} style={{ position: "absolute", top: coords.top, left: coords.left, zIndex: 99999, width: 190 }} className="bg-[#1C1D21] rounded-xl shadow-2xl py-1">
      <button onClick={() => { setOpen(false); onAddSpecialPrice(product); }} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-medium text-blue-400 hover:bg-white/10 hover:text-blue-300 transition"><FiEdit2 className="w-3.5 h-3.5" /> Add Special Price</button>
      <div className="h-px bg-white/10 mx-3" />
      <button onClick={() => { setOpen(false); onEditQuantity(product); }} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-medium text-emerald-400 hover:bg-white/10 hover:text-emerald-300 transition"><FiEdit2 className="w-3.5 h-3.5" /> Edit Stock</button>
      <div className="h-px bg-white/10 mx-3" />
      <button onClick={() => { setOpen(false); onEdit(product); }} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-white transition"><FiEdit2 className="w-3.5 h-3.5" /> Edit</button>
      <div className="h-px bg-white/10 mx-3" />
      <button onClick={() => { setOpen(false); onDelete(product); }} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-medium text-red-400 hover:bg-white/10 hover:text-red-300 transition"><FiTrash2 className="w-3.5 h-3.5" /> Remove</button>
    </div>
  ) : null;

  return (
    <>
      <button ref={btnRef} onClick={handleClick} className={`p-2 rounded-full transition-colors ${open ? "bg-gray-200 text-[#1C1D21]" : "text-[#7D7D7D] hover:bg-gray-200"}`}><LuList className="w-5 h-5" /></button>
      {typeof window !== "undefined" && menu && createPortal(menu, document.body)}
    </>
  );
}

const TAG_COLORS: Record<string, string> = {
  Women: "bg-pink-100 text-pink-700", Men: "bg-blue-100 text-blue-700", Tops: "bg-amber-100 text-amber-700",
  Dress: "bg-purple-100 text-purple-700", Bottoms: "bg-emerald-100 text-emerald-700", Accessories: "bg-orange-100 text-orange-700",
  Shirt: "bg-sky-100 text-sky-700", Jacket: "bg-yellow-100 text-yellow-800", Trouser: "bg-indigo-100 text-indigo-700",
  Short: "bg-teal-100 text-teal-700", Polo: "bg-cyan-100 text-cyan-700",
};
const getTagColor = (tag: string) => TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600";

const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  const supabase = createClient();

  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [search, setSearch]           = useState("");
  const [sortKey, setSortKey]         = useState<SortKey>(null);
  const [sortDir, setSortDir]         = useState<SortDir>("asc");
  const [showAdd, setShowAdd]                         = useState(false);
  const [editProduct, setEditProduct]                 = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct]             = useState<Product | null>(null);
  const [specialPriceProduct, setSpecialPriceProduct] = useState<Product | null>(null);
  const [editQuantityProduct, setEditQuantityProduct] = useState<Product | null>(null);
  const [isPending, startTransition]                  = useTransition();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchProducts = useCallback(async (page = 1, query = "") => {
    setLoading(true);
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to   = from + ITEMS_PER_PAGE - 1;

    let req = supabase.from("items").select("*", { count: "exact" }).eq("is_active", true).order("id", { ascending: true }).range(from, to);
    if (query.trim()) req = req.ilike("name", `%${query.trim()}%`);

    const { data, error, count } = await req;

    if (!error && data) {
      const itemIds = data.map(i => i.id);

      const priceResults = await Promise.all(data.map(async item => {
        const { data: priceData } = await supabase.from("prices").select("price").eq("item_id", item.id)
          .or(`valid_to.is.null,valid_to.gte.${new Date().toISOString()}`).order("priority", { ascending: false }).limit(1).single();
        const firstImageId = item.image_id?.[0] ?? null;
        const imageUrl = firstImageId ? supabase.storage.from(BUCKET_NAME).getPublicUrl(firstImageId).data.publicUrl : "/images/placeholder.jpg";
        return { id: item.id, currentPrice: priceData?.price ?? null, image_url: imageUrl };
      }));

      const priceMap: Record<number, { price: number | null; image_url: string }> = {};
      priceResults.forEach(r => { priceMap[r.id] = { price: r.currentPrice, image_url: r.image_url }; });

      const { data: variants } = await supabase.from("item_variants").select("id, item_id").in("item_id", itemIds);
      const variantIds = (variants ?? []).map(v => v.id);

      const { data: inventory } = await supabase.from("inventory").select("variant_id, quantity").in("variant_id", variantIds);
      const inventoryMap: Record<number, number> = {};
      (inventory ?? []).forEach(inv => { inventoryMap[inv.variant_id] = inv.quantity; });
      const itemQuantityMap: Record<number, number> = {};
      (variants ?? []).forEach(v => { itemQuantityMap[v.item_id] = (itemQuantityMap[v.item_id] ?? 0) + (inventoryMap[v.id] ?? 0); });

      const { data: reviews } = await supabase.from("reviews").select("item_id, rating").in("item_id", itemIds);
      const ratingMap: Record<number, { total: number; count: number }> = {};
      (reviews ?? []).forEach(r => { if (!ratingMap[r.item_id]) ratingMap[r.item_id] = { total: 0, count: 0 }; ratingMap[r.item_id].total += r.rating; ratingMap[r.item_id].count += 1; });

      const { data: orderItems } = await supabase.from("order_items").select("variant_id, quantity").in("variant_id", variantIds);
      const variantItemMap: Record<number, number> = {};
      (variants ?? []).forEach(v => { variantItemMap[v.id] = v.item_id; });
      const salesMap: Record<number, number> = {};
      (orderItems ?? []).forEach(oi => { const itemId = variantItemMap[oi.variant_id]; if (itemId) salesMap[itemId] = (salesMap[itemId] ?? 0) + (oi.quantity ?? 1); });

      const withData = data.map(item => {
        const ratingData = ratingMap[item.id];
        const avgRating = ratingData ? (ratingData.total / ratingData.count).toFixed(1) : "—";
        return {
          ...item,
          currentPrice: priceMap[item.id]?.price ?? null,
          image_url: priceMap[item.id]?.image_url ?? "/images/placeholder.jpg",
          sales: salesMap[item.id] ?? 0,
          quantity: itemQuantityMap[item.id] ?? 0,
          rating: avgRating,
        };
      });

      setProducts(withData);
      setTotalCount(count ?? 0);
      setTotalPages(Math.max(1, Math.ceil((count ?? 0) / ITEMS_PER_PAGE)));
    }
    setLoading(false);
  }, []); // supabase client is stable, intentionally omitted

  useEffect(() => { fetchProducts(currentPage, search); }, [currentPage, fetchProducts, search]);
  useEffect(() => {
    const t = setTimeout(() => { setCurrentPage(1); fetchProducts(1, search); }, 400);
    return () => clearTimeout(t);
  }, [search, fetchProducts]);

  const handleSort = (key: SortKey) => {
    if (!key) return;
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (!sortKey) return 0;
    let av: string | number, bv: string | number;
    if (sortKey === "price") { av = a.currentPrice ?? 0; bv = b.currentPrice ?? 0; }
    else if (sortKey === "name") { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
    else { av = a.tags?.[0]?.toLowerCase() ?? ""; bv = b.tags?.[0]?.toLowerCase() ?? ""; }
    return sortDir === "asc" ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
  });

  const toggleSelect = (id: number) => setSelected(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

  const handleBulkRemove = () => {
    if (!selected.length) return;
    startTransition(async () => { await Promise.all(selected.map(id => deleteItem(id))); setSelected([]); fetchProducts(currentPage, search); });
  };

  return (
    <div className="products-page w-full">
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onSuccess={() => fetchProducts(currentPage, search)} />}
      {editProduct && <EditItemModal product={editProduct} onClose={() => setEditProduct(null)} onSuccess={() => fetchProducts(currentPage, search)} />}
      {deleteProduct && <DeleteConfirmModal product={deleteProduct} onClose={() => setDeleteProduct(null)} onSuccess={() => fetchProducts(currentPage, search)} />}
      {specialPriceProduct && <SpecialPriceModal product={specialPriceProduct} onClose={() => setSpecialPriceProduct(null)} onSuccess={() => fetchProducts(currentPage, search)} />}
      {editQuantityProduct && <EditQuantityModal product={editQuantityProduct} onClose={() => setEditQuantityProduct(null)} onSuccess={() => fetchProducts(currentPage, search)} />}

      <div className="fade-slide-in mb-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-baseline gap-3 shrink-0">
            <h1 className="products-title text-3xl text-[#C1121F] tracking-tight">Products</h1>
            {!loading && <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wide">{totalCount} items</span>}
          </div>
          <div className="relative w-full max-w-sm">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="search-input w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#C1121F] transition bg-[#F9FAFB] placeholder:text-gray-300" />
            {search && <button onClick={() => setSearch("")} className="action-btn absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><FiX className="w-4 h-4" /></button>}
          </div>
        </div>
        <div className="flex items-center justify-between mt-5">
          <div className="flex items-center gap-2 h-9">
            {selected.length > 0 && <button onClick={() => setSelected([])} className="fade-slide-in action-btn flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#C1121F] bg-gray-100 hover:bg-red-50 px-4 py-2 rounded-xl transition uppercase tracking-wide"><FiX className="w-3.5 h-3.5" />Deselect All ({selected.length})</button>}
            {sortKey && <button onClick={() => { setSortKey(null); setSortDir("asc"); }} className="fade-slide-in action-btn flex items-center gap-2 text-xs font-bold text-[#C1121F] hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition uppercase tracking-wide"><FiX className="w-3.5 h-3.5" />Clear Sort</button>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAdd(true)} className="action-btn flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl text-[13px] font-bold hover:bg-blue-100 transition"><FiPlus className="w-4 h-4" /> Add Item</button>
            <button onClick={handleBulkRemove} disabled={selected.length === 0 || isPending} className="action-btn flex items-center gap-2 bg-[#A52A2A] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold hover:bg-red-900 transition disabled:opacity-40"><IoMdRemoveCircleOutline className="w-4 h-4" />Remove {selected.length > 0 ? `(${selected.length})` : ""}</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 px-6 py-3 mb-1">
        <div className="col-span-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-8 flex items-center"><SortHeader label="Name" sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} /></div>
        <div className="col-span-1 flex justify-center"><SortHeader label="Sales" sortKey={null} current={sortKey} dir={sortDir} onSort={handleSort} disabled /></div>
        <div className="col-span-1 flex justify-center"><SortHeader label="Qty" sortKey={null} current={sortKey} dir={sortDir} onSort={handleSort} disabled /></div>
        <div className="col-span-2 flex justify-center"><SortHeader label="Rating" sortKey={null} current={sortKey} dir={sortDir} onSort={handleSort} disabled /></div>
        <div className="col-span-2 flex justify-center"><SortHeader label="Price" sortKey="price" current={sortKey} dir={sortDir} onSort={handleSort} /></div>
        <div className="col-span-1 flex justify-center"><SortHeader label="Tag" sortKey="tags" current={sortKey} dir={sortDir} onSort={handleSort} /></div>
        <div className="col-span-1" />
      </div>

      {loading ? (
        <div className="space-y-2.5">{Array.from({ length: 6 }).map((_, i) => (<div key={i} style={{ animationDelay: `${i * 55}ms` }} className="row-in"><SkeletonRow /></div>))}</div>
      ) : sortedProducts.length === 0 ? (
        <div className="fade-slide-in text-center py-28"><p className="products-title text-3xl text-gray-200 italic mb-2">No products found</p><p className="text-sm text-gray-400">Try adjusting your search term</p></div>
      ) : (
        <div className="space-y-2 mb-12">
          {sortedProducts.map((product, i) => (
            <div key={product.id} style={{ animationDelay: `${i * 35}ms` }} className={`row-in product-row grid grid-cols-12 items-center rounded-2xl px-6 py-4 ${selected.includes(product.id) ? "bg-red-50 ring-1 ring-red-200" : "bg-[#F9FAFB]"}`}>
              <div className="col-span-4 flex items-center gap-4">
                <input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggleSelect(product.id)} className="w-4 h-4 accent-[#C1121F] cursor-pointer shrink-0" />
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                  <Image src={product.image_url} alt={product.name} width={40} height={40} className="object-contain" unoptimized />
                </div>
                <span className="font-semibold text-[14px] text-[#1C1D21] leading-snug">{product.name}</span>
              </div>
              <div className="col-span-1 text-center">
                <p className="font-bold text-[15px] text-[#1C1D21]">{product.sales}</p>
                <span className="text-[10px] font-bold text-[#8181A5] uppercase tracking-wider">Sales</span>
              </div>
              <div className="col-span-1 text-center">
                <p className="font-bold text-[15px] text-[#1C1D21]">{product.quantity}</p>
                <span className="text-[10px] font-bold text-[#8181A5] uppercase tracking-wider">Qty.</span>
              </div>
              <div className="col-span-2 text-center">
                <p className="font-bold text-[15px] text-[#1C1D21]">{product.rating === "—" ? "—" : `${product.rating} / 5.0`}</p>
                <span className="text-[10px] font-bold text-[#8181A5] uppercase tracking-wider">Rating</span>
              </div>
              <div className="col-span-2 text-center">
                <p className="font-bold text-[15px] text-[#C1121F]">{product.currentPrice != null ? `₱${product.currentPrice.toLocaleString()}` : "—"}</p>
                <span className="text-[10px] font-bold text-[#8181A5] uppercase tracking-wider">Price</span>
              </div>
              <div className="col-span-1 flex justify-center">
                {product.tags?.[0] ? <span className={`tag-pill text-[11px] font-bold px-3 py-1 rounded-lg ${getTagColor(product.tags[0])}`}>{product.tags[0]}</span> : <span className="text-gray-300 text-sm font-bold">—</span>}
              </div>
              <div className="col-span-1 flex justify-end">
                <RowMenu product={product} onEdit={setEditProduct} onDelete={setDeleteProduct} onAddSpecialPrice={setSpecialPriceProduct} onEditQuantity={setEditQuantityProduct} />
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="fade-slide-in flex justify-center items-center mt-10 gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="page-btn flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm font-bold disabled:opacity-30 transition">← Prev</button>
          <div className="flex items-center gap-1.5 mx-3">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`page-btn w-9 h-9 rounded-xl text-sm font-bold transition ${page === currentPage ? "bg-[#C1121F] text-white shadow-md pulse-glow" : "text-gray-500 hover:bg-gray-100"}`}>{page}</button>
            ))}
          </div>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="page-btn flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm font-bold disabled:opacity-30 transition">Next →</button>
        </div>
      )}
    </div>
  );
}