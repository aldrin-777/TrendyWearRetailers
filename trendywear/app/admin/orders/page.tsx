"use client";

import { LuArrowUpDown } from "react-icons/lu";
import { LuList } from "react-icons/lu";
import { LuTruck, LuX, LuPackageCheck } from "react-icons/lu";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { proceedDelivery } from "@/app/actions/admin/proceedDelivery";

const BUCKET_NAME = "images";
const ITEMS_PER_PAGE = 10;

type OrderRow = {
  id: number;
  order_id: number;
  name: string;
  image: string;
  status: any;
  quantity: number;
  price: number;
  tags: string[];
};

type DeliveryStatus = "Shipped" | "In Transit" | "Delivered" | "";

type DeliveryInfo = {
  status: DeliveryStatus;
  courier: string;
  trackingNumber: string;
  estimatedDate: string;
  notes: string;
};

export default function ProductsPage() {
  const [selected, setSelected] = useState<number[]>([]);
  const [products, setProducts] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // proceed delivery feature
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderRow | null>(null);

  const [deliveryMap, setDeliveryMap] = useState<Record<number, DeliveryInfo>>(
    {}
  );

  const [deliveryForm, setDeliveryForm] = useState<DeliveryInfo>({
    status: "",
    courier: "",
    trackingNumber: "",
    estimatedDate: "",
    notes: "",
  });

  const fetchOrderItems = useCallback(async (page: number) => {
    const supabase = createClient();
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    // Fetch order_items with count
    const { data: orderItems, count } = await supabase
      .from("order_items")
      .select("id, orders_id, variant_id, quantity, price_at_checkout,orders(status)", {
        count: "exact",
      })
      .order("id", { ascending: false })
      .range(from, to);
    
    if (orderItems && orderItems.length > 0) {
      const productIds = [...new Set(orderItems.map((i) => i.variant_id))];

      // Fetch item details
      const { data: data } = await supabase
        .from("item_variants")
        .select(`id, item:items(id, name, image_id, tags)`)
        .in("id", productIds);

      const itemMap: Record<
        number,
        { name: string; image: string; tags: string[] }
      > = {};

      (data ?? []).forEach((row) => {
        const raw = row.item as unknown;
        const item = Array.isArray(raw) ? raw[0] : raw;
        if (!item || typeof item !== "object") return;

        const it = item as {
          name?: string;
          image_id?: string[] | null;
          tags?: string[] | null;
        };

        const firstImageId = it.image_id?.[0] ?? null;
        const imageUrl = firstImageId
          ? supabase.storage.from(BUCKET_NAME).getPublicUrl(firstImageId).data
            .publicUrl
          : "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf";

        itemMap[row.id] = {
          name: it.name ?? "Unnamed",
          image: imageUrl,
          tags: it.tags ?? [],
        };
      });
      

      const mapped = orderItems.map((oi) => ({
        id: oi.id,
        order_id: oi.orders_id,
        name: itemMap[oi.variant_id]?.name ?? "Unknown Item",
        image:
          itemMap[oi.variant_id]?.image ??
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf",
        status: (Array.isArray(oi.orders) ? oi.orders[0] : oi.orders)?.status ?? "",
        quantity: oi.quantity ?? 0,
        price: oi.price_at_checkout ?? 0,
        tags: itemMap[oi.variant_id]?.tags ?? [],
      }));

      return { items: mapped, count: count ?? 0 };
    }

    return { items: [], count: 0 };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchOrderItems(currentPage).then((result) => {
      if (cancelled) return;
      setProducts(result.items);
      setTotalPages(Math.max(1, Math.ceil(result.count / ITEMS_PER_PAGE)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchOrderItems, currentPage]);

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getDeliveryInfo = (orderId: number): DeliveryInfo => {
    return (
      deliveryMap[orderId] ?? {
        status: "pending",
        courier: "",
        trackingNumber: "",
        estimatedDate: "",
        notes: "",
      }
    );
  };

  const openDeliveryModal = (product: OrderRow) => {
    const existing = getDeliveryInfo(product.order_id);

    setActiveOrder(product);
    setDeliveryForm({
      status: product.status as DeliveryStatus,
      courier: existing.courier,
      trackingNumber: existing.trackingNumber,
      estimatedDate: existing.estimatedDate,
      notes: existing.notes,
    });
    setIsDeliveryModalOpen(true);
    setOpenMenuId(null);
  };

  const closeDeliveryModal = () => {
    setIsDeliveryModalOpen(false);
    setActiveOrder(null);
    setDeliveryForm({
      status: "",
      courier: "",
      trackingNumber: "",
      estimatedDate: "",
      notes: "",
    });
  };

  const saveDeliveryDetails = () => {
    if (!activeOrder) return;
    closeDeliveryModal();
  };

  const markAsDelivered = async (product: OrderRow) => {
    let cancelled = false;
    await proceedDelivery(product.order_id);
    fetchOrderItems(currentPage).then((result) => {
      if (cancelled) return;
      setProducts(result.items);
      setTotalPages(Math.max(1, Math.ceil(result.count / ITEMS_PER_PAGE)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  };

  const getStatusClasses = (status: DeliveryStatus) => {
    switch (status) {
      case "Shipped":
        return "bg-gray-100 text-gray-600";
      case "In Transit":
        return "bg-yellow-100 text-yellow-700";
      case "Delivered":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusLabel = (status: DeliveryStatus) => {
    switch (status) {
      case "Shipped":
        return "Shipped";
      case "In Transit":
        return "In Transit";
      case "Delivered":
        return "Delivered";
      default:
        return "Shipped";
    }
  };

  //  Tag color map ────────────────────────────────────────────────────────────
  const TAG_COLORS: Record<string, string> = {
    Women: "bg-pink-100 text-pink-700",
    Men: "bg-blue-100 text-blue-700",
    Tops: "bg-amber-100 text-amber-700",
    Dress: "bg-purple-100 text-purple-700",
    Bottoms: "bg-emerald-100 text-emerald-700",
    Accessories: "bg-orange-100 text-orange-700",
    Shirt: "bg-sky-100 text-sky-700",
    Jacket: "bg-yellow-100 text-yellow-800",
    Trouser: "bg-indigo-100 text-indigo-700",
    Short: "bg-teal-100 text-teal-700",
    Polo: "bg-cyan-100 text-cyan-700",
  };
  const getTagColor = (tag: string) =>
    TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600";

  return (
    <>
      <div className="w-full">
        {/* Header */}
        <div className="mb-12">
          {/* Title */}
          <h1 className="text-3xl text-[#C1121F] tracking-tight font-bold">
            Orders
          </h1>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-14 px-6 py-4 text-[14px] text-[#8181A5] font-semibold">
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

          {/* Delivery */}
          <div className="col-span-2 flex items-center justify-center space-x-2 text-[14px] text-[#8181A5]">
            <button
              className="p-1 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"
              aria-label="Sort Delivery"
            >
              <LuArrowUpDown className="w-4 h-4 text-gray-500" />
            </button>
            <span>Delivery</span>
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
          <div className="col-span-2 flex items-center justify-center space-x-2 text-[14px] text-[#8181A5]">
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
            products.map((product) => {
              return (
                <div
                  key={product.id}
                  className="grid grid-cols-14 items-center bg-[#F9FAFB] rounded-2xl px-6 py-4 relative"
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
                  <div className="col-span-1 text-center">
                    <p className="font-bold text-[15px] text-[#1C1D21]">
                      #{product.order_id}
                    </p>
                    <span className="text-[10px] font-bold text-[#8181A5] uppercase tracking-wider">
                      Order
                    </span>
                  </div>

                  {/* Qty */}
                  <div className="col-span-1 text-center">
                    <p className="font-bold text-[15px] text-[#1C1D21]">
                      {product.quantity}
                    </p>
                    <span className="text-[10px] font-bold text-[#8181A5] uppercase tracking-wider">
                      Qty.
                    </span>
                  </div>

                  {/* Delivery */}
                  <div className="col-span-2 text-center text-sm">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`${getStatusClasses(
                          product.status as DeliveryStatus
                        )} px-3 py-1 rounded-lg text-[12px] font-semibold`}
                      >
                        {getStatusLabel(product.status as DeliveryStatus)}
                      </span>

                      {getDeliveryInfo(product.order_id).trackingNumber ? (
                        <span className="text-[#8181A5] text-[11px]">
                          {getDeliveryInfo(product.order_id).trackingNumber}
                        </span>
                      ) : (
                        <span className="text-[#8181A5] text-[11px]">
                          No tracking yet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-center">
                    <p className="font-bold text-[15px] text-[#1C1D21]">
                      ₱{product.price.toLocaleString()}
                    </p>
                    <span className="text-[10px] font-bold text-[#8181A5] uppercase tracking-wider">
                      Price
                    </span>
                  </div>

                  {/* Tag */}
                  <div className="col-span-2 flex justify-center">
                    <span
                      className={`${getTagColor(
                        product.tags[0] || ""
                      )} text-[14px] font-semibold px-4 py-1.5 rounded-lg`}
                    >
                      {product.tags[0] ?? "—"}
                    </span>
                  </div>

                  {/* More button */}
                  <div className="col-span-1 flex justify-end relative">
                    <button
                      onClick={() =>
                        setOpenMenuId((prev) =>
                          prev === product.id ? null : product.id
                        )
                      }
                      className="p-2 rounded-full hover:bg-gray-200 transition-colors text-[#7D7D7D] flex items-center justify-center"
                      aria-label="More options"
                    >
                      <LuList className="w-5 h-5" />
                    </button>

                    {openMenuId === product.id && (
                      <div className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-gray-200 bg-white shadow-xl p-2">
                        <button
                          onClick={() => openDeliveryModal(product)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-left text-sm text-[#1C1D21]"
                        >
                          <LuTruck className="w-4 h-4" />
                          Proceed Delivery
                        </button>

                        <button
                          onClick={() => markAsDelivered(product)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-left text-sm text-[#1C1D21]"
                        >
                          <LuPackageCheck className="w-4 h-4" />
                          Mark as Delivered
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center mt-12 text-sm">
          {/* Left: < Prev */}
          <div className="flex items-center gap-2 mr-12">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                className={`px-3 py-1 rounded-lg font-bold ${page === currentPage
                    ? "bg-red-600 text-white"
                    : "text-black hover:bg-gray-200"
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
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Proceed Delivery Modal */}
      {isDeliveryModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-[#1C1D21]">
                  Proceed Delivery
                </h2>
                <p className="text-sm text-[#8181A5] mt-1">
                  Set delivery details for order #{activeOrder.order_id}
                </p>
              </div>

              <button
                onClick={closeDeliveryModal}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
                aria-label="Close modal"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 py-7 space-y-6">
              <div className="flex items-center gap-4 rounded-2xl bg-[#F9FAFB] p-4">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm overflow-hidden flex items-center justify-center">
                  <Image
                    src={activeOrder.image}
                    alt={activeOrder.name}
                    width={44}
                    height={44}
                    className="object-contain"
                    unoptimized
                  />
                </div>

                <div>
                  <p className="text-lg font-bold text-[#1C1D21]">
                    {activeOrder.name}
                  </p>
                  <p className="text-sm text-[#8181A5]">
                    Order #{activeOrder.order_id} • Qty {activeOrder.quantity}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#1C1D21] mb-2">
                    Courier
                  </label>
                  <input
                    type="text"
                    value={deliveryForm.courier}
                    onChange={(e) =>
                      setDeliveryForm((prev) => ({
                        ...prev,
                        courier: e.target.value,
                      }))
                    }
                    placeholder="e.g. J&T Express"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#C1121F]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1D21] mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={deliveryForm.trackingNumber}
                    onChange={(e) =>
                      setDeliveryForm((prev) => ({
                        ...prev,
                        trackingNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter tracking number"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#C1121F]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1D21] mb-2">
                    Estimated Delivery Date
                  </label>
                  <input
                    type="date"
                    value={deliveryForm.estimatedDate}
                    onChange={(e) =>
                      setDeliveryForm((prev) => ({
                        ...prev,
                        estimatedDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#C1121F]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1D21] mb-2">
                    Status
                  </label>
                  <select
                    value={deliveryForm.status}
                    onChange={(e) =>
                      setDeliveryForm((prev) => ({
                        ...prev,
                        status: e.target.value as DeliveryStatus,
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#C1121F]"
                  >
                    <option value="processing">Processing</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1C1D21] mb-2">
                  Notes
                </label>
                <textarea
                  value={deliveryForm.notes}
                  onChange={(e) =>
                    setDeliveryForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Add delivery notes..."
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#C1121F] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-gray-100 bg-white">
              <button
                onClick={closeDeliveryModal}
                className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={saveDeliveryDetails}
                className="px-5 py-3 rounded-2xl bg-[#C1121F] text-white font-semibold hover:opacity-90"
              >
                Save Delivery Details
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}