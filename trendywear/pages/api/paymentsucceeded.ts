import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'; 

type ResponseData = { message: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    try {
        // Check if body exists
        if (!req.body) {
            return res.status(400).json({ message: "No request body received" });
        }

        const body = req.body;

        // Safe extraction using optional chaining
        const amount = body.data?.amount ?? "No amount found";
        const userId = body.data?.metadata?.user_id ?? "No User ID in metadata";

        if (req.method === 'POST') {
            // Create a new order row for the user, Table: orders
            const { data: newOrder, error: newOrderError } = await supabase
                .from('orders')
                .insert({
                    user_id: userId,
                    total_price: Number(amount) ?? 100.00,
                })
                .select()
                .single();

            if (newOrderError) {
                return res.status(400).json({ message: `Failed to create order: ${newOrderError}` });
            }

            // Fetch the user's active cart and its items Tables: shopping_cart, cart_items
            const {data:cart_id,error:cart_error}= await supabase
                .from('carts')
                .select('*')
                .eq('user_id', userId)
                .single()

            if (cart_error) {
                return res.status(400).json({ message: "Cannot Find cart_id of User." });
            }
            
            const { data: cartItems, error: fetchError } = await supabase
                .from('cart_items')
                .select('*')
                .eq('cart_id', cart_id.id);
            
            if (fetchError) {
                return res.status(400).json({ message: "Cannot Fetch Cart_Items" });
            }

            // Insert cart items into order_items table with the new order_id
            const { error: insertError } = await supabase
                .from('order_items')
                .insert(
                    cartItems.map(item => ({
                        orders_id: newOrder.id,
                        variant_id: item.variant_id,
                        quantity: item.quantity,
                        price_at_checkout: item.price_at_time,
                    }))
                );
            
            if (insertError) {
                return res.status(400).json({ message: "Cannot Find cart_id of User." });
            }

            const { error: clearCartError } = await supabase
                .from('cart_items')
                .delete()
                .eq('cart_id', cart_id.id);
            if (clearCartError) {
                return res.status(400).json({ message: `Failed to clear cart: ${clearCartError}` });
            }

            return res.status(200).json({
                message: `Received data: [Amount: ${amount}, User ID: ${userId}]`
            });
        }
    } catch (error) {
        console.error("Handler error:", error);

        return res.status(500).json({
            message: `Internal server error: ${error}`
        });
    }
}

        
