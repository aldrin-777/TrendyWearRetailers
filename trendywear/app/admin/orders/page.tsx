"use client";

import { LuArrowUpDown } from "react-icons/lu";
import { LuList } from "react-icons/lu";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

const BUCKET_NAME = "images";
const ITEMS_PER_PAGE = 10;

type OrderRow = {
  id: number;
  order_id: number;
  name: string;
  image: string;
  quantity: number;
  price: number;
  tags: string[];
};

export default function ProductsPage() {
  const [selected, setSelected] = useState<number[]>([]);
  const [products, setProducts] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrderItems = useCallback(async (page: number) => {
    const supabase = createClient();
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to   = from + ITEMS_PER_PAGE - 1;

    // Fetch order_items with count
    const { data: orderItems, count } = await supabase
      .from("order_items")
      .select("id, orders_id, product_id, quantity, price_at_checkout", { count: "exact" })
      .order("id", { ascending: false })
      .range(from, to);

    if (orderItems && orderItems.length > 0) {
      const productIds = [...new Set(orderItems.map(i => i.product_id))];

      // Fetch item details
      const { data: items } = await supabase
        .from("items")
        .select("id, name, image_id, tags")
        .in("id", productIds);

      const itemMap: Record<number, { name: string; image: string; tags: string[] }> = {};
      (items ?? []).forEach(item => {
        const firstImageId = item.image_id?.[0] ?? null;
        const imageUrl = firstImageId
          ? supabase.storage.from(BUCKET_NAME).getPublicUrl(firstImageId).data.publicUrl
          : "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf";
        itemMap[item.id] = {
          name: item.name ?? "Unnamed",
          image: imageUrl,
          tags: item.tags ?? [],
        };
      });

      const mapped = orderItems.map(oi => ({
        id: oi.id,
        order_id: oi.orders_id,
        name: itemMap[oi.product_id]?.name ?? "Unknown Item",
        image: itemMap[oi.product_id]?.image ?? "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf",
        quantity: oi.quantity ?? 0,
        price: oi.price_at_checkout ?? 0,
        tags: itemMap[oi.product_id]?.tags ?? [],
      }));
      return { items: mapped, count: count ?? 0 };
    }
    return { items: [], count: 0 };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchOrderItems(currentPage).then(result => {
      if (cancelled) return;
      setProducts(result.items);
      setTotalPages(Math.max(1, Math.ceil(result.count / ITEMS_PER_PAGE)));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fetchOrderItems, currentPage]);

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-12">
        {/* Title */}
        <h1 className="text-[48px] font-bold text-[#C1121F] tracking-tight">
          Orders
        </h1>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 px-6 py-4 text-[14px] text-[#8181A5] font-semibold">
        <div className="col-span-4">Name</div>

        {/* Sales */}
        <div className="col-span-1 flex items-center justify-center space-x-2 text-[14px] text-[#8181A5]">
          <button
            className="p-1 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"
            aria-label="Sort Sales"
          >
            <LuArrowUpDown className="w-4 h-4 text-gray-500" />
          </button>
          <span>Order</span>
        </div>

        {/* Qty */}
        <div className="col-span-1 flex items-center justify-center space-x-2 text-[14px] text-[#8181A5]">
          <button
            className="p-1 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"
            aria-label="Sort Qty"
          >
            <LuArrowUpDown className="w-4 h-4 text-gray-500" />
          </button>
          <span>Qty.</span>
        </div>

        {/* Rating */}
        <div className="col-span-2 flex items-center justify-center space-x-2 text-[14px] text-[#8181A5]">
          <button
            className="p-1 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"
            aria-label="Sort Rating"
          >
            <LuArrowUpDown className="w-4 h-4 text-gray-500" />
          </button>
          <span>Rating</span>
        </div>

        {/* Price */}
        <div className="col-span-2 flex items-center justify-center space-x-2 text-[14px] text-[#8181A5]">
          <button
            className="p-1 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"
            aria-label="Sort Price"
          >
            <LuArrowUpDown className="w-4 h-4 text-gray-500" />
          </button>
          <span>Price</span>
        </div>

        {/* Tag */}
        <div className="col-span-1 flex items-center justify-center space-x-2 text-[14px] text-[#8181A5]">
          <button
            className="p-1 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"
            aria-label="Sort Tag"
          >
            <LuArrowUpDown className="w-4 h-4 text-gray-500" />
          </button>
          <span>Tag</span>
        </div>

        {/* Empty column for "More" */}
        <div className="col-span-1"></div>
      </div>

      {/* Rows */}
      <div className="space-y-4 mb-75">
        {loading ? (
          <p className="text-gray-400 text-sm px-6">Loading orders...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-400 text-sm px-6">No order items yet.</p>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-12 items-center bg-[#F9FAFB] rounded-2xl px-6 py-4"
            >
              {/* Name + Image */}
              <div className="col-span-4 flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selected.includes(product.id)}
                  onChange={() => toggleSelect(product.id)}
                  className="w-4 h-4 accent-blue-600"
                />

                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="object-contain"
                    unoptimized
                  />
                </div>

                <span className="font-semibold text-[16px] text-[#1C1D21]">
                  {product.name}
                </span>
              </div>

              {/* Order ID */}
              <div className="col-span-1 text-center text-sm">
                <p className="font-semibold text-[16px] text-[#1C1D21]">#{product.order_id}</p>
                <span className="text-[#8181A5] text-[14px]">Order</span>
              </div>

              {/* Qty */}
              <div className="col-span-1 text-center text-sm">
                <p className="font-semibold text-[16px] text-[#1C1D21]">{product.quantity}</p>
                <span className="text-[#8181A5] text-[14px]">Qty.</span>
              </div>

              {/* Rating */}
              <div className="col-span-2 text-center text-sm">
                <p className="font-semibold text-[16px] text-[#1C1D21]">—</p>
                <span className="text-[#8181A5] text-[14px]">Rating</span>
              </div>

              {/* Price */}
              <div className="col-span-2 text-center text-sm">
                <p className="font-semibold text-[#1C1D21]">₱{product.price.toLocaleString()}</p>
                <span className="text-[#8181A5] text-[14px]">Price</span>
              </div>

              {/* Tag */}
              <div className="col-span-1 flex justify-center">
                <span className="bg-[#FFE680] text-[#58585B] text-[14px] font-semibold px-10 py-1.5 rounded-lg">
                  {product.tags[0] ?? "—"}
                </span>
              </div>

              {/* More button */}
              <div className="col-span-1 flex justify-end">
                <button
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors text-[#7D7D7D] flex items-center justify-center"
                  aria-label="More options"
                >
                  <LuList className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-12 text-sm">
        {/* Left: < Prev */}
        <div className="flex items-center gap-2 mr-12">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40"
          >
            &lt;
          </button>
          <span className="text-gray-500">Prev</span>
        </div>

        {/* Page Numbers */}
        <div className="flex items-center gap-5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded-lg font-bold ${
                page === currentPage ? "bg-red-600 text-white" : "text-black hover:bg-gray-200"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Right: Next > */}
        <div className="flex items-center gap-2 ml-12">
          <span className="text-gray-500">Next</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}