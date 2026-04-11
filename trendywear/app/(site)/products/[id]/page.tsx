"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/app/(site)/components/Breadcrumb";
import ProductCard from "@/app/(site)/components/ProductCard";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { addToCart } from "@/app/actions/user/AddToCart";
import TopModal from "../../components/TopModal";
import { useCart } from "@/app/(site)/context/CartContext";
import { fetchShoppingCart } from "@/app/(site)/lib/fetchShoppingCart";
import { createCheckout } from "@/app/actions/payrex/createCheckout";

const BUCKET_NAME = "images";

type Product = {
    id: number;
    name: string;
    images: string[];
    oldPrice?: number | null;
    price: number;
    rating: number;
    reviews: number;
    colors: string[];
    sizes: string[];
    is_liked: boolean;
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
    rating: number;
    isOwn: boolean;
};

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
    const sizeClass = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-7 h-7" : "w-5 h-5";
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = rating >= star;
                const half = !filled && rating >= star - 0.5;
                return (
                    <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                        className={sizeClass}>
                        <defs>
                            <linearGradient id={`half-${star}-${size}`}>
                                <stop offset="50%" stopColor="#F59E0B" />
                                <stop offset="50%" stopColor="none" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            fill={filled ? "#F59E0B" : half ? `url(#half-${star}-${size})` : "none"}
                            stroke="#F59E0B"
                            strokeWidth="1.5"
                        />
                    </svg>
                );
            })}
        </div>
    );
}

// Star picker with 0.5 increments
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hovered, setHovered] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>, star: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        setHovered(x < rect.width / 2 ? star - 0.5 : star);
    };

    const handleClick = (e: React.MouseEvent<SVGSVGElement>, star: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        onChange(x < rect.width / 2 ? star - 0.5 : star);
    };

    const display = hovered || value;

    return (
        <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = display >= star;
                const half = !filled && display >= star - 0.5;
                return (
                    <svg key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-8 h-8 transition-colors cursor-pointer"
                        onMouseMove={(e) => handleMouseMove(e, star)}
                        onClick={(e) => handleClick(e, star)}>
                        <defs>
                            <linearGradient id={`picker-half-${star}`}>
                                <stop offset="50%" stopColor="#F59E0B" />
                                <stop offset="50%" stopColor="none" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            fill={filled ? "#F59E0B" : half ? `url(#picker-half-${star})` : "none"}
                            stroke="#F59E0B"
                            strokeWidth="1.5"
                        />
                    </svg>
                );
            })}
        </div>
    );
}

function RatingSummary({ reviews }: { reviews: Review[] }) {
    const total = reviews.length;
    const avg = total > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : 0;
    // Use 0.5-step buckets mapped to nearest half-star for display
    const counts = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => Math.round(r.rating * 2) / 2 >= star - 0.49 && Math.round(r.rating * 2) / 2 < star + 0.5).length,
    }));

    return (
        <div className="flex gap-10 items-center mb-8 bg-white rounded-xl p-6 border border-[#D9D9D9]">
            <div className="flex flex-col items-center min-w-[80px]">
                <span className="text-[48px] font-bold text-[#003049] leading-none">{avg > 0 ? avg : "—"}</span>
                <StarDisplay rating={avg} size="md" />
                <span className="text-sm text-[#6E6E6E] mt-1">{total} review{total !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex flex-col gap-2 flex-1">
                {counts.map(({ star, count }) => {
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                        <div key={star} className="flex items-center gap-3 text-sm text-[#535353]">
                            <span className="w-4 text-right">{star}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B" className="w-3.5 h-3.5">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-right">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

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

    const [reviewText, setReviewText] = useState("");
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [hasReviewed, setHasReviewed] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const [editRating, setEditRating] = useState(0);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState("");

    const [colors, setColors] = useState<string[]>(["Red", "Beige"]);
    const [sizes, setSizes] = useState<string[]>(["XS", "S", "M", "L", "XL"]);

    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const user_id = user?.id ?? null;
            setCurrentUserId(user_id);

            const { data: items, error } = await supabase
                .from("items")
                .select("id, name, image_id, description, tags");

            if (error || !items) { setLoading(false); return; }

            const itemIds = items.map((i) => i.id);
            const now = new Date().toISOString();

            const { data: prices } = await supabase
                .from("prices")
                .select("item_id, price")
                .in("item_id", itemIds)
                .lte("valid_from", now)
                .or(`valid_to.is.null,valid_to.gte.${now}`)
                .order("priority", { ascending: false });

            const priceGroups: Record<string, number[]> = {};
            for (const p of prices ?? []) {
                if (!priceGroups[p.item_id]) priceGroups[p.item_id] = [];
                priceGroups[p.item_id].push(p.price);
            }

            const wishlistSet = new Set<number>();
            if (user_id) {
                const { data: wishlisted } = await supabase
                    .from("wishlist").select("id, item_id")
                    .eq("user_id", user_id).in("item_id", itemIds);
                if (wishlisted) for (const w of wishlisted) wishlistSet.add(w.item_id);
            }

            const { data: allReviews } = await supabase
                .from("reviews").select("item_id, rating").in("item_id", itemIds);

            const ratingMap: Record<number, { sum: number; count: number }> = {};
            if (allReviews) {
                for (const r of allReviews) {
                    if (!ratingMap[r.item_id]) ratingMap[r.item_id] = { sum: 0, count: 0 };
                    ratingMap[r.item_id].sum += r.rating;
                    ratingMap[r.item_id].count += 1;
                }
            }

            const { data: attributeData } = await supabase
                .from('item_variants')
                .select('color, item_id, size')
                .in('item_id', itemIds);

            const colorMap: Record<number, Set<string>> = {};
            const sizeMap: Record<number, Set<string>> = {};
            if (attributeData) {
                for (const c of attributeData) {
                    if (!colorMap[c.item_id]) colorMap[c.item_id] = new Set();
                    if (!sizeMap[c.item_id]) sizeMap[c.item_id] = new Set();
                    colorMap[c.item_id].add(c.color);
                    sizeMap[c.item_id].add(c.size);
                }
            }

            const mapped: Product[] = items.map((item) => {
                const imageUrls = (item.image_id ?? []).map(
                    (imgId: string) => supabase.storage.from(BUCKET_NAME).getPublicUrl(imgId).data.publicUrl
                );
                const currentPrice: number = priceGroups[item.id]?.[0] ?? 0;
                const oldPrice: number | null =
                    priceGroups[item.id]?.length > 1 ? priceGroups[item.id][1] : null;
                const rd = ratingMap[item.id];
                const uniqueColors = [...(colorMap[item.id] ?? new Set())];
                const uniqueSizes = [...(sizeMap[item.id] ?? new Set())];

                return {
                    id: item.id,
                    name: item.name ?? "Unnamed",
                    images: imageUrls.length > 0 ? imageUrls : ["/placeholder.jpg"],
                    price: currentPrice,
                    oldPrice: oldPrice,
                    rating: rd ? Math.round((rd.sum / rd.count) * 10) / 10 : 0,
                    reviews: rd?.count ?? 0,
                    colors: uniqueColors,
                    sizes: uniqueSizes,
                    is_liked: wishlistSet.has(item.id),
                    description: item.description ? [item.description] : [],
                    features: [],
                };
            });

            setProducts(mapped);
            const current = mapped.find((p) => p.id === id) ?? null;
            setProduct(current);

            if (current) {
                setColors(current.colors);
                setSizes(current.sizes);
                const { data: reviewRows } = await supabase
                    .from("reviews")
                    .select("id, user_id, item_id, rating, text, created_at")
                    .eq("item_id", id);

                if (user_id && reviewRows) setHasReviewed(reviewRows.some((r) => r.user_id === user_id));

                const userIds = [...new Set((reviewRows ?? []).map((r) => r.user_id))];
                const { data: users } = userIds.length > 0
                    ? await supabase.from("users").select("id, username").in("id", userIds)
                    : { data: [] };

                const usernameMap: Record<string, string> = {};
                if (users) for (const u of users) usernameMap[u.id] = u.username;

                setProductReviews((reviewRows ?? []).map((r) => ({
                    id: r.id,
                    productId: r.item_id,
                    name: usernameMap[r.user_id] ?? "Anonymous",
                    avatar: "/avatar.jpg",
                    comment: r.text ?? "",
                    date: new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
                    likes: 0,
                    rating: r.rating ?? 0,
                    isOwn: r.user_id === user_id,
                })));
            }

            setLoading(false);
        }
        fetchData();
    }, [id]);

    async function handleSubmitReview() {
        setReviewError("");
        if (reviewRating === 0) { setReviewError("Please select a star rating."); return; }
        if (reviewText.trim().length < 5) { setReviewError("Please write at least 5 characters."); return; }
        if (!currentUserId) { setReviewError("You must be logged in to leave a review."); return; }

        setReviewSubmitting(true);
        const supabase = createClient();
        const { error } = await supabase.from("reviews").insert({
            user_id: currentUserId, item_id: id, rating: reviewRating, text: reviewText.trim(),
        });

        if (error) { setReviewError("Failed to submit review. Please try again."); setReviewSubmitting(false); return; }

        const { data: userData } = await supabase.from("users").select("username").eq("id", currentUserId).single();

        const newReview: Review = {
            id: Date.now(), productId: id,
            name: userData?.username ?? "You", avatar: "/avatar.jpg",
            comment: reviewText.trim(),
            date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
            likes: 0, rating: reviewRating, isOwn: true,
        };

        setProductReviews((prev) => [newReview, ...prev]);
        setHasReviewed(true);
        setReviewText("");
        setReviewRating(0);
        setReviewSubmitting(false);
        setModalMessage("Review submitted!");
        setShowModal(true);
        setProduct((prev) => {
            if (!prev) return prev;
            const newCount = prev.reviews + 1;
            return { ...prev, rating: Math.round(((prev.rating * prev.reviews + reviewRating) / newCount) * 10) / 10, reviews: newCount };
        });
    }

    function startEdit(review: Review) {
        setEditingReviewId(review.id);
        setEditText(review.comment);
        setEditRating(review.rating);
        setEditError("");
    }

    function cancelEdit() {
        setEditingReviewId(null);
        setEditText("");
        setEditRating(0);
        setEditError("");
    }

    async function handleSaveEdit(reviewId: number) {
        setEditError("");
        if (editRating === 0) { setEditError("Please select a star rating."); return; }
        if (editText.trim().length < 5) { setEditError("Please write at least 5 characters."); return; }

        setEditSubmitting(true);
        const supabase = createClient();
        const { error } = await supabase.from("reviews")
            .update({ rating: editRating, text: editText.trim() })
            .eq("id", reviewId).eq("user_id", currentUserId);

        if (error) { setEditError("Failed to update review. Please try again."); setEditSubmitting(false); return; }

        setProductReviews((prev) =>
            prev.map((r) => r.id === reviewId ? { ...r, comment: editText.trim(), rating: editRating } : r)
        );
        setProduct((prev) => {
            if (!prev) return prev;
            const updated = productReviews.map((r) => r.id === reviewId ? { ...r, rating: editRating } : r);
            const total = updated.length;
            const sum = updated.reduce((s, r) => s + r.rating, 0);
            return { ...prev, rating: total > 0 ? Math.round((sum / total) * 10) / 10 : 0 };
        });
        setEditSubmitting(false);
        setEditingReviewId(null);
        setModalMessage("Review updated!");
        setShowModal(true);
    }

    const [sortBy, setSortBy] = useState("Newest");
    const [likedReviews, setLikedReviews] = useState<number[]>([]);

    const toggleLike = (reviewId: number) => {
        setLikedReviews((prev) => prev.includes(reviewId) ? prev.filter((r) => r !== reviewId) : [...prev, reviewId]);
    };

    const sortedReviews = [...productReviews].sort((a, b) => {
        if (sortBy === "Newest") return b.id - a.id;
        if (sortBy === "Oldest") return a.id - b.id;
        if (sortBy === "Most Liked") return b.likes - a.likes;
        if (sortBy === "Highest Rated") return b.rating - a.rating;
        if (sortBy === "Lowest Rated") return a.rating - b.rating;
        return 0;
    });

    const [showMore, setShowMore] = useState(false);
    const [activeTab, setActiveTab] = useState("details");
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);

    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(0);
    const collapsedHeight = 220;

    useEffect(() => {
        if (contentRef.current) setContentHeight(contentRef.current.scrollHeight);
    }, [product?.description, product?.features]);

    if (loading)
        return (
            <div className="bg-[#F8F9FB] min-h-screen flex justify-center items-center">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-[#C1121F] rounded-full animate-spin" />
            </div>
        );

    if (!product)
        return (
            <div className="bg-[#F8F9FB] min-h-screen flex justify-center items-center">
                <p className="text-gray-500 text-lg">Product not found</p>
            </div>
        );

    function getRandomItems<T>(arr: T[], count: number): T[] {
        return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
    }

    return (
        <>
            <div className="bg-[#F8F9FB] min-h-screen">
                <div className="max-w-[1440px] mx-auto px-10 py-10">
                    {showModal && (
                        <TopModal message={modalMessage} type="success" onClose={() => setShowModal(false)} />
                    )}

                    <Breadcrumb items={[
                        { label: "Home", href: "/" },
                        { label: "Product", href: "/products-page" },
                        { label: product.name },
                    ]} />

                    <h2 className="text-[#C1121F] text-[36px] font-semibold mb-6">Item Detail</h2>

                    {/* TOP SECTION */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* LEFT IMAGES */}
                        <div className="bg-[#D9D9D9]/15 border border-[#D9D9D9] p-4 rounded-2xl flex-shrink-0 w-full md:w-[65%]">
                            <div className="relative w-full h-[520px] rounded-2xl overflow-hidden">
                                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                            </div>
                            <div className="flex gap-4 mt-4">
                                {product.images.slice(1, 4).map((img, i) => (
                                    <div key={i} className="relative flex-1 aspect-square rounded-xl overflow-hidden">
                                        <Image src={img} alt={`${product.name} thumbnail ${i + 1}`} fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT INFO */}
                        <div className="bg-[#D9D9D9]/15 border-[#D9D9D9] border rounded-2xl p-6 flex-1">
                            <h1 className="text-[36px] text-[#003049] font-semibold mb-1">{product.name}</h1>

                            <div className="flex items-center gap-2 mb-4">
                                <StarDisplay rating={product.rating} size="md" />
                                <span className="text-[18px] text-[#003049] font-semibold">
                                    {product.rating > 0 ? product.rating.toFixed(1) : "No ratings yet"}
                                </span>
                                {product.reviews > 0 && (
                                    <span className="text-[16px] text-gray-500">({product.reviews} review{product.reviews !== 1 ? "s" : ""})</span>
                                )}
                            </div>

                            {/* COLORS AND SIZES */}
                            <div className="mb-6">
                                <p className="text-[24px] font-medium mb-2">Color</p>
                                <div className="flex gap-2">
                                    {colors.map((color) => (
                                        <button key={color} onClick={() => setSelectedColor(color)}
                                            className={`w-6 h-6 rounded-full border-2 ${selectedColor === color ? "border-black" : "border-transparent"}`}
                                            style={{ backgroundColor: color }} />
                                    ))}
                                </div>
                            </div>

                            <div className="mb-10 mt-15">
                                <p className="text-[24px] font-medium mb-2">Size</p>
                                <div className="flex gap-2">
                                    {sizes.map((size) => (
                                        <button key={size} onClick={() => setSelectedSize(size)}
                                            className={`h-[54px] w-[54px] rounded-full text-xs border ${selectedSize === size ? "bg-[#C1121F] text-white border-[#C1121F]" : "bg-gray-200 border-gray-200"}`}>
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6 relative">
                                <div className="flex items-center gap-3">
                                    {product.oldPrice && product.oldPrice > product.price ? (
                                        <>
                                            <span className="text-[32px] font-semibold text-[#1E293B]">PHP {product.price.toLocaleString()}.00</span>
                                            <span className="text-[#666666] line-through text-[20px]">PHP {product.oldPrice.toLocaleString()}.00</span>
                                            <span className="bg-red-500 text-white text-[14px] px-2 py-1 rounded">
                                                {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% Off
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-[32px] font-semibold text-[#1E293B]">PHP {product.price.toLocaleString()}.00</span>
                                    )}
                                </div>
                                <div className="mt-7 mb-10 h-[2px] bg-[#B7B7B7] w-full rounded" />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    className="w-full py-3 rounded-full border border-[#003049] text-[#003049] font-semibold hover:bg-[#003049]/10"
                                    onClick={async () => {
                                        if (!selectedColor || !selectedSize) {
                                            setModalMessage("Please select a color and size before adding to cart.");
                                            setShowModal(true);
                                            return;
                                        }

                                        await addToCart(id, undefined, selectedSize, selectedColor);
                                        try {
                                            const updatedCart = await fetchShoppingCart();
                                            setCartItems(updatedCart.map((item) => ({ ...item, isEditing: false as const })));
                                        } catch (err) {
                                            console.error("Error updating cart context:", err);
                                        }
                                        setModalMessage(`${product?.name} added to cart!`);
                                        setShowModal(true);
                                    }}>
                                    Add to Cart
                                </button>
                                <button
                                    className="w-full py-3 rounded-full bg-[#003049] text-[#F5F3F3] font-semibold"
                                    onClick={async () => {
                                        if (!selectedColor || !selectedSize) {
                                            setModalMessage("Please select a color and size before adding to cart.");
                                            setShowModal(true);
                                            return;
                                        }

                                        const checkoutUrl = await createCheckout([{
                                            name: product.name,
                                            amount: product.price * 100,
                                            quantity: 1,
                                            description: `Color: ${selectedColor}, Size: ${selectedSize}`
                                        }]);

                                        if (checkoutUrl) {
                                            window.location.href = checkoutUrl;
                                        }
                                    }}>
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="mt-16 flex relative text-[24px] font-medium border-b border-gray-300">
                        <button onClick={() => setActiveTab("details")}
                            className={`flex-1 pb-3 relative text-left ${activeTab === "details" ? "text-[#003049]" : "text-[#6E6E6E]"}`}>
                            The Details
                            {activeTab === "details" && (
                                <span className="absolute bottom-0 left-0 h-[3px] bg-[#C1121F]" style={{ width: "calc(100% - 5px)" }} />
                            )}
                        </button>
                        <button onClick={() => setActiveTab("reviews")}
                            className={`flex-1 pb-3 relative text-left ${activeTab === "reviews" ? "text-[#003049]" : "text-[#6E6E6E]"}`}>
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
                    <div className="mt-10">

                        {/* ---- DETAILS TAB ---- */}
                        {activeTab === "details" && (
                            <>
                                <h3 className="text-[30px] font-semibold text-[#003049] mb-6">Description</h3>
                                <div className="bg-[#E6E6E6] rounded-[11px] p-8 shadow-sm border border-[#D9D9D9]">
                                    <div
                                        ref={contentRef}
                                        className="relative text-[18px] leading-7 text-[#535353] space-y-5 overflow-hidden transition-all duration-500 ease-in-out"
                                        style={{ maxHeight: showMore ? contentHeight + "px" : collapsedHeight + "px" }}
                                    >
                                        {product.description?.map((para, index) => <p key={index}>{para}</p>)}
                                        {product.features && (
                                            <div>
                                                <p className="font-semibold text-[#535353] mb-2">Key Features:</p>
                                                <ul className="list-disc pl-6 space-y-1">
                                                    {product.features.map((feature, index) => <li key={index}>{feature}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {!showMore && contentHeight > collapsedHeight && (
                                            <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-[#E6E6E6] to-transparent" />
                                        )}
                                    </div>
                                    {contentHeight > collapsedHeight && (
                                        <div className="flex justify-center">
                                            <button onClick={() => setShowMore(!showMore)}
                                                className="mt-6 flex items-center gap-2 text-[16px] text-[#535353] hover:text-[#003049] transition-colors">
                                                {showMore ? "Show Less" : "Show More"}
                                                <ChevronDown className={`transition-transform duration-300 ${showMore ? "rotate-180" : ""}`} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ---- REVIEWS TAB ---- */}
                        {activeTab === "reviews" && (
                            <>
                                <h3 className="text-[30px] font-semibold text-[#003049] mb-6">Reviews & Ratings</h3>

                                <RatingSummary reviews={productReviews} />

                                {/* WRITE / ALREADY REVIEWED */}
                                {currentUserId ? (
                                    hasReviewed ? (
                                        <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-5 text-green-700 text-[16px]">
                                            ✓ You&apos;ve already reviewed this product. You can edit your review below.
                                        </div>
                                    ) : (
                                        <div className="mb-8 bg-white border border-[#D9D9D9] rounded-xl p-6 shadow-sm">
                                            <h4 className="text-[20px] font-semibold text-[#003049] mb-4">Write a Review</h4>
                                            <div className="mb-4">
                                                <p className="text-[15px] text-[#535353] mb-2">Your Rating</p>
                                                <StarPicker value={reviewRating} onChange={setReviewRating} />
                                                {reviewRating > 0 && (
                                                    <p className="text-sm text-[#6E6E6E] mt-1">{reviewRating} / 5</p>
                                                )}
                                            </div>
                                            <div className="mb-4">
                                                <p className="text-[15px] text-[#535353] mb-2">Your Review</p>
                                                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                                                    placeholder="Share your thoughts about this product..."
                                                    rows={4}
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[15px] text-[#535353] focus:outline-none focus:ring-1 focus:ring-[#C1121F] resize-none" />
                                            </div>
                                            {reviewError && <p className="text-red-500 text-[14px] mb-3">{reviewError}</p>}
                                            <button onClick={handleSubmitReview} disabled={reviewSubmitting}
                                                className="px-6 py-2.5 rounded-full bg-[#003049] text-white font-semibold text-[15px] hover:bg-[#003049]/90 disabled:opacity-50 transition">
                                                {reviewSubmitting ? "Submitting..." : "Submit Review"}
                                            </button>
                                        </div>
                                    )
                                ) : (
                                    <div className="mb-8 bg-[#F8F9FB] border border-[#D9D9D9] rounded-xl p-5 text-[#535353] text-[15px]">
                                        <a href="/sign-in" className="text-[#C1121F] font-semibold underline">Sign in</a> to leave a review.
                                    </div>
                                )}

                                {/* SORT + COUNT */}
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[15px] text-[#6E6E6E]">
                                        {sortedReviews.length} review{sortedReviews.length !== 1 ? "s" : ""}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[#535353] text-[15px]">Sort by</span>
                                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#C1121F]">
                                            <option>Newest</option>
                                            <option>Oldest</option>
                                            <option>Most Liked</option>
                                            <option>Highest Rated</option>
                                            <option>Lowest Rated</option>
                                        </select>
                                    </div>
                                </div>

                                {/* SCROLLABLE REVIEWS LIST */}
                                <div className="bg-[#E6E6E6] rounded-[11px] border border-[#D9D9D9] shadow-sm overflow-hidden">
                                    {sortedReviews.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#D9D9D9" strokeWidth="1.5" className="w-12 h-12 mb-3">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 0 2 2z" />
                                            </svg>
                                            <p className="text-gray-400 text-[16px]">No reviews yet.</p>
                                            <p className="text-gray-400 text-[14px] mt-1">Be the first to share your thoughts!</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-y-auto max-h-[560px] divide-y divide-gray-300
                                            [&::-webkit-scrollbar]:w-1.5
                                            [&::-webkit-scrollbar-track]:bg-transparent
                                            [&::-webkit-scrollbar-thumb]:bg-gray-300
                                            [&::-webkit-scrollbar-thumb]:rounded-full
                                            [&::-webkit-scrollbar-thumb:hover]:bg-gray-400">
                                            {sortedReviews.map((review) => {
                                                const isLiked = likedReviews.includes(review.id);
                                                const isEditing = editingReviewId === review.id;

                                                return (
                                                    <div key={review.id} className="p-6 hover:bg-white/40 transition-colors">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex gap-4 flex-1 min-w-0">
                                                                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
                                                                    <Image src={review.avatar} alt={review.name} fill className="object-cover" />
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h4 className="font-semibold text-[#003049] text-[16px]">{review.name}</h4>
                                                                        {review.isOwn && (
                                                                            <span className="text-[11px] bg-[#003049] text-white px-2 py-0.5 rounded-full leading-none">You</span>
                                                                        )}
                                                                    </div>

                                                                    {isEditing ? (
                                                                        <div className="mt-2 bg-white border border-[#D9D9D9] rounded-xl p-4">
                                                                            <p className="text-[13px] text-[#535353] mb-2 font-medium">Edit Rating</p>
                                                                            <StarPicker value={editRating} onChange={setEditRating} />
                                                                            {editRating > 0 && (
                                                                                <p className="text-sm text-[#6E6E6E] mt-1">{editRating} / 5</p>
                                                                            )}
                                                                            <p className="text-[13px] text-[#535353] mt-3 mb-2 font-medium">Edit Review</p>
                                                                            <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                                                                                rows={3}
                                                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px] text-[#535353] focus:outline-none focus:ring-1 focus:ring-[#C1121F] resize-none" />
                                                                            {editError && <p className="text-red-500 text-[13px] mt-1">{editError}</p>}
                                                                            <div className="flex gap-2 mt-3">
                                                                                <button onClick={() => handleSaveEdit(review.id)} disabled={editSubmitting}
                                                                                    className="px-4 py-1.5 rounded-full bg-[#003049] text-white text-[13px] font-semibold disabled:opacity-50 hover:bg-[#003049]/90 transition">
                                                                                    {editSubmitting ? "Saving..." : "Save changes"}
                                                                                </button>
                                                                                <button onClick={cancelEdit}
                                                                                    className="px-4 py-1.5 rounded-full border border-gray-300 text-[#535353] text-[13px] font-semibold hover:bg-gray-100 transition">
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <StarDisplay rating={review.rating} size="sm" />
                                                                            <p className="text-[#535353] text-[15px] leading-6 mt-2">{review.comment}</p>
                                                                            <div className="flex items-center gap-4 mt-3">
                                                                                <button onClick={() => toggleLike(review.id)}
                                                                                    className="flex items-center gap-1.5 text-[14px] text-[#535353] hover:text-[#C1121F] transition">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                                                        fill={isLiked ? "#C1121F" : "none"} stroke="#C1121F" strokeWidth="2" className="w-4 h-4">
                                                                                        <path d="M20.8 4.6c-1.5-1.6-4-1.6-5.5 0l-.8.8-.8-.8c-1.5-1.6-4-1.6-5.5 0-1.6 1.6-1.6 4.1 0 5.7l6.3 6.5 6.3-6.5c1.6-1.6 1.6-4.1 0-5.7z" />
                                                                                    </svg>
                                                                                    <span>{isLiked ? review.likes + 1 : review.likes} {isLiked ? "Liked" : "Like"}</span>
                                                                                </button>

                                                                                {review.isOwn && (
                                                                                    <button onClick={() => startEdit(review)}
                                                                                        className="flex items-center gap-1 text-[13px] text-[#6E6E6E] hover:text-[#003049] transition">
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                                                        </svg>
                                                                                        Edit review
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <span className="text-[13px] text-[#6E6E6E] whitespace-nowrap flex-shrink-0">{review.date}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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