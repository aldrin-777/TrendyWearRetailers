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
    is_liked: boolean;
    colors: string[];
};

interface Item {
  id: number;
  name: string;
  image_id: string[];
  tags?: string[]; // Match your DB schema
}

const BUCKET_NAME = "images";

// Pass the category string here (which acts as a tag)
export async function fetchFavorites(tag?: string): Promise<Product[]> {
    const supabase = createClient();
    const user_id = (await supabase.auth.getSession()).data.session?.user.id;

    if (!user_id) return [];

    let query = supabase
      .from("wishlist")
      // Use !inner and select tags instead of category
      .select("item:items!inner(id, name, image_id, tags)") 
      .eq("user_id", user_id);

    // Filter using the exact same logic from your fetchProducts reference
    if (tag) {
      query = query.contains("items.tags", [tag]);
    }

    const { data: raw_items, error } = await query;

    if (error || !raw_items) {
        throw error ?? new Error('No items returned');
    }

    const items: Item[] = raw_items?.flatMap(
      (w: any) => w.item
    ) || [];

    const itemIds = items.map((i) => i.id);
    
    if (itemIds.length === 0) return [];

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

    const mapped: Product[] = items.map((item) => {
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
            is_liked: itemIds.includes(item.id),
            colors: [],
        };
    });

    return mapped;
}