"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { addToWishlist } from "@/app/actions/user/AddToWishlist";
import { removeFromWishlist } from "@/app/actions/user/RemoveFromWishlist";
import TopModal from "./TopModal";

type ProductCardProps = {
    id: number;
    name: string;
    images: string[]; // <-- updated
    oldPrice?: number;
    price: number;
    rating: number;
    reviews: number;
    is_liked:boolean;
    colors: string[];
};

export default function ProductCard({
    id,
    name,
    images,
    oldPrice,
    price,
    rating,
    reviews,
    is_liked,
    colors,
}: ProductCardProps) {
    const [liked, setLiked] = useState(is_liked);

    // fallback to placeholder if images array is empty
    const mainImage = images && images.length > 0 ? images[0] : "/placeholder.jpg";

    const [modal, setModal] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const hasDiscount = oldPrice && oldPrice > price;
    const discountPercent = hasDiscount
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

    return (
        <div className="group">
            {modal && (
                <TopModal
                    message={modal.message}
                    type={modal.type}
                    onClose={() => setModal(null)}
                />
            )}

            {/* IMAGE CARD */}
            <Link href={`/products/${id}`}>
                <div
                    className="relative bg-gray border border-[#A0A0A0] rounded-2xl p-0 overflow-hidden transition-all duration-300
                    group-hover:-translate-y-1 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.15)]"
                >
                    {hasDiscount && (
                        <div className="absolute top-4 left-4 bg-[#C1121F] text-white text-xs font-bold px-3 py-1 rounded-full shadow z-10">
                            -{discountPercent}%
                        </div>
                    )}
                    <div className="relative h-64 rounded-xl overflow-hidden">
                        <Image
                            src={mainImage}
                            alt={name}
                            fill
                            sizes = "100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>

                    {/* HEART */}
                    <button
                        onClick={async (e) => {
                            e.preventDefault();

                            if (liked) {
                            const res = await removeFromWishlist(id);

                            if (res?.success) {
                                setLiked(false);
                                setModal({ message: "Removed from wishlist", type: "success" });
                            } else {
                                setModal({ message: "Failed to remove from wishlist", type: "error" });

                            }

                            } else {
                            const res = await addToWishlist(id);

                            if (res?.success) {
                                setLiked(true);
                                setModal({ message: "Added to wishlist", type: "success" });
                            } else {
                                setModal({ message: "Failed to add to wishlist", type: "error" });
                            }
                            }
                        }}
                        className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition border
              ${liked
                                ? "bg-[#C1121F] border-[#C1121F]"
                                : "bg-[#FBFBFB] border-[#FBFBFB]"
                            }`}
                    >
                        <Heart
                            size={16}
                            className={liked ? "text-white" : "text-black"}
                        />
                    </button>
                </div>
            </Link>

            {/* INFO OUTSIDE CARD */}
            <div className="mt-3">
                {/* COLORS */}
                <div className="flex gap-2 mb-2">
                    {colors.map((color, i) => (
                        <span
                            key={i}
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>

                {/* NAME */}
                <p className="text-base font-medium">{name}</p>

                {/* PRICE */}
                <div className="flex items-center gap-2 text-sm mt-1">
                    {hasDiscount  && (
                        <span className="text-gray-500 line-through">
                            PHP {oldPrice.toLocaleString()}.00
                        </span>
                    )}
                    <span className="text-[#C1121F] font-medium">
                        PHP {price.toLocaleString()}.00
                    </span>
                </div>

                {/* RATING */}
                <div className="flex items-center gap-1 text-sm mt-1">
                    <span>★</span>
                    <span className="font-medium">{rating}</span>
                    <span className="text-gray-500">({reviews})</span>
                </div>
            </div>
        </div>
    );
}
