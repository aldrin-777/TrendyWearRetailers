'use server'

import { createClient } from '@/utils/supabase/server'

export async function createItem(data: {
  name: string
  description: string
  tags: string
  /** Storage object paths under bucket `images` (uploaded from the client). Empty → placeholder. */
  image_paths: string[] | null
  basePrice: number
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

  const { error: priceError } = await supabase.from('prices').insert({
    item_id: item.id,
    price: data.basePrice,
    priority: 0,
    valid_from: new Date(),
    valid_to: null
  })

  if (priceError) throw new Error(priceError.message)

  return item
}