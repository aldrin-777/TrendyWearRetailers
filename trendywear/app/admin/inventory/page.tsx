"use client";

import { LuArrowUpDown, LuList } from "react-icons/lu";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

const BUCKET_NAME = "images";
const ITEMS_PER_PAGE = 10;

type InventoryItem = {
  id: number;
  name: string;
  image: string;
  price: number;
  tags: string[];
};

export default function InventoryPage() {
  const [selected, setSelected] = useState<number[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchItems = useCallback(async (page: number) => {
    const supabase = createClient();
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to   = from + ITEMS_PER_PAGE - 1;

    const { data, count } = await supabase
      .from("items")
      .select("id, name, image_id, tags", { count: "exact" })
      .eq("is_active", true)
      .order("id", { ascending: true })
      .range(from, to);

    if (data && data.length > 0) {
      const itemIds = data.map(i => i.id);
      const { data: prices } = await supabase
        .from("prices")
        .select("item_id, price")
        .in("item_id", itemIds);

      const priceMap: Record<number, number> = {};
      (prices ?? []).forEach(p => { if (!(p.item_id in priceMap)) priceMap[p.item_id] = p.price; });

      const mapped = data.map(item => {
        const firstImageId = item.image_id?.[0] ?? null;
        const imageUrl = firstImageId
          ? supabase.storage.from(BUCKET_NAME).getPublicUrl(firstImageId).data.publicUrl
          : "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf";
        return {
          id: item.id,
          name: item.name ?? "Unnamed",
          image: imageUrl,
          price: priceMap[item.id] ?? 0,
          tags: item.tags ?? [],
        };
      });
      return { items: mapped, count: count ?? 0 };
    }
    return { items: [], count: 0 };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchItems(currentPage).then(result => {
      if (cancelled) return;
      setItems(result.items);
      setTotalPages(Math.max(1, Math.ceil(result.count / ITEMS_PER_PAGE)));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchItems, currentPage]);

  const toggleSelect = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div className="w-full">
      <div className="mb-12">
        <h1 className="text-[48px] font-bold text-[#C1121F] tracking-tight">Inventory</h1>
      </div>

      <div className="grid grid-cols-12 px-6 py-4 text-[14px] text-[#8181A5] font-semibold">
        <div className="col-span-4">Name</div>
        <div className="col-span-1 flex items-center justify-center space-x-2">
          <button className="p-1 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"><LuArrowUpDown className="w-4 h-4 text-gray-500" /></button>
          <span>Sales</span>
        </div>
        <div className="col-span-1 flex items-center justify-center space-x-2">
          <button className="p-1 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"><LuArrowUpDown className="w-4 h-4 text-gray-500" /></button>
          <span>Qty.</span>
        </div>
        <div className="col-span-2 flex items-center justify-center space-x-2">
          <button className="p-1 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"><LuArrowUpDown className="w-4 h-4 text-gray-500" /></button>
          <span>Rating</span>
        </div>
        <div className="col-span-2 flex items-center justify-center space-x-2">
          <button className="p-1 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"><LuArrowUpDown className="w-4 h-4 text-gray-500" /></button>
          <span>Price</span>
        </div>
        <div className="col-span-1 flex items-center justify-center space-x-2">
          <button className="p-1 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"><LuArrowUpDown className="w-4 h-4 text-gray-500" /></button>
          <span>Tag</span>
        </div>
        <div className="col-span-1"></div>
      </div>

      <div className="space-y-4 mb-75">
        {loading ? (
          <p className="text-gray-400 text-sm px-6">Loading inventory...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-400 text-sm px-6">No items found.</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="grid grid-cols-12 items-center bg-[#F9FAFB] rounded-2xl px-6 py-4">
              <div className="col-span-4 flex items-center gap-4">
                <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} className="w-4 h-4 accent-blue-600" />
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm overflow-hidden">
                  <Image src={item.image} alt={item.name} width={40} height={40} className="object-contain" unoptimized />
                </div>
                <span className="font-semibold text-[16px] text-[#1C1D21]">{item.name}</span>
              </div>
              <div className="col-span-1 text-center text-sm">
                <p className="font-semibold text-[16px] text-[#1C1D21]">—</p>
                <span className="text-[#8181A5] text-[14px]">Sales</span>
              </div>
              <div className="col-span-1 text-center text-sm">
                <p className="font-semibold text-[16px] text-[#1C1D21]">—</p>
                <span className="text-[#8181A5] text-[14px]">Qty.</span>
              </div>
              <div className="col-span-2 text-center text-sm">
                <p className="font-semibold text-[16px] text-[#1C1D21]">—</p>
                <span className="text-[#8181A5] text-[14px]">Rating</span>
              </div>
              <div className="col-span-2 text-center text-sm">
                <p className="font-semibold text-[#1C1D21]">₱{item.price.toLocaleString()}</p>
                <span className="text-[#8181A5] text-[14px]">Price</span>
              </div>
              <div className="col-span-1 flex justify-center">
                <span className="bg-[#FFE680] text-[#58585B] text-[14px] font-semibold px-4 py-1.5 rounded-lg">
                  {item.tags[0] ?? "—"}
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button className="p-2 rounded-full hover:bg-gray-200 transition-colors text-[#7D7D7D] flex items-center justify-center" aria-label="More options">
                  <LuList className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-center items-center mt-12 text-sm">
        <div className="flex items-center gap-2 mr-12">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40">&lt;</button>
          <span className="text-gray-500">Prev</span>
        </div>
        <div className="flex items-center gap-5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded-lg font-bold ${page === currentPage ? "bg-red-600 text-white" : "text-black hover:bg-gray-200"}`}>
              {page}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-12">
          <span className="text-gray-500">Next</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40">&gt;</button>
        </div>
      </div>
    </div>
  );
}