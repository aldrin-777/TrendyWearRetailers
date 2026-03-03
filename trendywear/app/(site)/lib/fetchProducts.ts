'use client';

import { createClient } from "@/utils/supabase/client";

export type Product = {
    id: number;
    name: string;
    images: string[];
    oldPrice?: number;
    price: number;
    rating: number;
    reviews: number;
    is_liked:boolean;
    colors: string[];
};

const BUCKET_NAME = "images";

export async function fetchProducts(search?: string | null,tags?:string |null):Promise<Product[]> {
    const supabase = createClient();
    const user_id = (await supabase.auth.getSession()).data.session?.user.id

    let query = supabase
        .from("items")
        .select("id, name, image_id, tags");

    if (search && search.trim() !== "") {
        query = query.ilike("name", `%${search}%`);
    }

    if (tags){
        query = query.contains('tags',[tags])
    }

    const { data: items, error } = await query

    if (error || !items) {
        throw error ?? new Error('No items returned');
    }

    const itemIds = items.map((i) => i.id);
    const now = new Date().toISOString();

    const { data: prices } = await supabase
        .from("prices")
        .select("item_id, price")
        .in("item_id", itemIds)
        .lte("valid_from", now)
        .or(`valid_to.is.null,valid_to.gte.${now}`)
        .order("priority", { ascending: false });

    const priceMap: Record<number, number> = {};
    if (prices) {
        for (const p of prices) {
            if (!(p.item_id in priceMap)) priceMap[p.item_id] = p.price;
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

    const mapped:Product[] = items.map((item) => {
        const imageUrls = (item.image_id ?? []).map(
            (imgId: string) =>
                supabase.storage.from(BUCKET_NAME).getPublicUrl(imgId).data.publicUrl
        );
        return {
            id: item.id,
            name: item.name ?? "Unnamed",
            images: imageUrls.length > 0 ? imageUrls : ["/placeholder.jpg"],
            price: priceMap[item.id] ?? 0,
            rating: 0,
            reviews: 0,
            is_liked: wishlistSet.has(item.id),
            colors: [],
        };
    });

    return mapped;
}