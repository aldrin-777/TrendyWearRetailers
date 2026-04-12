'use client';

import { createClient } from "@/utils/supabase/client";

export type OrderItems = {
    id: number;
    date: string;
    dateShipped: string | null;
    dateDelivered: string | null;
    status: string;
    total: number;
    items: {
        name: string;
        category: string;
        quantity: number;
        size: string;
        color: string;
        image: string;
    }[];    
}

const BUCKET_NAME = "images";

const formatDate = (dateString: string | null): string | null => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
};

export async function fetchOrders(){
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id;

    if (!user_id) return [];

    const { data:orderData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user_id);
    
    if (error) {
        console.error('Error fetching orders:', error);
        throw new Error('Failed to fetch orders');
    }

    const {data:orderItemsData, error: orderItemsError} = await supabase        
        .from('order_items')
        .select(`
            id,
            orders_id,
            quantity,
            price_at_checkout,
            created_at,
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
        .in('orders_id', orderData?.map(o => o.id) ?? []);
    
    if (orderItemsError) {
        console.error('Error fetching order items:', orderItemsError);
        throw new Error('Failed to fetch order items');
    }

    const mapped: OrderItems[] = orderData?.map((o) => {
    const items = orderItemsData
        .filter((oi) => oi.orders_id === o.id)
        .map((oi) => {
            const imageUrls = (oi.variant.item.image_id ?? []).map(
                (imgId: string) =>
                    supabase.storage.from(BUCKET_NAME).getPublicUrl(imgId).data.publicUrl
            );
            return {
                name: oi.variant.item.name,
                category: oi.variant.item.tags[0] || 'Uncategorized',
                quantity: oi.quantity,
                size: oi.variant.size,
                color: oi.variant.color,
                image: imageUrls.length > 0 ? imageUrls[0] : "/images/placeholder.jpg",
            };
        });

    return {
        id: o.id,
        date: formatDate(o.created_at) || 'N/A',
        dateShipped: formatDate(o.date_shipped),
        dateDelivered: formatDate(o.date_delivered),
        status: o.status,
        total: o.total_price,
        items
    };
    }) ?? [];

    return mapped
}