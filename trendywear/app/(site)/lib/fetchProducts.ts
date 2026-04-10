'use client';

import { createClient } from "@/utils/supabase/client";

export type Product = {
    id: number;
    name: string;
    images: string[];
    oldPrice?: number | null;
    price: number;
    rating: number;
    reviews: number;
    is_liked: boolean;
    colors: string[];
    tags: string[];
};

const BUCKET_NAME = "images";

export type SortOption = "name" | "price_asc" | "rating" | null;

export async function fetchProducts(
    search?: string | null,
    tags?: string | null,
    sortBy?: SortOption
): Promise<Product[]> {
    const supabase = createClient();

    // ✅ Use getUser() to avoid navigator lock timeout
    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id;

    let query = supabase
        .from("items")
        .select("id, name, image_id, tags")
        .eq("is_active", true);

    if (search && search.trim() !== "") {
        query = query.ilike("name", `%${search}%`);
    }

    if (tags) {
        query = query.contains("tags", [tags]);
    }

    const { data: items, error } = await query;

    if (error || !items) {
        throw error ?? new Error("No items returned");
    }

    const itemIds = items.map((i) => i.id);
    const now = new Date().toISOString();

    // Fetch prices
    const { data: prices } = await supabase
        .from("prices")
        .select("item_id, price")
        .in("item_id", itemIds)
        .lte("valid_from", now)
        .or(`valid_to.is.null,valid_to.gte.${now}`)
        .order("priority", { ascending: false });

    const priceGroups: Record<string, number[]> = {};

    for (const p of prices ?? []) {
        if (!priceGroups[p.item_id]) {
            priceGroups[p.item_id] = [];
        }
        priceGroups[p.item_id].push(p.price);
    }
    
    // Fetch wishlist
    const wishlistSet = new Set<number>();
    if (user_id) {
        const { data: wishlisted } = await supabase
            .from("wishlist")
            .select("item_id")
            .eq("user_id", user_id)
            .in("item_id", itemIds);
        if (wishlisted) {
            for (const w of wishlisted) wishlistSet.add(w.item_id);
        }
    }

    // ✅ Fetch reviews to compute real avg rating + count
    const { data: reviews } = await supabase
        .from("reviews")
        .select("item_id, rating")
        .in("item_id", itemIds);

    const ratingMap: Record<number, { sum: number; count: number }> = {};
    if (reviews) {
        for (const r of reviews) {
            if (!ratingMap[r.item_id]) ratingMap[r.item_id] = { sum: 0, count: 0 };
            ratingMap[r.item_id].sum += r.rating;
            ratingMap[r.item_id].count += 1;
        }
    }

    const mapped: Product[] = items.map((item) => {
        const imageUrls = (item.image_id ?? []).map(
            (imgId: string) =>
                supabase.storage.from(BUCKET_NAME).getPublicUrl(imgId).data.publicUrl
        );
        const rd = ratingMap[item.id];
        const avgRating = rd ? Math.round((rd.sum / rd.count) * 10) / 10 : 0;
        const currentPrice: number = priceGroups[item.id]?.[0] ?? 0;
        const oldPrice: number | null =
        priceGroups[item.id]?.length > 1
            ? priceGroups[item.id][1]
            : null;

        return {
            id: item.id,
            name: item.name ?? "Unnamed",
            images: imageUrls.length > 0 ? imageUrls : ["/placeholder.jpg"],
            price: currentPrice,
            oldPrice: oldPrice,
            rating: avgRating,
            reviews: rd?.count ?? 0,
            is_liked: wishlistSet.has(item.id),
            colors: [],
            tags: item.tags ?? [],
        };
    });

    // Apply sorting
    if (sortBy === "price_asc") {
        mapped.sort((a, b) => a.price - b.price);
    } else if (sortBy === "rating") {
        mapped.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "name") {
        mapped.sort((a, b) => a.name.localeCompare(b.name));
    }

    return mapped;
}