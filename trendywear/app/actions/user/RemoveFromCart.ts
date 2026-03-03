'use server'

import { createClient } from '@/utils/supabase/server'

export async function removeFromCart(itemId: number) {
  const supabase = await createClient()

  
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user){
    throw new Error('Not authenticated')
  }
  
  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (cartError || !cart) throw new Error('No active cart found')

  
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cart.id)
    .eq('item_id', itemId)

  if (error) throw new Error(error.message)

  return { success: true, message: 'Item removed from cart' }
}