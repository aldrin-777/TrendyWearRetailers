'use server';

import { createClient } from '@/utils/supabase/server'

export async function proceedDelivery(order_id: number) {
  const supabase = await createClient()

  // Get the current status
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('status')
    .eq('id', order_id)
    .single()

  if (fetchError || !order) {
    throw new Error(`Failed to fetch order: ${fetchError?.message}`)
  }

  // Determine the next status
  let nextStatus: string
  switch (order.status) {
    case 'Shipped':
      nextStatus = 'In Transit'
      break
    case 'In Transit':
      nextStatus = 'Delivered'
      break
    case 'Delivered':
      nextStatus = 'Delivered' // Already at final state
      break
    default:
      nextStatus = 'Shipped'
  }

  // Update the order with the new status
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: nextStatus })
    .eq('id', order_id)

  if (updateError) {
    throw new Error(`Failed to update order: ${updateError.message}`)
  }

  return { success: true, newStatus: nextStatus }
}