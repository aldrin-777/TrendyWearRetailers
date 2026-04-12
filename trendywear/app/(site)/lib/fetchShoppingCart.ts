'use client';

import { createClient } from "@/utils/supabase/client";

export type ShoppingCartItem = {
    id: number, 
    name: string, 
    item_id: number,
    category: string, 
    price: number, 
    quantity: number, 
    size: string, 
    color: string, 
    image: string, 
    isFavorite: boolean,
    isEditing: false 
}

const BUCKET_NAME = "images";

export async function fetchShoppingCart(): Promise<ShoppingCartItem[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
const user_id = user?.id;

  const { data: cartForUser, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user_id)
    .eq('status', 'active')
    .maybeSingle();

  if (cartError || !cartForUser) {
    return [];
  }

  const { data: cart_items, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      quantity,
      price_at_time,
      variant:item_variants (
        id,
        size,
        color,
        item:items (
          id,
          name,
          image_id,
          tags
        )
      )
    `)
    .eq("cart_id", cartForUser.id);

  if (error || !cart_items) {
    throw error ?? new Error('No items returned');
  }

  const itemIds = cart_items
    .map((i) => {
      const raw = i.variant as unknown;
      const v = Array.isArray(raw) ? raw[0] : raw;
      if (!v || typeof v !== "object" || !("id" in v)) return null;
      return (v as { id: number }).id;
    })
    .filter((id): id is number => id != null);

  const now = new Date().toISOString();

  const { data: wishlisted } = await supabase
    .from("wishlist")
    .select("item_id")
    .eq("user_id", user_id)
    .in("item_id", itemIds);

  const wishlistSet = new Set<number>();
  if (wishlisted) {
    for (const w of wishlisted) {
      wishlistSet.add(w.item_id);
    }
  }

  const mapped: ShoppingCartItem[] = cart_items.map((ci) => {
    const raw = ci.variant as unknown;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const variant = v as {
      id: number;
      size: string;
      color: string;
      item:
        | { id: number; name: string; image_id: string[] | null; tags: string[] | null }
        | { id: number; name: string; image_id: string[] | null; tags: string[] | null }[]
        | null;
    };
    const itemRaw = variant?.item;
    const item = Array.isArray(itemRaw) ? itemRaw[0] : itemRaw;
    if (!item) {
      return {
        id: ci.id,
        name: "Unnamed",
        item_id: 0,
        category: "Uncategorized",
        price: ci.price_at_time,
        quantity: ci.quantity,
        size: variant?.size ?? "",
        color: variant?.color ?? "",
        image: "/images/placeholder.jpg",
        isFavorite: false,
        isEditing: false,
      };
    }

    const imageUrls = (item.image_id ?? []).map(
      (imgId: string) =>
        supabase.storage.from(BUCKET_NAME).getPublicUrl(imgId).data.publicUrl
    );

    const tag = item.tags?.[0] ?? "Uncategorized";

    return {
      id: ci.id,
      name: item.name ?? "Unnamed",
      item_id: item.id,
      category: tag,
      price: ci.price_at_time,
      quantity: ci.quantity,
      size: variant.size,
      color: variant.color,
      image: imageUrls.length > 0 ? imageUrls[0] : "/images/placeholder.jpg",
      isFavorite: wishlistSet.has(item.id),
      isEditing: false
    };
  });

  return mapped;
}