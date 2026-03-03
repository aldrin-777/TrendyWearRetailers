'use client';

import { createClient } from "@/utils/supabase/client";

export type ShoppingCartItem = {
    id: number, 
    name: string, 
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
  const user_id = (await supabase.auth.getSession()).data.session?.user.id;

  const { data: cartForUser, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user_id)
    .eq('status', 'active')
    .maybeSingle();

  if (cartError || !cartForUser) {
    throw cartError ?? new Error('No active cart found');
  }

  const { data: cart_items, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      quantity,
      item:items (
        id,
        name,
        image_id,
        tags
      )
    `)
    .eq("cart_id", cartForUser.id);

  if (error || !cart_items) {
    throw error ?? new Error('No items returned');
  }

  const itemIds = cart_items.map(i => i.item.id);

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
    const imageUrls = (ci.item.image_id ?? []).map(
      (imgId: string) =>
        supabase.storage.from(BUCKET_NAME).getPublicUrl(imgId).data.publicUrl
    );

    return {
      id: ci.id,
      name: ci.item.name ?? "Unnamed",
      category: ci.item.tags,
      price: 0, // you'd fetch from prices table properly
      quantity: ci.quantity,
      size: 'N/A',
      color: 'N/A',
      image: imageUrls.length > 0 ? imageUrls[0]: "/images/placeholder.jpg",
      isFavorite: wishlistSet.has(ci.item.id),
      isEditing: false
    };
  });

  return mapped;
}