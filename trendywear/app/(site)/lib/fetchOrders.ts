'use client';

import { createClient } from "@/utils/supabase/client";

export type OrderItems = {
    id: number;
    orders_id: number;
    product_id: number;
    quantity: number;
    price_at_checkout: number;
    created_at: string;
}

export async function fetchOrders(){

}