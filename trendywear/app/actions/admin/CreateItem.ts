'use server'

import { createClient } from '@/utils/supabase/server'

export async function createItem(data: {
  name: string
  description: string
  tags: string
  image_paths: string[] | null
  basePrice: number
  sizes: string   // JSON stringified e.g. '["S","M","L"]'
  colors: string  // JSON stringified e.g. '["Red","Blue"]'
  initialQuantity: number
}) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  console.log('AUTH USER:', user?.id)
  console.log('AUTH ERROR:', authError)

  const imagePathArray: string[] =
    data.image_paths && data.image_paths.length > 0
      ? data.image_paths
      : ['placeholder']

  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user?.id)
    .single()

  console.log('DB USER:', dbUser)
  console.log('DB ERROR:', dbError)

  if (!dbUser?.is_admin) throw new Error('Unauthorized')

  // 1. Insert item
  const { data: item, error: itemError } = await supabase
    .from('items')
    .insert({
      name: data.name,
      description: data.description,
      tags: JSON.parse(data.tags),
      image_id: imagePathArray,
    })
    .select()
    .single()

  if (itemError || !item) throw new Error(itemError?.message || 'Failed to create item')

  // 2. Insert base price
  const { error: priceError } = await supabase.from('prices').insert({
    item_id: item.id,
    price: data.basePrice,
    priority: 0,
    valid_from: new Date(),
    valid_to: null
  })

  if (priceError) throw new Error(priceError.message)

  // 3. Generate all size × color combinations
  const sizes: string[] = JSON.parse(data.sizes)
  const colors: string[] = JSON.parse(data.colors)

  if (sizes.length > 0 && colors.length > 0) {
    const variantRows = sizes.flatMap(size =>
      colors.map(color => ({ item_id: item.id, size, color }))
    )

    const { data: insertedVariants, error: variantError } = await supabase
      .from('item_variants')
      .insert(variantRows)
      .select('id')

    if (variantError || !insertedVariants) {
      throw new Error(variantError?.message || 'Failed to create item variants')
    }

    // 4. Insert inventory with provided initial quantity
    const inventoryRows = insertedVariants.map(variant => ({
      variant_id: variant.id,
      quantity: data.initialQuantity ?? 0,
    }))

    const { error: inventoryError } = await supabase
      .from('inventory')
      .insert(inventoryRows)

    if (inventoryError) throw new Error(inventoryError.message)
  }

  return item
}