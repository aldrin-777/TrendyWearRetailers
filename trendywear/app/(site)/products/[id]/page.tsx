"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/app/(site)/components/Breadcrumb";
import ProductCard from "@/app/(site)/components/ProductCard";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { addToCart } from "@/app/actions/user/AddToCart";
import TopModal from "../../components/TopModal";
import { useCart } from "@/app/(site)/context/CartContext";
import { fetchShoppingCart } from "@/app/(site)/lib/fetchShoppingCart";

const BUCKET_NAME = "images";

// ---- Types ----
type Product = {
    id: number;
    name: string;
    images: string[];
    oldPrice?: number;
    price: number;
    rating: number;
    reviews: number;
    is_liked: boolean;
    colors: string[];
    description: string[];
    features: string[];
};

type Review = {
    id: number;
    productId: number;
    name: string;
    avatar: string;
    comment: string;
    date: string;
    likes: number;
};

export default function ProductPage() {
    const params = useParams();
    const id = Number(params.id);
    
    const { setCartItems } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [productReviews, setProductReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const user_id = (await supabase.auth.getSession()).data.session?.user.id

            // Fetch all items
            const { data: items, error } = await supabase
                .from("items")
                .select("id, name, image_id, description, tags");

            if (error || !items) {
                console.error("Error fetching items:", error);
                setLoading(false);
                return;
            }

            // Fetch all prices
            const itemIds = items.map((i) => i.id);
            const { data: prices } = await supabase
                .from("prices")
                .select("item_id, price")
                .in("item_id", itemIds);

            const priceMap: Record<number, { price: number; oldPrice?: number }> = {};
            if (prices) {
                for (const p of prices) {
                    if (!(p.item_id in priceMap)) {
                        priceMap[p.item_id] = {
                            price: p.price ?? 0,           // fallback to 0
                            oldPrice: (p as any).old_price // optional, may not exist
                        };
                    }
                }
            }

            const { data: wishlisted } = await supabase
                .from("wishlist")
                .select("id, item_id")
                .eq("user_id", user_id)
                .in("item_id", itemIds)

            const wishlistSet = new Set<number>();
            if (wishlisted) {
                for (const w of wishlisted) {
                    wishlistSet.add(w.item_id);
                }
            }

            // Map items to Product shape
            const mapped: Product[] = items.map((item) => {
                const imageUrls = (item.image_id ?? []).map(
                    (imgId: string) =>
                        supabase.storage.from(BUCKET_NAME).getPublicUrl(imgId).data.publicUrl
                );
                const priceObj = priceMap[item.id] ?? { price: 0 };
                return {
                    id: item.id,
                    name: item.name ?? "Unnamed",
                    images: imageUrls.length > 0 ? imageUrls : ["/placeholder.jpg"],
                    price: priceObj.price,
                    oldPrice: priceObj.oldPrice, 
                    rating: 0,       // not in DB yet
                    reviews: 0,      // not in DB yet
                    colors: [],      // not in DB yet
                    is_liked: wishlistSet.has(item.id),
                    description: item.description ? [item.description] : [],
                    features: [],    // not in DB yet
                };
            });

            setProducts(mapped);

            // Find current product
            const current = mapped.find((p) => p.id === id) ?? null;
            setProduct(current);

            // Fetch reviews for this product
            if (current) {
                const { data: reviewRows } = await supabase
                    .from("reviews")
                    .select("id, user_id, item_id, rating, text, created_at")
                    .eq("item_id", id);

                // Fetch usernames
                const userIds = [...new Set((reviewRows ?? []).map((r) => r.user_id))];
                const { data: users } = userIds.length > 0
                    ? await supabase
                        .from("users")
                        .select("id, username")
                        .in("id", userIds)
                    : { data: [] };

                const usernameMap: Record<string, string> = {};
                if (users) {
                    for (const u of users) usernameMap[u.id] = u.username;
                }

                const mappedReviews: Review[] = (reviewRows ?? []).map((r) => ({
                    id: r.id,
                    productId: r.item_id,
                    name: usernameMap[r.user_id] ?? "Anonymous",
                    avatar: "/avatar.jpg",   // not in DB yet
                    comment: r.text ?? "",
                    date: new Date(r.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                    }),
                    likes: 0,               // not in DB yet
                }));

                setProductReviews(mappedReviews);
            }

            setLoading(false);
        }

        fetchData();
    }, [id]);

    const [sortBy, setSortBy] = useState("Newest");
    const [likedReviews, setLikedReviews] = useState<number[]>([]);

    const toggleLike = (id: number) => {
        setLikedReviews((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const sortedReviews = [...productReviews].sort((a, b) => {
        if (sortBy === "Newest") return b.id - a.id;
        if (sortBy === "Oldest") return a.id - b.id;
        if (sortBy === "Most Liked") return b.likes - a.likes;
        return 0;
    });

    const [showMore, setShowMore] = useState(false);
    const [activeTab, setActiveTab] = useState("details");
    const [selectedSize, setSelectedSize] = useState("XS");
    const [selectedColor, setSelectedColor] = useState("#000");

    const [showMoreReviews, setShowMoreReviews] = useState(false);
    const reviewsRef = useRef<HTMLDivElement>(null);
    const [reviewsHeight, setReviewsHeight] = useState(0);
    const collapsedHeightReviews = 390;

    useEffect(() => {
        if (reviewsRef.current) {
            setReviewsHeight(reviewsRef.current.scrollHeight);
        }
    }, [sortedReviews]);

    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(0);
    const collapsedHeight = 220;

    useEffect(() => {
        if (contentRef.current) {
            setContentHeight(contentRef.current.scrollHeight);
        }
    }, [product?.description, product?.features]);

    if (loading)
    return (
        <div className="bg-[#F8F9FB] min-h-screen flex justify-center items-center">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-gray-300 border-t-[#C1121F] rounded-full animate-spin" />
        </div>
    );

    if (!product) 
    return (
        <div className="bg-[#F8F9FB] min-h-screen flex justify-center items-center">
        <p className="text-gray-500 text-lg">Product not found</p>
        </div>
    )   

    function getRandomItems<T>(arr: T[], count: number): T[] {
        const shuffled = [...arr] // clone to avoid mutating original
            .sort(() => Math.random() - 0.5); // simple shuffle
        return shuffled.slice(0, count);
    }

    return (
        <>
            {/* PAGE CONTENT */}
            <div className="bg-[#F8F9FB] min-h-screen">
                <div className="max-w-[1440px] mx-auto px-10 py-10">
                    {showModal && (
                    <TopModal
                        message={modalMessage}
                        type="success"
                        onClose={() => setShowModal(false)}
                    />
                     )}
                    {/* BREADCRUMB */}
                    <Breadcrumb
                        items={[
                            { label: "Home", href: "/" },
                            { label: "Product", href: "/products-page" },
                            { label: product.name },
                        ]}
                    />

                    <h2 className="text-[#C1121F] text-[36px] font-semibold mb-6">
                        Item Detail
                    </h2>

                    {/* TOP SECTION */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* LEFT IMAGES */}
                        <div
                            className="bg-[#D9D9D9]/15 border border-[#D9D9D9] p-4 rounded-2xl flex-shrink-0 w-full md:w-[65%]"
                        >
                            {/* BIG IMAGE */}
                            <div className="relative w-full h-[520px] rounded-2xl overflow-hidden">
                                <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            {/* THUMBNAILS */}
                            <div className="flex gap-4 mt-4">
                                {product.images.slice(1, 4).map((img: string, i: number) => (
                                    <div
                                        key={i}
                                        className="relative flex-1 aspect-square rounded-xl overflow-hidden"
                                    >
                                        <Image
                                            src={img}
                                            alt={`${product.name} thumbnail ${i + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT INFO */}
                        <div className="bg-[#D9D9D9]/15 border-[#D9D9D9] border rounded-2xl p-6 flex-1">
                            <h1 className="text-[36px] text-[#003049] font-semibold mb-1">
                                {product.name}
                            </h1>

                            <p className="text-[24px] text-gray-600 mb-4">
                                ★ {product.rating} ({product.reviews})
                            </p>

                            {/* COLORS */}
                            <div className="mb-6">
                                <p className="text-[24px] font-medium mb-2">Color</p>
                                <div className="flex gap-2">
                                    {product.colors.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-6 h-6 rounded-full border-2 ${selectedColor === color
                                                ? "border-black"
                                                : "border-transparent"
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* SIZE */}
                            <div className="mb-10 mt-15">
                                <p className="text-[24px] font-medium mb-2">Size</p>
                                <div className="flex gap-2">
                                    {["XS", "S", "M", "L", "XL"].map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`h-[54px] w-[54px] rounded-full text-xs border ${selectedSize === size
                                                ? "bg-[#C1121F] text-white border-[#C1121F]"
                                                : "bg-gray-200 border-gray-200"
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* PRICE */}
                            <div className="mb-6 relative">
                                <div className="flex items-center gap-3">
                                    {product.oldPrice && product.oldPrice > product.price ? (
                                        <>
                                        <span className="text-[32px] font-semibold text-[#1E293B]">
                                            PHP {product.price.toLocaleString()}.00
                                        </span>
                                        <span className="text-[#666666] line-through text-[20px]">
                                            PHP {product.oldPrice.toLocaleString()}.00
                                        </span>
                                        <span className="bg-red-500 text-white text-[14px] px-2 py-1 rounded">
                                            {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% Off
                                        </span>
                                        </>
                                    ) : (
                                        <span className="text-[32px] font-semibold text-[#1E293B]">
                                        PHP {product.price.toLocaleString()}.00
                                        </span>
                                    )}
                                </div>
                                <div className="mt-7 mb-10 h-[2px] bg-[#B7B7B7] w-full rounded" />
                            </div>

                            {/* BUTTONS */}
                            <div className="flex flex-col gap-3">
                                <button className="w-full py-3 rounded-full border border-[#003049] text-[#003049] font-semibold hover:bg-[#003049]/10"
                                    onClick={async () => {
                                        await addToCart(id);
                                        // Update cart context immediately
                                        try {
                                            const updatedCart = await fetchShoppingCart();
                                            setCartItems(updatedCart);
                                        } catch (err) {
                                            console.error("Error updating cart context:", err);
                                        }
                                        
                                        setModalMessage(`${product?.name} added to cart!`);
                                        setShowModal(true);
                                    }}
                                >
                                    Add to Cart
                                </button>
                                <button className="w-full py-3 rounded-full bg-[#003049] text-[#F5F3F3] font-semibold">
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="mt-16 flex relative text-[24px] font-medium border-b border-gray-300">
                        <button
                            onClick={() => setActiveTab("details")}
                            className={`flex-1 pb-3 relative text-left ${activeTab === "details" ? "text-[#003049]" : "text-[#6E6E6E]"
                                }`}
                        >
                            The Details
                            {activeTab === "details" && (
                                <span
                                    className="absolute bottom-0 left-0 h-[3px] bg-[#C1121F]"
                                    style={{ width: "calc(100% - 5px)" }}
                                />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab("reviews")}
                            className={`flex-1 pb-3 relative text-left ${activeTab === "reviews" ? "text-[#003049]" : "text-[#6E6E6E]"
                                }`}
                        >
                            Ratings & Reviews
                            <span className="ml-2 bg-[#D9D9D9] text-[#003049] font-semibold text-[18px] px-2.5 py-2 rounded-[5px]">
                                {productReviews.length}
                            </span>
                            {activeTab === "reviews" && (
                                <span className="absolute bottom-0 left-0 h-[3px] bg-[#C1121F] w-full" />
                            )}
                        </button>

                    </div>

                    {/* TAB CONTENT */}
                    <div className="mt-10 max-w-8xl">
                        {activeTab === "details" && (
                            <>
                                <h3 className="text-[30px] font-semibold text-[#003049] mb-6">
                                    Description
                                </h3>

                                <div className="bg-[#E6E6E6] rounded-[11px] p-8 shadow-sm border border-[#D9D9D9]">
                                    <div
                                        ref={contentRef}
                                        className="relative text-[18px] leading-7 text-[#535353] space-y-5 overflow-hidden transition-all duration-500 ease-in-out"
                                        style={{
                                            maxHeight: showMore
                                                ? contentHeight + "px"
                                                : collapsedHeight + "px",
                                        }}
                                    >
                                        {product.description?.map((para, index) => (
                                            <p key={index}>{para}</p>
                                        ))}

                                        {product.features && (
                                            <div>
                                                <p className="font-semibold text-[#535353] mb-2">
                                                    Key Features:
                                                </p>
                                                <ul className="list-disc pl-6 space-y-1">
                                                    {product.features.map((feature, index) => (
                                                        <li key={index}>{feature}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {!showMore && contentHeight > collapsedHeight && (
                                            <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-gray to-transparent" />
                                        )}
                                    </div>

                                    {contentHeight > collapsedHeight && (
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => setShowMore(!showMore)}
                                                className="mt-6 flex items-center gap-2 text-[16px] text-[#535353] hover:text-[#003049] transition-colors"
                                            >
                                                {showMore ? "Show Less" : "Show More"}
                                                <ChevronDown
                                                    className={`transition-transform duration-300 ${showMore ? "rotate-180" : ""
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {activeTab === "reviews" && (
                            <>
                                <h3 className="text-[30px] font-semibold text-[#003049] mb-6">
                                    Reviews & Ratings
                                </h3>

                                {/* Sort */}
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-[#535353] text-[16px]">Sort By</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white"
                                    >
                                        <option>Newest</option>
                                        <option>Oldest</option>
                                        <option>Most Liked</option>
                                    </select>
                                </div>

                                {/* Reviews Container */}
                                <div
                                    ref={reviewsRef}
                                    className="bg-[#E6E6E6] rounded-[11px] p-8 shadow-sm border border-[#D9D9D9] space-y-8 overflow-hidden transition-all duration-500 ease-in-out relative"
                                    style={{
                                        maxHeight: showMoreReviews
                                            ? reviewsHeight + "px"
                                            : collapsedHeightReviews + "px",
                                    }}
                                >
                                    {sortedReviews.map((review, index) => {
                                        const isLiked = likedReviews.includes(review.id);

                                        return (
                                            <div key={review.id}>
                                                <div className="flex justify-between items-start gap-4">
                                                    {/* LEFT SIDE */}
                                                    <div className="flex gap-4">
                                                        {/* Avatar */}
                                                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-300">
                                                            <Image
                                                                src={review.avatar}
                                                                alt={review.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>

                                                        {/* Name + Comment */}
                                                        <div>
                                                            <h4 className="font-semibold text-[#003049] text-[18px]">
                                                                {review.name}
                                                            </h4>

                                                            <p className="text-[#535353] text-[16px] mt-2 leading-6 max-w-2xl">
                                                                {review.comment}
                                                            </p>

                                                            {/* Like Button */}
                                                            <button
                                                                onClick={() => toggleLike(review.id)}
                                                                className="flex items-center gap-2 mt-4 font-bold text-[16px] text-[#535353] hover:text-[#C1121F] transition"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 24 24"
                                                                    fill={isLiked ? "#C1121F" : "none"}
                                                                    stroke="#C1121F"
                                                                    strokeWidth="2"
                                                                    className="w-5 h-5 transition"
                                                                >
                                                                    <path d="M20.8 4.6c-1.5-1.6-4-1.6-5.5 0l-.8.8-.8-.8c-1.5-1.6-4-1.6-5.5 0-1.6 1.6-1.6 4.1 0 5.7l6.3 6.5 6.3-6.5c1.6-1.6 1.6-4.1 0-5.7z" />
                                                                </svg>

                                                                <span>{isLiked ? "Liked" : "Like"}</span>
                                                                <span className="text-[15px] text-[#6E6E6E]">{isLiked ? review.likes + 1 : review.likes} Likes</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Date */}
                                                    <span className="text-[16px] text-[#535353] whitespace-nowrap">
                                                        {review.date}
                                                    </span>
                                                </div>

                                                {/* Divider */}
                                                {index !== sortedReviews.length - 1 && (
                                                    <div className="h-[1px] bg-gray-300 mt-8" />
                                                )}
                                            </div>
                                        );
                                    })}

                                    {sortedReviews.length === 0 && (
                                        <p className="text-gray-500 text-center py-8">No reviews yet.</p>
                                    )}

                                    {/* Gradient overlay for collapsed state */}
                                    {!showMoreReviews && reviewsHeight > collapsedHeightReviews && (
                                        <div className="pointer-events-none absolute bottom-16 left-0 h-24 w-full bg-gradient-to-t from-gray to-transparent" />
                                    )}

                                    {/* Show More / Show Less Button INSIDE the container */}
                                    {reviewsHeight > collapsedHeightReviews && (
                                        <div className="flex justify-center mt-6">
                                            <button
                                                onClick={() => setShowMoreReviews(!showMoreReviews)}
                                                className="flex items-center gap-2 text-[16px] text-[#535353] hover:text-[#003049] transition-colors"
                                            >
                                                {showMoreReviews ? "Show Less" : "Show More"}
                                                <ChevronDown
                                                    className={`transition-transform duration-300 ${showMoreReviews ? "rotate-180" : ""
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* YOU MIGHT LIKE */}
                    <div className="mt-20">
                        <h3 className="text-lg font-semibold mb-6">You might like:</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
                            {getRandomItems(products, 5).map((p) => (
                                <ProductCard key={p.id} {...p} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}